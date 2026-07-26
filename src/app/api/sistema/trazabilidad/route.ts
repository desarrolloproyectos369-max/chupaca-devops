import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get("codigo");

    if (!codigo) {
      return NextResponse.json({ error: "Debe proveer un código de expediente." }, { status: 400 });
    }

    // 1. Buscar el Expediente
    const expediente = await prisma.expediente.findUnique({
      where: { codigo },
      include: {
        tipoDocumental: true,
        registrador: {
          select: { nombres: true, apellidos: true, dni: true }
        }
      }
    });

    if (!expediente) {
      return NextResponse.json({ error: "Expediente no encontrado." }, { status: 404 });
    }

    // 2. Buscar Derivaciones
    const derivaciones = await prisma.derivacion.findMany({
      where: { expedienteId: expediente.id },
      include: {
        origen: { select: { nombres: true, apellidos: true } },
        destinoUsuario: { select: { nombres: true, apellidos: true } },
        destinoUnidad: { select: { nombre: true } }
      },
      orderBy: { creadoEn: 'asc' }
    });

    // 3. Buscar Auditoría (cualquier registro de auditoria donde detalles mencione este expediente)
    const auditoria = await prisma.auditoria.findMany({
      where: {
        detalles: { contains: codigo }
      },
      include: {
        usuario: { select: { nombres: true, apellidos: true } }
      },
      orderBy: { creadoEn: 'asc' }
    });

    // 4. Construir la Línea de Tiempo Unificada
    const timeline = [];

    // Agregar Creación
    timeline.push({
      id: `crea-${expediente.id}`,
      fecha: expediente.creadoEn,
      tipo: 'CREACION',
      titulo: 'Expediente Registrado (Mesa de Partes)',
      responsable: `${expediente.registrador.nombres} ${expediente.registrador.apellidos}`,
      detalles: `Asunto: ${expediente.asunto} | Folios: ${expediente.folios}`
    });

    // Agregar Derivaciones
    derivaciones.forEach((d: any) => {
      const destinatario = d.destinoUsuario 
        ? `${d.destinoUsuario.nombres} ${d.destinoUsuario.apellidos}`
        : (d.destinoUnidad ? `el área de ${d.destinoUnidad.nombre}` : 'Destinatario desconocido');
        
      timeline.push({
        id: `deriv-${d.id}`,
        fecha: d.creadoEn,
        tipo: 'DERIVACION',
        titulo: 'Derivación de Expediente',
        responsable: `${d.origen.nombres} ${d.origen.apellidos}`,
        detalles: `Enviado a ${destinatario}. ${d.instrucciones ? `Instrucciones: ${d.instrucciones}` : ''}`
      });
    });

    // Agregar Auditoria
    auditoria.forEach(a => {
      // Evitar duplicar el evento de creación si el sistema de auditoría ya lo registró
      if (a.accion === 'REGISTRO_EXPEDIENTE') return;

      timeline.push({
        id: `aud-${a.id}`,
        fecha: a.creadoEn,
        tipo: 'AUDITORIA',
        titulo: a.accion.replace(/_/g, ' '),
        responsable: a.usuario ? `${a.usuario.nombres} ${a.usuario.apellidos}` : 'Sistema',
        detalles: `${a.detalles} (IP: ${a.ip || 'N/A'})`
      });
    });

    // Ordenar todo cronológicamente
    timeline.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    return NextResponse.json({
      success: true,
      expediente: {
        codigo: expediente.codigo,
        estado: expediente.estado,
        fecha: expediente.creadoEn,
        asunto: expediente.asunto,
        remitente: `${expediente.nombresRemitente} ${expediente.apellidosRemitente}`
      },
      timeline
    });

  } catch (error) {
    console.error("Error al consultar trazabilidad:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    
    // Solo Jefes o Funcionarios pueden aprobar
    const isJefe = session.rolNombre === "Jefe o responsable de área" || session.rolNombre === "Funcionario firmante";
    if (!isJefe) {
      return NextResponse.json({ error: "No tienes permisos para dar Visto Bueno" }, { status: 403 });
    }

    const paramsResolved = await context.params;
    const expedienteId = parseInt(paramsResolved.id);
    const docId = parseInt(paramsResolved.docId);

    const { accion, observaciones } = await request.json(); // accion = 'APROBAR' | 'OBSERVAR'

    if (!['APROBAR', 'OBSERVAR'].includes(accion)) {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }

    const documento = await prisma.documentoInterno.findUnique({
      where: { id: docId },
      include: { autor: { select: { unidadId: true } } }
    });

    if (!documento) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    // Verificar que el Jefe pertenezca a la misma unidad orgánica que el autor
    if (documento.autor.unidadId !== session.unidadId) {
      return NextResponse.json({ error: "No puedes aprobar documentos de otras áreas" }, { status: 403 });
    }

    const estadoNuevo = accion === 'APROBAR' ? 'APROBADO' : 'OBSERVADO';

    const documentoActualizado = await prisma.documentoInterno.update({
      where: { id: docId },
      data: {
        estadoAprobacion: estadoNuevo,
        revisorId: session.id,
        fechaAprobacion: new Date(),
        observacionesRevisor: accion === 'OBSERVAR' ? observaciones : null
      }
    });

    // Registrar en auditoría
    await prisma.auditoria.create({
      data: {
        usuarioId: session.id,
        accion: `VISTO_BUENO_${accion}`,
        modulo: "Trámite Documentario",
        detalles: `${estadoNuevo} el ${documento.tipo} (ID: ${docId}) del expediente: ${expedienteId}`,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1"
      }
    });

    // Notificar al autor original
    if (documento.autorId !== session.id) {
      await prisma.notificacion.create({
        data: {
          usuarioId: documento.autorId,
          expedienteId: expedienteId,
          tipo: accion === 'OBSERVAR' ? 'URGENTE' : 'NORMAL',
          mensaje: `Tu ${documento.tipo} ha sido ${estadoNuevo.toLowerCase()} por ${session.nombres} ${session.apellidos}. ${observaciones ? `Obs: ${observaciones}` : ''}`
        }
      });
    }

    return NextResponse.json(documentoActualizado);
  } catch (error: any) {
    console.error("Error al dar visto bueno:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

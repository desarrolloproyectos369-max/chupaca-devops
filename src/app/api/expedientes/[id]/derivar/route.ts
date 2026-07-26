import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paramsResolved = await params;
    const expedienteId = parseInt(paramsResolved.id);
    const body = await request.json();
    const { destinoUnidadId, instrucciones } = body;

    if (!destinoUnidadId) {
      return NextResponse.json({ error: "Debe seleccionar un área de destino" }, { status: 400 });
    }

    const userIdStr = request.headers.get("x-user-id") || "1";
    const userId = parseInt(userIdStr);

    const expediente = await prisma.expediente.findUnique({
      where: { id: expedienteId }
    });

    if (!expediente) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    // 1. Crear el registro de Derivación (Movimiento)
    const derivacion = await prisma.derivacion.create({
      data: {
        expedienteId,
        origenId: userId,
        destinoUnidadId: parseInt(destinoUnidadId),
        instrucciones: instrucciones || null,
        estado: "PENDIENTE"
      }
    });

    // 2. Actualizar el estado del expediente a EN_PROCESO (si no lo estaba ya)
    if (expediente.estado === "REGISTRADO") {
      await prisma.expediente.update({
        where: { id: expedienteId },
        data: { estado: "EN_PROCESO" }
      });
    }

    // 3. Registrar Auditoría
    const unidadDestino = await prisma.unidadOrganica.findUnique({
      where: { id: parseInt(destinoUnidadId) }
    });

    const usuarioOrigen = await prisma.usuario.findUnique({
      where: { id: userId }
    });

    // 4. Crear Notificaciones para todos los usuarios del área (RF-28)
    const usuariosDestino = await prisma.usuario.findMany({
      where: { unidadId: parseInt(destinoUnidadId) }
    });

    if (usuariosDestino.length > 0) {
      await prisma.notificacion.createMany({
        data: usuariosDestino.map(u => ({
          usuarioId: u.id,
          mensaje: `Nuevo expediente ${expediente.codigo} derivado a su área desde ${usuarioOrigen?.nombres} ${usuarioOrigen?.apellidos}`,
          tipo: expediente.prioridad === "NORMAL" ? "NORMAL" : "URGENTE",
          expedienteId: expedienteId
        }))
      });
    }

    await prisma.auditoria.create({
      data: {
        usuarioId: userId,
        accion: "DERIVAR_EXPEDIENTE",
        modulo: "Trámite Documentario",
        detalles: `Expediente ${expediente.codigo} derivado a ${unidadDestino?.nombre || destinoUnidadId}`,
        ip: request.headers.get("x-forwarded-for") || "unknown"
      }
    });

    return NextResponse.json(derivacion, { status: 201 });
  } catch (error: any) {
    console.error("Error al derivar expediente:", error);
    return NextResponse.json({ error: "Error interno al derivar el expediente" }, { status: 500 });
  }
}

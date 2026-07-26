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
    const { destinoUsuarioId, instrucciones } = body;

    if (!destinoUsuarioId) {
      return NextResponse.json({ error: "Debe seleccionar un trabajador de destino" }, { status: 400 });
    }

    const userIdStr = request.headers.get("x-user-id") || "1";
    const userId = parseInt(userIdStr);

    const expediente = await prisma.expediente.findUnique({
      where: { id: expedienteId }
    });

    if (!expediente) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    // 1. Crear el registro de Derivación (Movimiento tipo Reasignación)
    const derivacion = await prisma.derivacion.create({
      data: {
        expedienteId,
        origenId: userId,
        destinoUsuarioId: parseInt(destinoUsuarioId),
        instrucciones: instrucciones || null,
        estado: "PENDIENTE" // Pendiente de que el trabajador lo abra
      }
    });

    // 2. Registrar Auditoría
    const usuarioDestino = await prisma.usuario.findUnique({
      where: { id: parseInt(destinoUsuarioId) }
    });

    const usuarioOrigen = await prisma.usuario.findUnique({
      where: { id: userId }
    });

    // 3. Crear Notificación (RF-28)
    await prisma.notificacion.create({
      data: {
        usuarioId: parseInt(destinoUsuarioId),
        mensaje: `Te han reasignado el expediente ${expediente.codigo} desde ${usuarioOrigen?.nombres} ${usuarioOrigen?.apellidos}`,
        tipo: expediente.prioridad === "NORMAL" ? "NORMAL" : "URGENTE",
        expedienteId: expedienteId
      }
    });

    await prisma.auditoria.create({
      data: {
        usuarioId: userId,
        accion: "REASIGNAR_EXPEDIENTE",
        modulo: "Trámite Documentario",
        detalles: `Expediente ${expediente.codigo} reasignado internamente a ${usuarioDestino?.nombres} ${usuarioDestino?.apellidos}`,
        ip: request.headers.get("x-forwarded-for") || "unknown"
      }
    });

    return NextResponse.json(derivacion, { status: 201 });
  } catch (error: any) {
    console.error("Error al reasignar expediente:", error);
    return NextResponse.json({ error: "Error interno al reasignar el expediente" }, { status: 500 });
  }
}

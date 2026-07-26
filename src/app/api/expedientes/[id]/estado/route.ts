import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const expedienteId = parseInt(paramsResolved.id);
    const body = await request.json();
    const { estado, justificacion } = body;

    const estadosValidos = ["REGISTRADO", "EN_PROCESO", "OBSERVADO", "FINALIZADO", "ARCHIVADO"];
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
    }

    const userIdStr = request.headers.get("x-user-id") || "1";
    const userId = parseInt(userIdStr);

    const expediente = await prisma.expediente.findUnique({
      where: { id: expedienteId }
    });

    if (!expediente) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    // 1. Actualizar el estado del expediente
    const expActualizado = await prisma.expediente.update({
      where: { id: expedienteId },
      data: { estado }
    });

    // Crear un registro en la línea de tiempo (como una Derivación sin destino)
    await prisma.derivacion.create({
      data: {
        expedienteId,
        origenId: userId,
        instrucciones: `El estado del expediente fue cambiado a ${estado}.${justificacion ? ' Motivo: ' + justificacion : ''}`,
        estado: 'ATENDIDO' // Es solo un registro informativo
      }
    });

    // Registrar en auditoría
    await prisma.auditoria.create({
      data: {
        usuarioId: userId,
        accion: "CAMBIO_ESTADO",
        modulo: "Trámite Documentario",
        detalles: `El expediente ${expediente.codigo} cambió a estado ${estado}. Justificación: ${justificacion || 'No especificada'}`,
        ip: request.headers.get("x-forwarded-for") || "unknown"
      }
    });

    return NextResponse.json(expActualizado, { status: 200 });
  } catch (error: any) {
    console.error("Error al cambiar estado:", error);
    return NextResponse.json({ error: "Error interno al cambiar el estado" }, { status: 500 });
  }
}

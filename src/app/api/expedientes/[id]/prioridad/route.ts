import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const expedienteId = parseInt(paramsResolved.id);

    const data = await request.json();
    const { prioridad } = data; // "NORMAL", "ALTA", "URGENTE"

    if (!prioridad || !["NORMAL", "ALTA", "URGENTE"].includes(prioridad)) {
      return NextResponse.json({ error: "Prioridad inválida" }, { status: 400 });
    }

    const userIdStr = request.headers.get("x-user-id") || "1";
    const userId = parseInt(userIdStr);

    // 1. Actualizar la prioridad del expediente
    const expActualizado = await prisma.expediente.update({
      where: { id: expedienteId },
      data: { prioridad }
    });

    // 2. Registrar en auditoría
    await prisma.auditoria.create({
      data: {
        usuarioId: userId,
        accion: "CAMBIAR_PRIORIDAD",
        modulo: "Trámite Documentario",
        detalles: `Prioridad del expediente ${expActualizado.codigo} cambiada a ${prioridad}`,
        ip: request.headers.get("x-forwarded-for") || "unknown"
      }
    });

    return NextResponse.json(expActualizado, { status: 200 });
  } catch (error: any) {
    console.error("Error al cambiar prioridad:", error);
    return NextResponse.json({ error: "Error interno al cambiar la prioridad" }, { status: 500 });
  }
}

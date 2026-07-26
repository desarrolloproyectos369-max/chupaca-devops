import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await context.params;
    const { id } = paramsResolved;
    const userId = parseInt(request.headers.get("x-user-id") || "1");

    // Verificar que la notificacion existe y pertenece al usuario
    const notificacion = await prisma.notificacion.findUnique({
      where: { id: parseInt(id) }
    });

    if (!notificacion) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    if (notificacion.usuarioId !== userId) {
      return NextResponse.json({ error: "No tienes permiso para leer esta notificación" }, { status: 403 });
    }

    const actualizada = await prisma.notificacion.update({
      where: { id: parseInt(id) },
      data: { leido: true }
    });

    return NextResponse.json(actualizada);
  } catch (error: any) {
    console.error("Error al leer notificación:", error);
    return NextResponse.json(
      { error: "Error al actualizar la notificación" },
      { status: 500 }
    );
  }
}

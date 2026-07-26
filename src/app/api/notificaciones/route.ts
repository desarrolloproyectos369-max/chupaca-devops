import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "1");

    const notificaciones = await prisma.notificacion.findMany({
      where: {
        usuarioId: userId,
      },
      take: 20,
      include: {
        expediente: {
          select: {
            codigo: true,
            asunto: true,
          }
        }
      },
      orderBy: {
        creadoEn: 'desc'
      }
    });

    return NextResponse.json(notificaciones);
  } catch (error: any) {
    console.error("Error al obtener notificaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "1");

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { unidadId: true }
    });

    if (!usuario || !usuario.unidadId) {
      return NextResponse.json([]);
    }

    const empleados = await prisma.usuario.findMany({
      where: { 
        unidadId: usuario.unidadId,
        activo: true
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        rol: {
          select: { nombre: true }
        }
      }
    });

    return NextResponse.json({ empleados, miId: userId });
  } catch (error) {
    console.error("Error al obtener empleados de mi área:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

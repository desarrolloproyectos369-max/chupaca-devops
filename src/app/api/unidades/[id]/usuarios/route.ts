import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const unidadId = parseInt(paramsResolved.id);

    const usuarios = await prisma.usuario.findMany({
      where: {
        unidadId: unidadId,
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

    return NextResponse.json(usuarios);
  } catch (error: any) {
    console.error("Error al obtener usuarios por unidad:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

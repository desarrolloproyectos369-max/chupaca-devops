import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paramsResolved = await params;
    const expedienteId = parseInt(paramsResolved.id);

    const historial = await prisma.derivacion.findMany({
      where: {
        expedienteId: expedienteId
      },
      include: {
        origen: {
          select: {
            nombres: true,
            apellidos: true,
            rol: {
              select: {
                nombre: true
              }
            }
          }
        },
        destinoUnidad: {
          select: {
            nombre: true
          }
        },
        destinoUsuario: {
          select: {
            nombres: true,
            apellidos: true
          }
        }
      },
      orderBy: {
        creadoEn: 'asc' // Del más antiguo al más reciente
      }
    });

    return NextResponse.json(historial);
  } catch (error: any) {
    console.error("Error al obtener historial:", error);
    return NextResponse.json({ error: "Error interno al obtener el historial" }, { status: 500 });
  }
}

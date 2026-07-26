import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const unidades = await prisma.unidadOrganica.findMany({
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json(unidades);
  } catch (error) {
    console.error("GET Unidades Error:", error);
    return NextResponse.json({ error: "Error al obtener unidades" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.nombre || body.nombre.trim() === '') {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const nuevaUnidad = await prisma.unidadOrganica.create({
      data: {
        nombre: body.nombre.trim(),
        siglas: body.siglas ? body.siglas.trim() : null,
      }
    });

    // Auditoría Transversal (RF-33)
    const userId = request.headers.get("x-user-id");
    if (userId) {
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: parseInt(userId),
            accion: "CREAR_UNIDAD",
            modulo: "Unidades Orgánicas",
            detalles: `Creó: ${nuevaUnidad.nombre}`,
            ip: request.headers.get("x-forwarded-for") || "unknown"
          }
        });
      } catch (e) {
        console.error("Error al registrar auditoría:", e);
      }
    }

    return NextResponse.json(nuevaUnidad, { status: 201 });
  } catch (error: any) {
    console.error("POST Unidades Error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Ya existe una unidad orgánica con ese nombre" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

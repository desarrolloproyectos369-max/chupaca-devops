import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const tipos = await prisma.tipoDocumental.findMany({
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json(tipos);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener tipos documentales" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.nombre || body.nombre.trim() === '') {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const nuevoTipo = await prisma.tipoDocumental.create({
      data: {
        nombre: body.nombre.trim(),
        descripcion: body.descripcion ? body.descripcion.trim() : null,
        plazoDias: body.plazoDias ? parseInt(body.plazoDias) : 30,
        requisitos: body.requisitos || []
      }
    });

    const userId = request.headers.get("x-user-id");
    if (userId) {
      await prisma.auditoria.create({
        data: {
          usuarioId: parseInt(userId),
          accion: "CREAR_TIPO_DOC",
          modulo: "Tipos Documentales",
          detalles: `Creó tipo: ${nuevoTipo.nombre}`,
          ip: request.headers.get("x-forwarded-for") || "unknown"
        }
      });
    }

    return NextResponse.json(nuevoTipo, { status: 201 });
  } catch (error: any) {
    // Si quisieramos restringir duplicidad de nombres podríamos capturar P2002 
    // asumiendo que hubieramos puesto @unique en el schema.prisma
    return NextResponse.json({ error: "Error al registrar el tipo documental" }, { status: 500 });
  }
}

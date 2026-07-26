import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Listar incidencias (Admin ve todas, Usuario ve las suyas)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    let incidencias;

    if (userRole === "Administrador funcional" || userRole === "Administrador técnico") {
      incidencias = await prisma.incidencia.findMany({
        include: {
          reportadoPor: { select: { nombres: true, apellidos: true, correo: true } }
        },
        orderBy: { creadoEn: 'desc' }
      });
    } else {
      incidencias = await prisma.incidencia.findMany({
        where: { reportadoPorId: parseInt(userId) },
        orderBy: { creadoEn: 'desc' }
      });
    }

    return NextResponse.json({ success: true, data: incidencias });
  } catch (error) {
    console.error("Error al obtener incidencias:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// Crear una incidencia
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { titulo, descripcion, prioridad } = await request.json();

    if (!titulo || !descripcion) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const nuevaIncidencia = await prisma.incidencia.create({
      data: {
        titulo,
        descripcion,
        prioridad: prioridad || "MEDIA",
        reportadoPorId: parseInt(userId),
        estado: "PENDIENTE"
      }
    });

    return NextResponse.json({ success: true, data: nuevaIncidencia });
  } catch (error) {
    console.error("Error al crear incidencia:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// Actualizar incidencia (ej. Cambiar estado)
export async function PUT(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    
    // Solo los administradores pueden cambiar estado libremente
    if (userRole !== "Administrador funcional" && userRole !== "Administrador técnico") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id, estado } = await request.json();

    if (!id || !estado) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const incidencia = await prisma.incidencia.update({
      where: { id: parseInt(id) },
      data: { estado }
    });

    return NextResponse.json({ success: true, data: incidencia });
  } catch (error) {
    console.error("Error al actualizar incidencia:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

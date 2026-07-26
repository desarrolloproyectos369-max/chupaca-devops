import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const expedienteId = parseInt(paramsResolved.id);

    // In a real app, you would get the user ID and role from the session token
    // Since we mock auth via headers in this project, we'll get it from there
    const userIdHeader = request.headers.get("x-user-id");
    
    if (!userIdHeader) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = parseInt(userIdHeader);
    const body = await request.json().catch(() => ({}));
    const { desarchivar } = body;

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true }
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const expediente = await prisma.expediente.findUnique({
      where: { id: expedienteId }
    });

    if (!expediente) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    if (desarchivar) {
      if (usuario.rol.nombre !== "Administrador funcional" && usuario.rol.nombre !== "ADMINISTRADOR") {
        return NextResponse.json({ error: "Solo los administradores pueden desarchivar expedientes" }, { status: 403 });
      }

      await prisma.expediente.update({
        where: { id: expedienteId },
        data: { estado: "EN_PROCESO" }
      });

      await prisma.auditoria.create({
        data: {
          usuarioId: userId,
          accion: "DESARCHIVAR_EXPEDIENTE",
          modulo: "Gestión de Expedientes",
          detalles: `El administrador desarchivó el expediente ${expediente.codigo} y lo regresó a EN_PROCESO.`,
          ip: request.headers.get("x-forwarded-for") || "unknown"
        }
      });

      return NextResponse.json({ message: "Expediente desarchivado con éxito" });
    } else {
      if (expediente.estado === "ARCHIVADO") {
        return NextResponse.json({ error: "El expediente ya está archivado" }, { status: 400 });
      }

      await prisma.expediente.update({
        where: { id: expedienteId },
        data: { estado: "ARCHIVADO" }
      });

      await prisma.auditoria.create({
        data: {
          usuarioId: userId,
          accion: "ARCHIVAR_EXPEDIENTE",
          modulo: "Gestión de Expedientes",
          detalles: `El expediente ${expediente.codigo} fue cerrado y archivado.`,
          ip: request.headers.get("x-forwarded-for") || "unknown"
        }
      });

      return NextResponse.json({ message: "Expediente archivado con éxito" });
    }
  } catch (error: any) {
    console.error("Error al archivar/desarchivar expediente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paramsResolved = await params;
    const id = parseInt(paramsResolved.id);
    const body = await request.json();

    if (!body.nombre || body.nombre.trim() === '') {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const tipoActualizado = await prisma.tipoDocumental.update({
      where: { id },
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
          accion: "EDITAR_TIPO_DOC",
          modulo: "Tipos Documentales",
          detalles: `Editó tipo ID: ${id}`,
          ip: request.headers.get("x-forwarded-for") || "unknown"
        }
      });
    }

    return NextResponse.json(tipoActualizado);
  } catch (error: any) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paramsResolved = await params;
    const id = parseInt(paramsResolved.id);

    // TODO: En un futuro, antes de eliminar debemos validar si existen Expedientes usándolo.
    // Como aún no tenemos la tabla Expediente, borramos directo.

    const tipo = await prisma.tipoDocumental.delete({
      where: { id }
    });

    const userId = request.headers.get("x-user-id");
    if (userId) {
      await prisma.auditoria.create({
        data: {
          usuarioId: parseInt(userId),
          accion: "ELIMINAR_TIPO_DOC",
          modulo: "Tipos Documentales",
          detalles: `Eliminó tipo: ${tipo.nombre}`,
          ip: request.headers.get("x-forwarded-for") || "unknown"
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al eliminar el tipo documental" }, { status: 500 });
  }
}

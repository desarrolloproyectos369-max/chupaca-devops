import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Await params carefully per Next.js App Router rules for dynamic segments
    const paramsResolved = await params;
    const id = parseInt(paramsResolved.id);
    const body = await request.json();

    if (!body.nombre || body.nombre.trim() === '') {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const unidadActualizada = await prisma.unidadOrganica.update({
      where: { id },
      data: {
        nombre: body.nombre.trim(),
        siglas: body.siglas ? body.siglas.trim() : null,
      }
    });

    const userId = request.headers.get("x-user-id");
    if (userId) {
      await prisma.auditoria.create({
        data: {
          usuarioId: parseInt(userId),
          accion: "EDITAR_UNIDAD",
          modulo: "Unidades Orgánicas",
          detalles: `Editó unidad: ${unidadActualizada.nombre}`,
          ip: request.headers.get("x-forwarded-for") || "unknown"
        }
      });
    }

    return NextResponse.json(unidadActualizada);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Ya existe otra unidad con ese nombre" }, { status: 400 });
    }
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

    // Regla de Negocio: No eliminar si hay dependencias
    const usuarios = await prisma.usuario.count({ where: { unidadId: id } });
    if (usuarios > 0) {
      return NextResponse.json({ error: "No se puede eliminar: Hay usuarios asignados a esta unidad" }, { status: 400 });
    }

    const unidad = await prisma.unidadOrganica.delete({
      where: { id }
    });

    const userId = request.headers.get("x-user-id");
    if (userId) {
      await prisma.auditoria.create({
        data: {
          usuarioId: parseInt(userId),
          accion: "ELIMINAR_UNIDAD",
          modulo: "Unidades Orgánicas",
          detalles: `Eliminó unidad: ${unidad.nombre}`,
          ip: request.headers.get("x-forwarded-for") || "unknown"
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al eliminar la unidad" }, { status: 500 });
  }
}

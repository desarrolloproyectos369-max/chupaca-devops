import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const id = parseInt(paramsResolved.id);
    const body = await request.json();

    const { nombres, apellidos, correo, rolId, unidadId } = body;

    if (!nombres || !apellidos || !correo || !rolId) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // Verificar que el correo no pertenezca a otro usuario
    const existente = await prisma.usuario.findFirst({
      where: {
        correo,
        id: { not: id } // Buscar cualquier otro usuario que tenga este correo
      }
    });

    if (existente) {
      return NextResponse.json({ error: "Ya existe otro usuario con este correo electrónico" }, { status: 400 });
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: correo.trim().toLowerCase(),
        rolId: parseInt(rolId),
        unidadId: unidadId ? parseInt(unidadId) : null,
      },
      include: {
        rol: true,
        unidadOrganica: true
      }
    });

    const userIdStr = request.headers.get("x-user-id");
    if (userIdStr) {
      await prisma.auditoria.create({
        data: {
          usuarioId: parseInt(userIdStr),
          accion: "EDITAR_USUARIO",
          modulo: "Usuarios",
          detalles: `Editó usuario ID: ${id}`,
          ip: request.headers.get("x-forwarded-for") || "unknown"
        }
      });
    }

    const { passwordHash: _, ...safeUpdated } = usuarioActualizado;
    return NextResponse.json(safeUpdated);

  } catch (error: any) {
    return NextResponse.json({ error: "Error al actualizar el usuario" }, { status: 500 });
  }
}

// PATCH usado para habilitar/deshabilitar usuarios (Soft Delete lógico)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const id = parseInt(paramsResolved.id);
    const body = await request.json();

    if (typeof body.activo !== 'boolean') {
      return NextResponse.json({ error: "Estado 'activo' debe ser un booleano" }, { status: 400 });
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: {
        activo: body.activo
      }
    });

    const userIdStr = request.headers.get("x-user-id");
    if (userIdStr) {
      await prisma.auditoria.create({
        data: {
          usuarioId: parseInt(userIdStr),
          accion: body.activo ? "ACTIVAR_USUARIO" : "DESACTIVAR_USUARIO",
          modulo: "Usuarios",
          detalles: `Cambió estado a ${body.activo} para usuario ID: ${id}`,
          ip: request.headers.get("x-forwarded-for") || "unknown"
        }
      });
    }

    return NextResponse.json({ success: true, activo: usuarioActualizado.activo });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al cambiar el estado del usuario" }, { status: 500 });
  }
}

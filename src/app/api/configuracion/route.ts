import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const configs = await prisma.configuracion.findMany({
      orderBy: { id: 'asc' }
    });
    return NextResponse.json(configs);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener la configuración" }, { status: 500 });
  }
}

// Actualización Masiva (Bulk Update)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json(); // Espera un arreglo de objetos { clave, valor }
    
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Formato inválido. Se espera un arreglo." }, { status: 400 });
    }

    // Usamos una transacción para garantizar que todos se actualicen o ninguno
    const transacciones = body.map(item => {
      return prisma.configuracion.upsert({
        where: { clave: item.clave },
        update: { valor: item.valor },
        create: {
          clave: item.clave,
          valor: item.valor,
          descripcion: item.descripcion || ""
        }
      });
    });

    await prisma.$transaction(transacciones);

    const userId = request.headers.get("x-user-id");
    if (userId) {
      await prisma.auditoria.create({
        data: {
          usuarioId: parseInt(userId),
          accion: "EDITAR_CONFIGURACION",
          modulo: "Parámetros del Sistema",
          detalles: `Actualizó ${body.length} parámetros globales`,
          ip: request.headers.get("x-forwarded-for") || "unknown"
        }
      });
    }

    return NextResponse.json({ success: true, count: body.length });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al actualizar los parámetros" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo Administradores y Auditores pueden ver esta bitácora
    const rolesPermitidos = ["Administrador funcional", "Auditor o control institucional"];
    if (!rolesPermitidos.includes(session.rolNombre)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Traemos los últimos 200 registros de auditoría
    const registros = await prisma.auditoria.findMany({
      take: 200,
      orderBy: { creadoEn: 'desc' },
      include: {
        usuario: {
          select: { nombres: true, apellidos: true, dni: true }
        }
      }
    });

    return NextResponse.json(registros);
  } catch (error: any) {
    console.error("Error al obtener auditoría:", error);
    return NextResponse.json(
      { error: "Error interno al obtener los registros de auditoría" },
      { status: 500 }
    );
  }
}

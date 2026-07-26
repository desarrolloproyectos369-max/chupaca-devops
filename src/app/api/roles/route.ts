import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.rol.findMany({
      orderBy: { id: 'asc' }
    });
    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener roles" }, { status: 500 });
  }
}

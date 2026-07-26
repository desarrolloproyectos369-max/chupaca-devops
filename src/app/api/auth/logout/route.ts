import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    
    // Si tenemos el usuario, registramos la salida en la bitácora (RF-33)
    if (userId) {
      try {
        await prisma.auditoria.create({
          data: {
            usuarioId: parseInt(userId),
            accion: "LOGOUT",
            modulo: "Seguridad",
            ip: request.headers.get("x-forwarded-for") || "unknown"
          }
        });
      } catch (e) {
        console.warn("No se pudo auditar el logout:", e);
      }
    }

    await logout();

    return NextResponse.json({ success: true, message: "Sesión cerrada correctamente" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

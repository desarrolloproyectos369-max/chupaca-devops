import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: {
        rol: true,
        unidadOrganica: true
      },
      orderBy: { id: 'desc' }
    });
    
    // Remover el passwordHash de la respuesta
    const safeUsuarios = usuarios.map(u => {
      const { passwordHash, ...safeInfo } = u;
      return safeInfo;
    });

    return NextResponse.json(safeUsuarios);
  } catch (error) {
    return NextResponse.json({ error: "Error al listar usuarios" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dni, nombres, apellidos, correo, rolId, unidadId } = body;

    // Validación básica
    if (!dni || !nombres || !apellidos || !correo || !rolId) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // Verificar duplicados (DNI o Correo)
    const existente = await prisma.usuario.findFirst({
      where: {
        OR: [ { dni }, { correo } ]
      }
    });

    if (existente) {
      if (existente.dni === dni) {
        return NextResponse.json({ error: "Ya existe un usuario con este DNI" }, { status: 400 });
      }
      if (existente.correo === correo) {
        return NextResponse.json({ error: "Ya existe un usuario con este correo electrónico" }, { status: 400 });
      }
    }

    // Hashear contraseña por defecto (usaremos el DNI como clave por defecto)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dni, salt);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        dni,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: correo.trim().toLowerCase(),
        passwordHash,
        rolId: parseInt(rolId),
        unidadId: unidadId ? parseInt(unidadId) : null,
      },
      include: {
        rol: true,
        unidadOrganica: true
      }
    });

    // Auditoría
    const userIdStr = request.headers.get("x-user-id");
    if (userIdStr) {
      await prisma.auditoria.create({
        data: {
          usuarioId: parseInt(userIdStr),
          accion: "CREAR_USUARIO",
          modulo: "Usuarios",
          detalles: `Creó usuario: ${correo}`,
          ip: request.headers.get("x-forwarded-for") || "unknown"
        }
      });
    }

    const { passwordHash: _, ...safeNuevo } = nuevoUsuario;
    return NextResponse.json(safeNuevo, { status: 201 });
    
  } catch (error: any) {
    return NextResponse.json({ error: "Error al crear el usuario" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// OBTENER todos los documentos internos de un expediente
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    
    const paramsResolved = await context.params;
    const expedienteId = parseInt(paramsResolved.id);

    const documentos = await prisma.documentoInterno.findMany({
      where: { expedienteId },
      include: {
        autor: {
          select: { nombres: true, apellidos: true, unidadId: true, rol: { select: { nombre: true } } }
        }
      },
      orderBy: { creadoEn: 'desc' }
    });

    return NextResponse.json(documentos);
  } catch (error: any) {
    console.error("Error al obtener documentos internos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// CREAR un nuevo documento interno (Proveído, Informe, etc.)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    
    const paramsResolved = await context.params;
    const expedienteId = parseInt(paramsResolved.id);

    const { tipo, contenido } = await request.json();

    if (!tipo || !contenido) {
      return NextResponse.json({ error: "El tipo y el contenido son requeridos" }, { status: 400 });
    }

    const nuevoDocumento = await prisma.documentoInterno.create({
      data: {
        expedienteId,
        autorId: session.id,
        tipo,
        contenido,
        esBorrador: false
      }
    });

    // Registrar en auditoría
    await prisma.auditoria.create({
      data: {
        usuarioId: session.id,
        accion: "CREAR_DOCUMENTO_INTERNO",
        modulo: "Trámite Documentario",
        detalles: `Redactó un(a) ${tipo} en el expediente ID: ${expedienteId}`,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1"
      }
    });

    // Notificar a los jefes de la unidad para el Visto Bueno
    if (session.unidadId) {
      const jefes = await prisma.usuario.findMany({
        where: {
          unidadId: session.unidadId,
          rol: {
            nombre: {
              in: ["Jefe o responsable de área", "Funcionario firmante"]
            }
          },
          activo: true
        }
      });

      if (jefes.length > 0) {
        await prisma.notificacion.createMany({
          data: jefes.map(jefe => ({
            usuarioId: jefe.id,
            expedienteId,
            tipo: "NORMAL",
            mensaje: `Requiere V°B°: ${session.nombres} redactó un ${tipo} en el Exp. ${expedienteId}.`
          }))
        });
      }
    }

    return NextResponse.json(nuevoDocumento, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear documento interno:", error);
    return NextResponse.json({ error: "Error interno al crear documento" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paramsResolved = await params;
    const expedienteId = parseInt(paramsResolved.id);

    const anexos = await prisma.anexo.findMany({
      where: { expedienteId },
      include: {
        subidoPor: {
          select: { nombres: true, apellidos: true }
        }
      },
      orderBy: { creadoEn: 'desc' }
    });

    return NextResponse.json(anexos);
  } catch (error) {
    return NextResponse.json({ error: "Error al listar anexos" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paramsResolved = await params;
    const expedienteId = parseInt(paramsResolved.id);
    const formData = await request.formData();
    
    const archivo = formData.get("archivo") as File | null;
    if (!archivo || archivo.size === 0) {
      return NextResponse.json({ error: "Debe adjuntar un archivo" }, { status: 400 });
    }

    if (archivo.type !== "application/pdf") {
      return NextResponse.json({ error: "Solo se permiten archivos PDF" }, { status: 400 });
    }

    const expediente = await prisma.expediente.findUnique({
      where: { id: expedienteId }
    });

    if (!expediente) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    const userIdStr = request.headers.get("x-user-id") || "1";
    const userId = parseInt(userIdStr);

    const bytes = await archivo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    
    // Guardar el archivo como: EXP-0001-2026-ANEXO-TIMESTAMP.pdf
    const fileName = `${expediente.codigo}-ANEXO-${Date.now()}.pdf`;
    const filePath = join(uploadDir, fileName);
    
    await writeFile(filePath, buffer);
    const archivoUrl = `/uploads/${fileName}`;

    const nuevoAnexo = await prisma.anexo.create({
      data: {
        expedienteId,
        nombreArchivo: archivo.name,
        archivoUrl,
        subidoPorId: userId
      },
      include: {
        subidoPor: {
          select: { nombres: true, apellidos: true }
        }
      }
    });

    await prisma.auditoria.create({
      data: {
        usuarioId: userId,
        accion: "SUBIR_ANEXO",
        modulo: "Gestión de Expedientes",
        detalles: `Subió anexo ${archivo.name} al exp: ${expediente.codigo}`,
        ip: request.headers.get("x-forwarded-for") || "unknown"
      }
    });

    return NextResponse.json(nuevoAnexo, { status: 201 });
  } catch (error: any) {
    console.error("Error al subir anexo:", error);
    return NextResponse.json({ error: "Error interno al subir el anexo" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsResolved = await params;
    const expedienteId = parseInt(paramsResolved.id);

    const formData = await request.formData();
    const comentarios = formData.get("comentarios") as string;
    const archivo = formData.get("archivo") as File | null;

    const userIdStr = request.headers.get("x-user-id") || "1";
    const userId = parseInt(userIdStr);

    const expediente = await prisma.expediente.findUnique({
      where: { id: expedienteId }
    });

    if (!expediente) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    if (expediente.estado !== 'OBSERVADO') {
      return NextResponse.json({ error: "El expediente no está observado" }, { status: 400 });
    }

    let archivoUrl = null;
    let nombreArchivo = "Subsanación";

    if (archivo && archivo.size > 0) {
      nombreArchivo = archivo.name;
      const bytes = await archivo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      
      const fileName = `${expediente.codigo}-subsanacion-${Date.now()}.pdf`;
      const filePath = join(uploadDir, fileName);
      
      await writeFile(filePath, buffer);
      archivoUrl = `/uploads/${fileName}`;
    }

    if (!archivoUrl) {
      return NextResponse.json({ error: "Debe adjuntar un archivo de subsanación válido" }, { status: 400 });
    }

    // 1. Guardar el anexo
    await prisma.anexo.create({
      data: {
        expedienteId,
        nombreArchivo,
        archivoUrl,
        subidoPorId: userId
      }
    });

    // 2. Cambiar el estado a EN_PROCESO
    await prisma.expediente.update({
      where: { id: expedienteId },
      data: { estado: "EN_PROCESO" }
    });

    // 3. Registrar en la línea de tiempo
    await prisma.derivacion.create({
      data: {
        expedienteId,
        origenId: userId,
        instrucciones: `Se ha adjuntado la subsanación de las observaciones.${comentarios ? ' Notas: ' + comentarios : ''}`,
        estado: 'ATENDIDO' // Registro de línea de tiempo
      }
    });

    // 4. Auditoría
    await prisma.auditoria.create({
      data: {
        usuarioId: userId,
        accion: "SUBSANAR_EXPEDIENTE",
        modulo: "Trámite Documentario",
        detalles: `Expediente ${expediente.codigo} subsanado. Estado regresó a EN_PROCESO.`,
        ip: request.headers.get("x-forwarded-for") || "unknown"
      }
    });

    return NextResponse.json({ message: "Expediente subsanado correctamente" }, { status: 201 });
  } catch (error: any) {
    console.error("Error al subsanar expediente:", error);
    return NextResponse.json({ error: "Error interno al subsanar" }, { status: 500 });
  }
}

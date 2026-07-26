import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    
    // Solo Jefes o Funcionarios pueden firmar (como regla de negocio propuesta)
    const isJefe = session.rolNombre === "Jefe o responsable de área" || session.rolNombre === "Funcionario firmante";
    if (!isJefe) {
      return NextResponse.json({ error: "Solo el personal autorizado puede firmar digitalmente un documento" }, { status: 403 });
    }

    const paramsResolved = await context.params;
    const expedienteId = parseInt(paramsResolved.id);
    const docId = parseInt(paramsResolved.docId);

    const documento = await prisma.documentoInterno.findUnique({
      where: { id: docId },
      include: { 
        autor: { select: { unidadId: true } },
        revisor: { select: { nombres: true, apellidos: true } }
      }
    });

    if (!documento) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    if (documento.estadoAprobacion !== 'APROBADO') {
      return NextResponse.json({ error: "El documento debe estar APROBADO antes de poder ser firmado" }, { status: 400 });
    }

    // Verificar que el Jefe pertenezca a la misma unidad orgánica que el autor
    if (documento.autor.unidadId !== session.unidadId) {
      return NextResponse.json({ error: "No puedes firmar documentos de otras áreas" }, { status: 403 });
    }

    const fechaActual = new Date();
    const timestampString = fechaActual.toLocaleString("es-PE", { 
      year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    // Simulación de estampa de firma digital
    const firmaHtml = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #ccc; font-family: monospace; font-size: 12px; color: #555;">
        <p style="margin: 0;"><strong>FIRMA DIGITAL INTERNA VÁLIDA</strong></p>
        <p style="margin: 5px 0 0 0;"><strong>Firmado por:</strong> ${session.nombres} ${session.apellidos} (${session.rolNombre})</p>
        <p style="margin: 5px 0 0 0;"><strong>Timestamp:</strong> ${timestampString}</p>
        <p style="margin: 5px 0 0 0;"><strong>ID Documento:</strong> DOC-${docId}-${fechaActual.getTime().toString().slice(-6)}</p>
        <p style="margin: 5px 0 0 0; color: #888;"><em>Este documento ha sido autenticado por la Plataforma MuniDevOps y su contenido es inalterable.</em></p>
      </div>
    `;

    const nuevoContenido = documento.contenido + firmaHtml;

    const documentoFirmado = await prisma.documentoInterno.update({
      where: { id: docId },
      data: {
        estadoAprobacion: 'FIRMADO',
        fechaFirma: fechaActual,
        contenido: nuevoContenido
      }
    });

    // Registrar en auditoría
    await prisma.auditoria.create({
      data: {
        usuarioId: session.id,
        accion: "FIRMA_DOCUMENTO_INTERNO",
        modulo: "Trámite Documentario",
        detalles: `El jefe ${session.nombres} firmó digitalmente el documento ID ${docId} (Expediente ${expedienteId})`,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1"
      }
    });

    // Notificar al autor original
    await prisma.notificacion.create({
      data: {
        usuarioId: documento.autorId,
        expedienteId,
        tipo: "NORMAL",
        mensaje: `Tu ${documento.tipo} ha sido FIRMADO DIGITALMENTE por el Jefe y ya es un documento oficial.`
      }
    });

    return NextResponse.json(documentoFirmado);
  } catch (error: any) {
    console.error("Error al firmar documento:", error);
    return NextResponse.json({ error: "Error interno al firmar documento" }, { status: 500 });
  }
}

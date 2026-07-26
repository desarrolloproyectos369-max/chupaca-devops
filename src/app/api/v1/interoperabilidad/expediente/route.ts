import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Clave de configuración en BD
const CONFIG_KEY = "API_INTEROPERABILIDAD_TOKEN";

export async function GET(request: NextRequest) {
  try {
    // 1. Verificación de Seguridad (Token Bearer)
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado. Token requerido." }, { status: 401 });
    }

    const tokenRequerido = authHeader.split(" ")[1];
    
    // Obtener el token real de la BD
    const configToken = await prisma.configuracion.findUnique({
      where: { clave: CONFIG_KEY }
    });

    if (!configToken || configToken.valor !== tokenRequerido) {
      return NextResponse.json({ error: "Token inválido o API deshabilitada." }, { status: 401 });
    }

    // 2. Extracción de Parámetros
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get("codigo");

    if (!codigo) {
      return NextResponse.json({ error: "Debe proveer el parámetro 'codigo'." }, { status: 400 });
    }

    // 3. Consulta de Datos (Solo información permitida)
    const expediente = await prisma.expediente.findUnique({
      where: { codigo },
      include: {
        tipoDocumental: true
      }
    });

    if (!expediente) {
      return NextResponse.json({ error: "Expediente no encontrado." }, { status: 404 });
    }

    // 4. Buscar última derivación para saber en qué área está
    const ultimaDerivacion = await prisma.derivacion.findFirst({
      where: { expedienteId: expediente.id },
      orderBy: { creadoEn: 'desc' },
      include: {
        destinoUnidad: true
      }
    });

    let areaActual = "MESA DE PARTES";
    if (ultimaDerivacion && ultimaDerivacion.destinoUnidad) {
      areaActual = ultimaDerivacion.destinoUnidad.nombre;
    } else if (ultimaDerivacion) {
      areaActual = "ÁREA ESPECÍFICA"; // Fue derivado a un usuario
    }

    if (expediente.estado === 'FINALIZADO' || expediente.estado === 'ARCHIVADO') {
      areaActual = "ARCHIVO CENTRAL";
    }

    // 5. Respuesta JSON Estructurada
    return NextResponse.json({
      success: true,
      data: {
        codigo: expediente.codigo,
        estado: expediente.estado,
        fechaIngreso: expediente.creadoEn,
        fechaActualizacion: expediente.actualizadoEn,
        asunto: expediente.asunto,
        tipoTramite: expediente.tipoDocumental.nombre,
        areaActualizacion: areaActual
      }
    });

  } catch (error) {
    console.error("Error en API de Interoperabilidad:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

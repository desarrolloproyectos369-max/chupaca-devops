import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("fechaFin");
    const estado = searchParams.get("estado");
    const tipoDocumentalId = searchParams.get("tipoDocumentalId");

    // Construir los filtros para Prisma
    const whereClause: any = {};

    if (fechaInicio && fechaFin) {
      // Ajustar fechas para cubrir el día completo
      const start = new Date(fechaInicio);
      start.setHours(0, 0, 0, 0);
      const end = new Date(fechaFin);
      end.setHours(23, 59, 59, 999);
      
      whereClause.creadoEn = {
        gte: start,
        lte: end,
      };
    }

    if (estado && estado !== "TODOS") {
      whereClause.estado = estado;
    }

    if (tipoDocumentalId && tipoDocumentalId !== "TODOS") {
      whereClause.tipoDocumentalId = parseInt(tipoDocumentalId);
    }

    // Obtener los expedientes filtrados
    const expedientes = await prisma.expediente.findMany({
      where: whereClause,
      include: {
        tipoDocumental: true,
        registrador: true,
      },
      orderBy: {
        creadoEn: "desc",
      },
    });

    // Calcular KPIs
    const total = expedientes.length;
    const enProceso = expedientes.filter((e) => e.estado === "EN_PROCESO").length;
    const archivados = expedientes.filter((e) => e.estado === "ARCHIVADO").length;
    
    // Vencidos (Fuera de Plazo)
    // Aquellos que no están finalizados/archivados y cuyo plazo legal ya expiró
    const ahora = new Date();
    const vencidos = expedientes.filter((e) => {
      if (e.estado === "FINALIZADO" || e.estado === "ARCHIVADO") return false;
      const creado = new Date(e.creadoEn);
      const diffTime = Math.abs(ahora.getTime() - creado.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > e.tipoDocumental.plazoDias;
    }).length;

    // Calcular tiempos promedio (opcional para gráficas)
    // ...

    return NextResponse.json({
      success: true,
      data: expedientes,
      kpis: {
        total,
        enProceso,
        archivados,
        vencidos,
      }
    });

  } catch (error: any) {
    console.error("Error al obtener reporte de expedientes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar el reporte" },
      { status: 500 }
    );
  }
}

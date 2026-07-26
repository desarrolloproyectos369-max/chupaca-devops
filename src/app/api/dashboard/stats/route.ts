import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    
    // 1. KPIs
    const total = await prisma.expediente.count();
    const enProceso = await prisma.expediente.count({
      where: { estado: 'EN_PROCESO' }
    });
    const archivados = await prisma.expediente.count({
      where: { estado: 'ARCHIVADO' }
    });
    // Para calcular los vencidos, necesitamos traer los que están en proceso
    // y calcular si excedieron sus días de plazo
    const expedientesEnProceso = await prisma.expediente.findMany({
      where: { estado: 'EN_PROCESO' },
      select: {
        creadoEn: true,
        tipoDocumental: { select: { plazoDias: true } }
      }
    });

    let vencidos = 0;
    expedientesEnProceso.forEach(exp => {
      const fechaLimite = new Date(exp.creadoEn);
      fechaLimite.setDate(fechaLimite.getDate() + exp.tipoDocumental.plazoDias);
      if (fechaLimite < today) {
        vencidos++;
      }
    });

    // 2. Gráfico por Estado
    const groupEstados = await prisma.expediente.groupBy({
      by: ['estado'],
      _count: { estado: true }
    });

    const porEstado = groupEstados.map(g => ({
      name: g.estado.replace('_', ' '),
      value: g._count.estado
    }));

    // 3. Gráfico por Día (Últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recientes = await prisma.expediente.findMany({
      where: {
        creadoEn: { gte: sevenDaysAgo }
      },
      select: { creadoEn: true }
    });

    // Agrupar por fecha
    const diasMap = new Map<string, number>();
    
    // Inicializar los últimos 7 días con 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const str = d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
      diasMap.set(str, 0);
    }

    // Sumar las cantidades
    recientes.forEach(exp => {
      const str = new Date(exp.creadoEn).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
      if (diasMap.has(str)) {
        diasMap.set(str, diasMap.get(str)! + 1);
      }
    });

    const porDia = Array.from(diasMap.entries()).map(([fecha, cantidad]) => ({
      fecha,
      cantidad
    }));

    return NextResponse.json({
      kpis: { total, enProceso, archivados, vencidos },
      porEstado,
      porDia
    });

  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

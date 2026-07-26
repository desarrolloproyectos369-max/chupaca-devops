import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as os from 'os';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const inicioDb = performance.now();
    let dbStatus = "ok";
    
    // Ping a la Base de Datos para medir latencia
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = "error";
    }
    const finDb = performance.now();
    const dbLatenciaMs = Math.round(finDb - inicioDb);

    // Obtener uso de memoria
    const memoryUsage = process.memoryUsage();
    const memoriaUsadaMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoriaTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const memoriaPorcentaje = Math.round((memoriaUsadaMB / memoriaTotalMB) * 100) || 0;

    // Obtener carga de CPU (promedio 1 minuto)
    const cpus = os.cpus();
    const loadAvg = os.loadavg(); // Arreglo [1 min, 5 min, 15 min]
    const cpuLoad1Min = loadAvg[0];
    const cpuPorcentaje = Math.round((cpuLoad1Min / cpus.length) * 100);

    // Uptime
    const uptimeSecs = Math.round(process.uptime());

    const monitoreo = {
      success: true,
      data: {
        servidor: {
          uptimeSegundos: uptimeSecs,
          memoriaUsadaMB,
          memoriaTotalMB,
          memoriaPorcentaje,
          cpuPorcentaje,
          nucleos: cpus.length,
          plataforma: os.platform(),
          versionNode: process.version
        },
        baseDeDatos: {
          estado: dbStatus,
          latenciaMs: dbLatenciaMs
        },
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(monitoreo);
  } catch (error) {
    console.error("Error en API de Monitoreo:", error);
    return NextResponse.json({ error: "Error interno del servidor al recolectar métricas." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Nota: Aquí se podría validar el rol del usuario desde la sesión (JWT),
    // asegurando que solo el "Administrador funcional" pueda descargar el backup.
    
    // Extracción secuencial de todas las tablas críticas (Backup Lógico)
    const usuarios = await prisma.usuario.findMany();
    const unidades = await prisma.unidadOrganica.findMany();
    const tiposDoc = await prisma.tipoDocumental.findMany();
    const expedientes = await prisma.expediente.findMany();
    const derivaciones = await prisma.derivacion.findMany();
    const auditoria = await prisma.auditoria.findMany();
    const configuracion = await prisma.configuracion.findMany();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        usuarios,
        unidades,
        tiposDoc,
        expedientes,
        derivaciones,
        auditoria,
        configuracion
      }
    };

    // Crear un blob/buffer de JSON
    const jsonString = JSON.stringify(backupData, null, 2);
    
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup_muni_${new Date().toISOString().split('T')[0]}.json"`,
      }
    });

  } catch (error) {
    console.error("Error al generar backup:", error);
    return NextResponse.json({ error: "Error interno del servidor al generar la copia de seguridad." }, { status: 500 });
  }
}

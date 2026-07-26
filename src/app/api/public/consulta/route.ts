import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const codigo = searchParams.get("codigo");
    const dni = searchParams.get("dni");

    if (!codigo || !dni) {
      return NextResponse.json(
        { error: "El código del expediente y el DNI son obligatorios." },
        { status: 400 }
      );
    }

    const expediente = await prisma.expediente.findFirst({
      where: {
        codigo: { equals: codigo, mode: "insensitive" },
        dniRemitente: dni,
      },
      include: {
        tipoDocumental: {
          select: { nombre: true },
        },
        derivaciones: {
          orderBy: { creadoEn: "asc" },
          include: {
            destinoUnidad: {
              select: { nombre: true },
            },
          },
        },
      },
    });

    if (!expediente) {
      return NextResponse.json(
        { error: "No se encontró ningún expediente con esos datos o el DNI no coincide." },
        { status: 404 }
      );
    }

    // Ofuscar parcialmente el asunto y remitente por privacidad (ej. A******)
    // Opcional: Para el ciudadano validado con DNI, podríamos mostrar todo.
    // Como validamos DNI, mostramos la info real pero no devolvemos info interna sensible como IDs
    
    const respuestaPublica = {
      codigo: expediente.codigo,
      estado: expediente.estado,
      asunto: expediente.asunto,
      folios: expediente.folios,
      creadoEn: expediente.creadoEn,
      tipoDocumento: expediente.tipoDocumental.nombre,
      remitente: `${expediente.nombresRemitente} ${expediente.apellidosRemitente}`,
      historial: expediente.derivaciones.map(d => ({
        id: d.id,
        fecha: d.creadoEn,
        estado: d.estado,
        unidadDestino: d.destinoUnidad?.nombre || "Usuario Directo",
        instrucciones: d.instrucciones,
      }))
    };

    return NextResponse.json(respuestaPublica, { status: 200 });
  } catch (error: any) {
    console.error("Error en consulta pública:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al consultar el expediente." },
      { status: 500 }
    );
  }
}

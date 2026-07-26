import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vista = searchParams.get('vista'); // 'mis_pendientes' | 'todos'
    const q = searchParams.get('q');
    const estadoParam = searchParams.get('estado');
    const prioridadParam = searchParams.get('prioridad');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    let whereClause: any = {};

    if (q) {
      whereClause.OR = [
        { codigo: { contains: q, mode: 'insensitive' } },
        { asunto: { contains: q, mode: 'insensitive' } },
        { dniRemitente: { contains: q, mode: 'insensitive' } },
        { nombresRemitente: { contains: q, mode: 'insensitive' } },
        { apellidosRemitente: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (estadoParam) {
      whereClause.estado = estadoParam;
    }

    if (prioridadParam) {
      whereClause.prioridad = prioridadParam;
    }

    if (fechaDesde || fechaHasta) {
      whereClause.creadoEn = {};
      if (fechaDesde) {
        whereClause.creadoEn.gte = new Date(`${fechaDesde}T00:00:00.000Z`);
      }
      if (fechaHasta) {
        whereClause.creadoEn.lte = new Date(`${fechaHasta}T23:59:59.999Z`);
      }
    }

    const isSearching = q || estadoParam || prioridadParam || fechaDesde || fechaHasta;

    const expedientes = await prisma.expediente.findMany({
      where: whereClause,
      include: {
        tipoDocumental: true,
        registrador: true,
        derivaciones: {
          orderBy: { creadoEn: 'desc' },
          take: 5
        }
      },
      orderBy: { id: 'desc' },
      take: isSearching ? undefined : 50 // Limitamos a 50 por defecto, sin límite si está buscando (o se podría añadir paginación real)
    });

    const userId = parseInt(request.headers.get("x-user-id") || "1");

    const usuarioActual = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { unidadId: true, rolId: true }
    });

    const expedientesConPermisos = expedientes.map(exp => {
      let esModificable = false;

      if (exp.estado === 'ARCHIVADO') {
        esModificable = false;
      } else {
        if (!exp.derivaciones || exp.derivaciones.length === 0) {
          esModificable = (exp.registradorId === userId) || (userId === 1);
        } else {
          // Buscar la última derivación "real" de enrutamiento (que tenga destino)
          const ultimaDerivacion = exp.derivaciones.find((d: any) => d.destinoUsuarioId || d.destinoUnidadId);
          
          if (ultimaDerivacion) {
            if (ultimaDerivacion.destinoUsuarioId) {
              // Si fue reasignado a una persona en específico, SOLO esa persona puede tocarlo
              esModificable = (ultimaDerivacion.destinoUsuarioId === userId);
            } else if (ultimaDerivacion.destinoUnidadId) {
              // Si fue derivado a un área (y aún no a una persona)
              if (ultimaDerivacion.origenId === userId) {
                // Si tú lo enviaste a otra área, ya no lo puedes tocar
                esModificable = false;
              } else {
                // Cualquiera del área destino puede tocarlo
                esModificable = (ultimaDerivacion.destinoUnidadId === usuarioActual?.unidadId);
              }
            }
          } else {
             // Si no hay derivación real (raro, pero fallback)
             esModificable = (exp.registradorId === userId) || (userId === 1);
          }
        }
      }

      // Buscar la última derivación "real" para calcular si está asignado a mí
      const realDerivation = exp.derivaciones?.find((d: any) => d.destinoUsuarioId || d.destinoUnidadId);

      const asignadoAMi = realDerivation ? realDerivation.destinoUsuarioId === userId : false;

      // Habilitar subsanación si está OBSERVADO y soy dueño o soy Mesa de Partes (ID 1)
      let esSubsanable = false;
      if (exp.estado === 'OBSERVADO') {
        esSubsanable = esModificable || userId === 1 || usuarioActual?.rolId === 1;
      }

      // RF-20: Habilitar priorización para dueños, admins (2) y mesa de partes (1)
      const puedePriorizar = esModificable || usuarioActual?.rolId === 1 || usuarioActual?.rolId === 2;

      return { ...exp, esModificable, asignadoAMi, esSubsanable, puedePriorizar };
    });

    if (vista === 'mis_pendientes') {
      const pendientes = expedientesConPermisos.filter(e => e.esModificable);
      return NextResponse.json(pendientes);
    }

    return NextResponse.json(expedientesConPermisos);
  } catch (error: any) {
    return NextResponse.json({ error: "Error al listar expedientes", details: error.message, stack: error.stack }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const tipoDocumentalId = formData.get("tipoDocumentalId") as string;
    const asunto = formData.get("asunto") as string;
    const folios = formData.get("folios") as string;
    const dniRemitente = formData.get("dniRemitente") as string;
    const nombresRemitente = formData.get("nombresRemitente") as string;
    const apellidosRemitente = formData.get("apellidosRemitente") as string;
    const correoRemitente = formData.get("correoRemitente") as string;
    const telefonoRemitente = formData.get("telefonoRemitente") as string;
    const archivo = formData.get("archivo") as File | null;
    
    // El ID del usuario que registra se asume enviado por headers (simulado)
    const userId = request.headers.get("x-user-id") || "1"; // Fallback a 1 para desarrollo

    if (!tipoDocumentalId || !asunto || !dniRemitente || !nombresRemitente || !apellidosRemitente) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // 1. Obtener el Año Fiscal activo
    let anioFiscal = new Date().getFullYear().toString();
    const configAnio = await prisma.configuracion.findUnique({ where: { clave: "ANIO_FISCAL" }});
    if (configAnio) anioFiscal = configAnio.valor;

    // 2. Calcular el correlativo
    // Buscar el último expediente del año fiscal actual
    const ultimoExp = await prisma.expediente.findFirst({
      where: { codigo: { endsWith: `-${anioFiscal}` } },
      orderBy: { id: 'desc' }
    });

    let nuevoCorrelativo = 1;
    if (ultimoExp) {
      // EXP-0001-2026 -> Extraemos "0001"
      const partes = ultimoExp.codigo.split('-');
      if (partes.length === 3) {
        nuevoCorrelativo = parseInt(partes[1], 10) + 1;
      }
    }

    const codigoGenerado = `EXP-${nuevoCorrelativo.toString().padStart(4, '0')}-${anioFiscal}`;

    // 3. Procesar el archivo adjunto (Opcional)
    let archivoUrl = null;
    if (archivo && archivo.size > 0) {
      const bytes = await archivo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      // Crear directorio si no existe
      await mkdir(uploadDir, { recursive: true });
      
      const fileName = `${codigoGenerado}-${Date.now()}.pdf`;
      const filePath = join(uploadDir, fileName);
      
      await writeFile(filePath, buffer);
      archivoUrl = `/uploads/${fileName}`;
    }

    // 4. Guardar en BD
    const nuevoExpediente = await prisma.expediente.create({
      data: {
        codigo: codigoGenerado,
        tipoDocumentalId: parseInt(tipoDocumentalId),
        asunto: asunto.trim(),
        folios: parseInt(folios) || 1,
        dniRemitente,
        nombresRemitente: nombresRemitente.trim(),
        apellidosRemitente: apellidosRemitente.trim(),
        correoRemitente: correoRemitente ? correoRemitente.trim() : null,
        telefonoRemitente: telefonoRemitente ? telefonoRemitente.trim() : null,
        archivoUrl,
        registradorId: parseInt(userId)
      }
    });

    // Auditoría
    await prisma.auditoria.create({
      data: {
        usuarioId: parseInt(userId),
        accion: "REGISTRAR_EXPEDIENTE",
        modulo: "Mesa de Partes",
        detalles: `Expediente creado: ${codigoGenerado}`,
        ip: request.headers.get("x-forwarded-for") || "unknown"
      }
    });

    return NextResponse.json(nuevoExpediente, { status: 201 });
  } catch (error: any) {
    console.error("Error al registrar expediente:", error);
    return NextResponse.json({ error: "Error interno al registrar el expediente" }, { status: 500 });
  }
}

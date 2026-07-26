import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const expediente = await prisma.expediente.findUnique({
    where: { codigo: "EXP-0001-2026" }
  });

  if (expediente) {
    // 1. Eliminar todas las derivaciones asociadas a ese expediente
    const deleted = await prisma.derivacion.deleteMany({
      where: { expedienteId: expediente.id }
    });
    console.log(`Se eliminaron ${deleted.count} derivaciones del expediente ${expediente.codigo}`);

    // 2. Regresar el estado del expediente a su valor original (como si acabara de nacer)
    await prisma.expediente.update({
      where: { id: expediente.id },
      data: { estado: "REGISTRADO" }
    });
    console.log(`Estado del expediente ${expediente.codigo} restablecido a 'REGISTRADO'`);

  } else {
    console.log("No se encontró el expediente EXP-0001-2026");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })

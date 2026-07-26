import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function main() {
  const usuarios = await prisma.usuario.findMany();
  let updated = 0;
  for (const u of usuarios) {
    const cleanEmail = removeAccents(u.correo);
    if (cleanEmail !== u.correo) {
      await prisma.usuario.update({
        where: { id: u.id },
        data: { correo: cleanEmail }
      });
      console.log(`Corregido: ${u.correo} -> ${cleanEmail}`);
      updated++;
    }
  }
  console.log(`Se corrigieron ${updated} correos electrónicos.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })

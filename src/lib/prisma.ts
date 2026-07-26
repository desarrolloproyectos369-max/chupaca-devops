import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const prismaClientSingleton = () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

// Clear the global cache to force the new schema to be loaded in dev
if (process.env.NODE_ENV !== 'production') {
  delete (globalThis as any).prismaGlobal;
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

// Force reload for schema changes
export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

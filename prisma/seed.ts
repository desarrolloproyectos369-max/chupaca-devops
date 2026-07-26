import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Iniciando el seeder de organigrama, roles y usuarios...');
  
  // Todos los usuarios compartirán la misma contraseña inicial para facilidad de pruebas
  const passwordHash = await bcrypt.hash('admin123', 10);

  // 1. Crear Organigrama Base (Unidades Orgánicas)
  const unidadesOrganicas = [
    { nombre: 'Alcaldía Municipal', siglas: 'ALC' },
    { nombre: 'Gerencia Municipal', siglas: 'GM' },
    { nombre: 'Secretaría General', siglas: 'SG' },
    { nombre: 'Subgerencia de Trámite Documentario (Mesa de Partes)', siglas: 'STD' },
    { nombre: 'Gerencia de Administración y Finanzas', siglas: 'GAF' },
    { nombre: 'Subgerencia de Recursos Humanos', siglas: 'SRH' },
    { nombre: 'Gerencia de Tecnologías de la Información', siglas: 'GTI' },
    { nombre: 'Órgano de Control Institucional', siglas: 'OCI' }
  ];

  const creadas = {};
  
  for (const u of unidadesOrganicas) {
    const record = await prisma.unidadOrganica.upsert({
      where: { nombre: u.nombre },
      update: { siglas: u.siglas },
      create: { nombre: u.nombre, siglas: u.siglas },
    });
    // @ts-ignore
    creadas[u.siglas] = record.id;
  }
  console.log('✅ Organigrama base construido exitosamente.');

  // 2. Crear Roles y Asignar Usuarios a sus áreas lógicas
  const rolesYUsuarios = [
    {
      rol: 'Operador de mesa de partes',
      desc: 'Recibe, valida, registra y deriva expedientes; emite cargos y observa requisitos.',
      email: 'mesadepartes@chupaca.gob.pe',
      nombres: 'Operador',
      apellidos: 'Mesa Partes',
      dni: '10000001',
      // @ts-ignore
      unidadId: creadas['STD']
    },
    {
      rol: 'Personal administrativo',
      desc: 'Recibe, revisa, atiende, elabora documentos y deriva expedientes según competencia.',
      email: 'administrativo@chupaca.gob.pe',
      nombres: 'Asistente',
      apellidos: 'Administrativo',
      dni: '10000002',
      // @ts-ignore
      unidadId: creadas['GM']
    },
    {
      rol: 'Jefe o responsable de área',
      desc: 'Asigna, prioriza, revisa, aprueba y supervisa el cumplimiento de plazos.',
      email: 'jefe@chupaca.gob.pe',
      nombres: 'Jefe',
      apellidos: 'De Área',
      dni: '10000003',
      // @ts-ignore
      unidadId: creadas['GAF']
    },
    {
      rol: 'Funcionario firmante',
      desc: 'Aprueba y firma documentos finales dentro de sus atribuciones.',
      email: 'funcionario@chupaca.gob.pe',
      nombres: 'Funcionario',
      apellidos: 'Firmante',
      dni: '10000004',
      // @ts-ignore
      unidadId: creadas['SG']
    },
    {
      rol: 'Administrador funcional',
      desc: 'Gestiona catálogos, unidades, usuarios, roles, parámetros y reportes institucionales.',
      email: 'admin@chupaca.gob.pe',
      nombres: 'Admin',
      apellidos: 'Funcional',
      dni: '10000005',
      // @ts-ignore
      unidadId: creadas['GTI']
    },
    {
      rol: 'Administrador técnico / DevOps',
      desc: 'Gestiona versiones, ambientes, monitoreo, incidencias, respaldos y despliegues.',
      email: 'devops@chupaca.gob.pe',
      nombres: 'Admin',
      apellidos: 'Técnico',
      dni: '10000006',
      // @ts-ignore
      unidadId: creadas['GTI']
    },
    {
      rol: 'Auditor o control institucional',
      desc: 'Consulta trazabilidad, bitácoras y evidencias dentro de permisos autorizados.',
      email: 'auditor@chupaca.gob.pe',
      nombres: 'Control',
      apellidos: 'Institucional',
      dni: '10000007',
      // @ts-ignore
      unidadId: creadas['OCI']
    }
  ];

  for (const item of rolesYUsuarios) {
    // Upsert Rol
    const rol = await prisma.rol.upsert({
      where: { nombre: item.rol },
      update: {},
      create: {
        nombre: item.rol,
        descripcion: item.desc,
        permisos: { modulo: 'todos' }
      }
    });

    // Upsert Usuario
    await prisma.usuario.upsert({
      where: { correo: item.email },
      update: {
        rolId: rol.id,
        unidadId: item.unidadId
      },
      create: {
        dni: item.dni,
        nombres: item.nombres,
        apellidos: item.apellidos,
        correo: item.email,
        passwordHash,
        rolId: rol.id,
        unidadId: item.unidadId,
        activo: true,
      }
    });
    
    console.log(`✅ Usuario: ${item.email} -> asignado a rol [${item.rol}] en unidad [ID: ${item.unidadId}]`);
  }

  // Generar Usuarios Dummy Extra para cada Área para pruebas de Reasignación
  console.log('Generando usuarios extra para pruebas de reasignación...');
  const nombresDummy = ['Carlos', 'María', 'José', 'Ana', 'Luis', 'Carmen', 'Jorge', 'Rosa', 'Miguel', 'Teresa'];
  const apellidosDummy = ['García', 'Fernández', 'López', 'Martínez', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Torres'];
  
  let dniCounter = 20000000;
  
  for (const u of unidadesOrganicas) {
    // @ts-ignore
    const uId = creadas[u.siglas];
    
    // Crear 3 empleados extra por cada área
    for (let i = 0; i < 3; i++) {
      const nombreAleatorio = nombresDummy[Math.floor(Math.random() * nombresDummy.length)];
      const apellidoAleatorio = apellidosDummy[Math.floor(Math.random() * apellidosDummy.length)];
      
      const cleanNombre = nombreAleatorio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const cleanApellido = apellidoAleatorio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      
      const emailDummy = `${cleanNombre}.${cleanApellido}${i}@chupaca.gob.pe`;
      
      await prisma.usuario.upsert({
        where: { correo: emailDummy },
        update: {},
        create: {
          dni: (dniCounter++).toString(),
          nombres: nombreAleatorio,
          apellidos: apellidoAleatorio,
          correo: emailDummy,
          passwordHash,
          rolId: 2, // 2 = 'Personal administrativo' (asumiendo que es el ID 2)
          unidadId: uId,
          activo: true,
        }
      }).catch(e => {
        // Fallback robusto en caso de conflicto de DNI o ID de rol no hallado (asignamos rol 1)
        prisma.usuario.create({
          data: {
            dni: (dniCounter + 1000).toString(),
            nombres: nombreAleatorio,
            apellidos: apellidoAleatorio,
            correo: `alt.${emailDummy}`,
            passwordHash,
            rolId: 1,
            unidadId: uId,
            activo: true
          }
        }).catch(() => {});
      });
    }
  }
  console.log('✅ Usuarios dummy extra creados exitosamente.');

  // 3. Crear Catálogo Base de Tipos Documentales
  const tiposDocumentales = [
    { nombre: 'Oficio', descripcion: 'Comunicación oficial externa o entre entidades', plazoDias: 30 },
    { nombre: 'Carta', descripcion: 'Comunicación formal externa dirigida a ciudadanos o empresas', plazoDias: 30 },
    { nombre: 'Memorando', descripcion: 'Comunicación interna breve entre dependencias', plazoDias: 15 },
    { nombre: 'Resolución', descripcion: 'Decisión formal y legal emitida por una autoridad', plazoDias: 30 },
    { nombre: 'Proveído', descripcion: 'Acto de derivación o respuesta breve en el trámite', plazoDias: 5 },
    { nombre: 'Informe', descripcion: 'Documento técnico o sustentatorio', plazoDias: 20 },
    { nombre: 'Solicitud', descripcion: 'Petición ingresada por un ciudadano externo', plazoDias: 30 },
  ];


  // Mejor borrar y crear para asegurar idempotencia en el seeder
  await prisma.tipoDocumental.deleteMany();
  for (const t of tiposDocumentales) {
    await prisma.tipoDocumental.create({
      data: {
        nombre: t.nombre,
        descripcion: t.descripcion,
        plazoDias: t.plazoDias
      }
    });
  }
  console.log('✅ Catálogo de Tipos Documentales poblado exitosamente.');

  // 4. Parámetros del Sistema
  const configs = [
    { clave: 'NOMBRE_INSTITUCION', valor: 'Municipalidad Provincial de Chupaca', descripcion: 'Nombre oficial de la institución' },
    { clave: 'RUC', valor: '20148133374', descripcion: 'RUC de la institución' },
    { clave: 'ANIO_FISCAL', valor: '2026', descripcion: 'Año activo para la generación de expedientes' },
  ];

  for (const c of configs) {
    await prisma.configuracion.upsert({
      where: { clave: c.clave },
      update: {}, // No sobreescribir si ya existe
      create: c,
    });
  }
  console.log('✅ Parámetros del Sistema (Configuración global) generados exitosamente.');

  console.log('\n✨ ¡Seeding completado exitosamente!');
  console.log('🔑 La contraseña para todos los usuarios es: admin123');
}

main()
  .catch((e) => {
    console.error('Error durante el seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

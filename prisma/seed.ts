import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';
import { UserRole } from '../src/lib/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados Incluvia (SQLite)...');

  const adminPasswordHash = await hashPassword('Admin@123456');
  const auditorPasswordHash = await hashPassword('Auditor@123456');

  // Upsert Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@Incluvia.local' },
    update: {},
    create: {
      email: 'admin@Incluvia.local',
      name: 'Administrador Incluvia',
      passwordHash: adminPasswordHash,
      role: UserRole.admin,
    },
  });

  // Upsert Auditor
  const auditor = await prisma.user.upsert({
    where: { email: 'auditor@Incluvia.local' },
    update: {},
    create: {
      email: 'auditor@Incluvia.local',
      name: 'Auditor Especialista',
      passwordHash: auditorPasswordHash,
      role: UserRole.auditor,
    },
  });

  console.log(`Usuários configurados: ${admin.email}, ${auditor.email}`);

  // Create Sample Project if none exists
  const existingProject = await prisma.project.findFirst({
    where: { name: 'Auditoria Piloto — Portal Institucional' },
  });

  if (!existingProject) {
    const sampleProject = await prisma.project.create({
      data: {
        name: 'Auditoria Piloto — Portal Institucional',
        description: 'Projeto demonstrativo: barreiras de interface (WCAG) e vieses em respostas de IA.'
        createdById: auditor.id,
        targets: {
          create: {
            name: 'Portal Exemplo',
            startUrl: 'https://example.com',
            description: 'Ambiente controlado de demonstração para testes de acessibilidade.',
            authorizationConfirmedAt: new Date(),
          },
        },
      },
      include: {
        targets: true,
      },
    });

    console.log(`Projeto demonstrativo criado com ID: ${sampleProject.id}`);
  }

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

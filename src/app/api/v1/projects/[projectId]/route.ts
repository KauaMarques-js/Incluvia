import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { updateProjectSchema } from '@/lib/schemas';
import { AppError, handleApiError } from '@/lib/errors';

interface Params {
  params: Promise<{ projectId: string }>;
}

async function getAuthorizedProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      targets: {
        select: {
          id: true,
          name: true,
          startUrl: true,
          description: true,
          authorizationConfirmedAt: true,
          createdAt: true,
          _count: { select: { auditRuns: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      aiEvaluations: {
        select: {
          id: true,
          scenarioTitle: true,
          modelName: true,
          createdAt: true,
          _count: { select: { findings: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { targets: true, aiEvaluations: true } },
    },
  });

  if (!project) {
    throw new AppError('NOT_FOUND', 'Projeto não encontrado.');
  }

  if (project.createdById !== userId) {
    throw new AppError('FORBIDDEN', 'Acesso negado a este projeto.');
  }

  return project;
}

/**
 * GET /api/v1/projects/:projectId
 * Returns project details with targets.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { projectId } = await params;
    const project = await getAuthorizedProject(projectId, session.userId);

    return NextResponse.json({ data: project });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/v1/projects/:projectId
 * Updates project name and/or description.
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { projectId } = await params;
    await getAuthorizedProject(projectId, session.userId);

    const body = await request.json();
    const result = updateProjectSchema.safeParse(body);

    if (!result.success) {
      throw new AppError('VALIDATION_ERROR', 'Verifique os campos informados.', {
        fields: result.error.flatten().fieldErrors,
      });
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: result.data,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

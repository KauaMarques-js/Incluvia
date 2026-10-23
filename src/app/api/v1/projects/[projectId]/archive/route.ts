import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { AppError, handleApiError } from '@/lib/errors';

interface Params {
  params: Promise<{ projectId: string }>;
}

/**
 * POST /api/v1/projects/:projectId/archive
 * Archives a project. Does not delete audit history.
 */
export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError('NOT_FOUND', 'Projeto não encontrado.');
    }

    if (project.createdById !== session.userId) {
      throw new AppError('FORBIDDEN', 'Acesso negado a este projeto.');
    }

    if (project.status === 'archived') {
      throw new AppError('CONFLICT', 'Projeto já está arquivado.');
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { status: 'archived' },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

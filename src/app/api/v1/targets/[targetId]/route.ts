import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { AppError, handleApiError } from '@/lib/errors';

interface Params {
  params: Promise<{ targetId: string }>;
}

/**
 * GET /api/v1/targets/:targetId
 * Returns target details with recent audit runs.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { targetId } = await params;

    const target = await prisma.auditTarget.findUnique({
      where: { id: targetId },
      include: {
        project: {
          select: { id: true, name: true, status: true, createdById: true },
        },
        auditRuns: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            finishedAt: true,
            createdAt: true,
            _count: { select: { findings: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!target) {
      throw new AppError('NOT_FOUND', 'Alvo não encontrado.');
    }
    if (target.project.createdById !== session.userId) {
      throw new AppError('FORBIDDEN', 'Acesso negado a este alvo.');
    }

    return NextResponse.json({ data: target });
  } catch (error) {
    return handleApiError(error);
  }
}

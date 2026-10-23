import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { AppError, handleApiError } from '@/lib/errors';

interface Params {
  params: Promise<{ auditId: string }>;
}

/**
 * POST /api/v1/audits/:auditId/cancel
 * Cancels a queued or running audit.
 */
export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { auditId } = await params;

    const run = await prisma.auditRun.findUnique({
      where: { id: auditId },
      include: {
        target: {
          select: { project: { select: { createdById: true } } },
        },
      },
    });

    if (!run) {
      throw new AppError('NOT_FOUND', 'Execução de auditoria não encontrada.');
    }
    if (run.target.project.createdById !== session.userId) {
      throw new AppError('FORBIDDEN', 'Acesso negado.');
    }
    if (!['queued', 'running'].includes(run.status)) {
      throw new AppError(
        'CONFLICT',
        'Apenas auditorias em fila ou em execução podem ser canceladas.'
      );
    }

    const updated = await prisma.auditRun.update({
      where: { id: auditId },
      data: {
        status: 'cancelled',
        finishedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        finishedAt: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

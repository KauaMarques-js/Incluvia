import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { AppError, handleApiError } from '@/lib/errors';

interface Params {
  params: Promise<{ evaluationId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { evaluationId } = await params;

    const evaluation = await prisma.aiEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        project: { select: { id: true, name: true, description: true, createdById: true } },
        findings: { orderBy: [{ impact: 'asc' }, { createdAt: 'asc' }] },
      },
    });

    if (!evaluation) {
      throw new AppError('NOT_FOUND', 'Avaliação de IA não encontrada.');
    }
    if (evaluation.project.createdById !== session.userId) {
      throw new AppError('FORBIDDEN', 'Acesso negado.');
    }

    return NextResponse.json({ data: evaluation });
  } catch (error) {
    return handleApiError(error);
  }
}

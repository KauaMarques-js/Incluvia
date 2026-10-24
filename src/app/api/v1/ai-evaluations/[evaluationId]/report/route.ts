import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { AppError, handleApiError } from '@/lib/errors';
import { generateAiBiasMarkdownReport } from '@/lib/ai-bias-report';

interface Params {
  params: Promise<{ evaluationId: string }>;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { evaluationId } = await params;

    const evaluation = await prisma.aiEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        project: { select: { name: true, description: true, createdById: true } },
        responses: { orderBy: [{ variant: 'desc' }, { position: 'asc' }] },
        findings: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!evaluation) {
      throw new AppError('NOT_FOUND', 'Avaliação de IA não encontrada.');
    }
    if (evaluation.project.createdById !== session.userId) {
      throw new AppError('FORBIDDEN', 'Acesso negado.');
    }

    const markdown = generateAiBiasMarkdownReport(evaluation);
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';
    const headers: Record<string, string> = {
      'Content-Type': 'text/markdown; charset=utf-8',
    };
    if (download) {
      headers['Content-Disposition'] = `attachment; filename="relatorio-vies-ia-${evaluation.id.slice(0, 8)}.md"`;
    }

    return new NextResponse(markdown, { status: 200, headers });
  } catch (error) {
    return handleApiError(error);
  }
}

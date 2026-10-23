import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { paginationSchema } from '@/lib/schemas';
import { AppError, handleApiError } from '@/lib/errors';

interface Params {
  params: Promise<{ auditId: string }>;
}

/**
 * GET /api/v1/audits/:auditId
 * Returns audit run details.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { auditId } = await params;

    const run = await prisma.auditRun.findUnique({
      where: { id: auditId },
      include: {
        target: {
          select: {
            id: true,
            name: true,
            startUrl: true,
            project: { select: { id: true, name: true, createdById: true } },
          },
        },
        _count: { select: { findings: true } },
      },
    });

    if (!run) {
      throw new AppError('NOT_FOUND', 'Execução de auditoria não encontrada.');
    }
    if (run.target.project.createdById !== session.userId) {
      throw new AppError('FORBIDDEN', 'Acesso negado.');
    }

    // Resumo calculado sobre todos os achados da execução (independe dos filtros da UI).
    const [byImpact, unreviewed] = await Promise.all([
      prisma.finding.groupBy({
        by: ['impact'],
        where: { auditRunId: auditId },
        _count: { _all: true },
      }),
      prisma.finding.count({ where: { auditRunId: auditId, reviewStatus: 'unreviewed' } }),
    ]);

    const summary = {
      total: run._count.findings,
      reviewed: run._count.findings - unreviewed,
      byImpact: Object.fromEntries(byImpact.map((row) => [row.impact, row._count._all])),
    };

    return NextResponse.json({ data: { ...run, summary } });
  } catch (error) {
    return handleApiError(error);
  }
}

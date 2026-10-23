import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { AppError, handleApiError } from '@/lib/errors';
import { FindingImpact, ReviewStatus } from '@/lib/enums';

interface Params {
  params: Promise<{ auditId: string }>;
}

/**
 * GET /api/v1/audits/:auditId/findings
 * Lists findings for an audit run with pagination and filters.
 */
export async function GET(request: Request, { params }: Params) {
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10) || 50));
    const skip = (page - 1) * limit;

    const impact = searchParams.get('impact');
    const reviewStatus = searchParams.get('reviewStatus');
    const search = searchParams.get('search')?.trim();

    const where: any = {
      auditRunId: auditId,
    };

    if (impact && Object.values(FindingImpact).includes(impact as FindingImpact)) {
      where.impact = impact as FindingImpact;
    }

    if (reviewStatus && Object.values(ReviewStatus).includes(reviewStatus as ReviewStatus)) {
      where.reviewStatus = reviewStatus as ReviewStatus;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { ruleId: { contains: search } },
        { pageUrl: { contains: search } },
      ];
    }

    const [total, findings] = await Promise.all([
      prisma.finding.count({ where }),
      prisma.finding.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ impact: 'asc' }, { createdAt: 'desc' }],
        include: {
          reviewedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: findings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

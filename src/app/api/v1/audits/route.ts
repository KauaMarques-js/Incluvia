import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/audits
 * Lists the most recent audit runs from the current user's projects (painel).
 */
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '5', 10) || 5));

    const where = { target: { project: { createdById: session.userId } } };

    const [runs, total] = await Promise.all([
      prisma.auditRun.findMany({
        where,
        select: {
          id: true,
          status: true,
          createdAt: true,
          finishedAt: true,
          target: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
          _count: { select: { findings: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.auditRun.count({ where }),
    ]);

    return NextResponse.json({ data: runs, pagination: { total, page: 1, limit, totalPages: 1 } });
  } catch (error) {
    return handleApiError(error);
  }
}

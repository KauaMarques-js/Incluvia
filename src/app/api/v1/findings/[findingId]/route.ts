import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { AppError, handleApiError } from '@/lib/errors';

interface Params {
  params: Promise<{ findingId: string }>;
}

/**
 * GET /api/v1/findings/:findingId
 * Returns finding details.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { findingId } = await params;

    const finding = await prisma.finding.findUnique({
      where: { id: findingId },
      include: {
        auditRun: {
          include: {
            target: {
              include: {
                project: { select: { id: true, name: true, createdById: true } },
              },
            },
          },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!finding) {
      throw new AppError('NOT_FOUND', 'Achado não encontrado.');
    }
    if (finding.auditRun.target.project.createdById !== session.userId) {
      throw new AppError('FORBIDDEN', 'Acesso negado.');
    }

    return NextResponse.json({ data: finding });
  } catch (error) {
    return handleApiError(error);
  }
}

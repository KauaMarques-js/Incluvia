import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { reviewFindingSchema } from '@/lib/schemas';
import { AppError, handleApiError } from '@/lib/errors';

interface Params {
  params: Promise<{ findingId: string }>;
}

/**
 * PATCH /api/v1/findings/:findingId/review
 * Updates human review status and notes for a finding.
 */
export async function PATCH(request: Request, { params }: Params) {
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
                project: { select: { createdById: true } },
              },
            },
          },
        },
      },
    });

    if (!finding) {
      throw new AppError('NOT_FOUND', 'Achado não encontrado.');
    }
    if (finding.auditRun.target.project.createdById !== session.userId) {
      throw new AppError('FORBIDDEN', 'Acesso negado.');
    }

    const body = await request.json();
    const input = reviewFindingSchema.parse(body);

    const updated = await prisma.finding.update({
      where: { id: findingId },
      data: {
        reviewStatus: input.reviewStatus,
        reviewNote: input.reviewNote || null,
        reviewedById: session.userId,
        reviewedAt: new Date(),
      },
      include: {
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

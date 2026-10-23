import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { reviewFindingSchema } from '@/lib/schemas';
import { AppError, handleApiError } from '@/lib/errors';

interface Params {
  params: Promise<{ findingId: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { findingId } = await params;

    const finding = await prisma.aiFinding.findUnique({
      where: { id: findingId },
      include: {
        evaluation: {
          include: { project: { select: { createdById: true } } },
        },
      },
    });

    if (!finding) {
      throw new AppError('NOT_FOUND', 'Achado não encontrado.');
    }
    if (finding.evaluation.project.createdById !== session.userId) {
      throw new AppError('FORBIDDEN', 'Acesso negado.');
    }

    const body = await request.json();
    const parsed = reviewFindingSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Verifique os campos informados.', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const updated = await prisma.aiFinding.update({
      where: { id: findingId },
      data: {
        reviewStatus: parsed.data.reviewStatus,
        reviewNote: parsed.data.reviewNote || null,
        reviewedById: session.userId,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

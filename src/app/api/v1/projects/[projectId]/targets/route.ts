import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { createTargetSchema } from '@/lib/schemas';
import { validateAuditUrl } from '@/lib/url-validator';
import { AppError, handleApiError } from '@/lib/errors';

interface Params {
  params: Promise<{ projectId: string }>;
}

/**
 * GET /api/v1/projects/:projectId/targets
 * Lists targets for a project.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError('NOT_FOUND', 'Projeto não encontrado.');
    }
    if (project.createdById !== session.userId) {
      throw new AppError('FORBIDDEN', 'Acesso negado a este projeto.');
    }

    const targets = await prisma.auditTarget.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        startUrl: true,
        description: true,
        authorizationConfirmedAt: true,
        createdAt: true,
        _count: { select: { auditRuns: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: targets });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/v1/projects/:projectId/targets
 * Registers a new audit target with URL validation.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError('NOT_FOUND', 'Projeto não encontrado.');
    }
    if (project.createdById !== session.userId) {
      throw new AppError('FORBIDDEN', 'Acesso negado a este projeto.');
    }
    if (project.status === 'archived') {
      throw new AppError(
        'CONFLICT',
        'Não é possível adicionar alvos a um projeto arquivado.'
      );
    }

    const body = await request.json();
    const result = createTargetSchema.safeParse(body);

    if (!result.success) {
      throw new AppError('VALIDATION_ERROR', 'Verifique os campos informados.', {
        fields: result.error.flatten().fieldErrors,
      });
    }

    // SSRF Protection: validate URL before persisting
    const urlValidation = await validateAuditUrl(result.data.startUrl);
    if (!urlValidation.valid) {
      throw new AppError('SSRF_BLOCKED', urlValidation.error ?? 'URL inválida.');
    }

    const target = await prisma.auditTarget.create({
      data: {
        projectId,
        name: result.data.name,
        startUrl: result.data.startUrl,
        description: result.data.description,
        authorizationConfirmedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        startUrl: true,
        description: true,
        authorizationConfirmedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: target }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { startAuditSchema } from '@/lib/schemas';
import { validateAuditUrl } from '@/lib/url-validator';
import { AppError, handleApiError } from '@/lib/errors';
import env from '@/lib/config';

interface Params {
  params: Promise<{ targetId: string }>;
}

/**
 * POST /api/v1/targets/:targetId/audits
 * Starts a new audit run. Returns 202 Accepted with the run ID.
 * The actual audit is processed asynchronously by the worker.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { targetId } = await params;

    const target = await prisma.auditTarget.findUnique({
      where: { id: targetId },
      include: {
        project: { select: { createdById: true, status: true } },
      },
    });

    if (!target) {
      throw new AppError('NOT_FOUND', 'Alvo não encontrado.');
    }
    if (target.project.createdById !== session.userId) {
      throw new AppError('FORBIDDEN', 'Acesso negado a este alvo.');
    }
    if (target.project.status === 'archived') {
      throw new AppError(
        'CONFLICT',
        'Não é possível iniciar auditoria em projeto arquivado.'
      );
    }

    // Check for running audits to limit concurrency
    const runningCount = await prisma.auditRun.count({
      where: {
        status: { in: ['queued', 'running'] },
        createdById: session.userId,
      },
    });

    if (runningCount >= env.audit.maxConcurrent) {
      throw new AppError(
        'AUDIT_LIMIT_EXCEEDED',
        `Limite de ${env.audit.maxConcurrent} auditorias simultâneas atingido. Aguarde a conclusão de uma auditoria.`
      );
    }

    // Re-validate URL at execution time
    const urlValidation = await validateAuditUrl(target.startUrl);
    if (!urlValidation.valid) {
      throw new AppError(
        'SSRF_BLOCKED',
        urlValidation.error ?? 'URL do alvo não é mais válida.'
      );
    }

    const body = await request.json().catch(() => ({}));
    const config = startAuditSchema.parse(body);

    const auditRun = await prisma.auditRun.create({
      data: {
        targetId,
        createdById: session.userId,
        status: 'queued',
        configuration: JSON.stringify({
          maxPages: Math.min(config.maxPages, env.audit.maxPages),
          maxDepth: Math.min(config.maxDepth, env.audit.maxDepth),
          timeoutMs: env.audit.timeoutMs,
        }),
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: auditRun }, { status: 202 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/v1/targets/:targetId/audits
 * Lists audit runs for a target (history).
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { targetId } = await params;

    const target = await prisma.auditTarget.findUnique({
      where: { id: targetId },
      include: { project: { select: { createdById: true } } },
    });

    if (!target) {
      throw new AppError('NOT_FOUND', 'Alvo não encontrado.');
    }
    if (target.project.createdById !== session.userId) {
      throw new AppError('FORBIDDEN', 'Acesso negado a este alvo.');
    }

    const runs = await prisma.auditRun.findMany({
      where: { targetId },
      select: {
        id: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        toolVersion: true,
        configuration: true,
        errorCode: true,
        createdAt: true,
        _count: { select: { findings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: runs });
  } catch (error) {
    return handleApiError(error);
  }
}

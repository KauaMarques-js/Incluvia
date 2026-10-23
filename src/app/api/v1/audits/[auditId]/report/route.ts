import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { AppError, handleApiError } from '@/lib/errors';
import { generateMarkdownReport } from '@/lib/report-generator';

interface Params {
  params: Promise<{ auditId: string }>;
}

/**
 * GET /api/v1/audits/:auditId/report
 * Returns the markdown audit report as text or download.
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { auditId } = await params;

    const run = await prisma.auditRun.findUnique({
      where: { id: auditId },
      include: {
        target: {
          include: {
            project: { select: { id: true, name: true, description: true, createdById: true } },
          },
        },
        findings: {
          orderBy: [{ impact: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!run) {
      throw new AppError('NOT_FOUND', 'Execução de auditoria não encontrada.');
    }
    if (run.target.project.createdById !== session.userId) {
      throw new AppError('FORBIDDEN', 'Acesso negado.');
    }

    const markdown = generateMarkdownReport(run as any);

    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';

    const headers: Record<string, string> = {
      'Content-Type': 'text/markdown; charset=utf-8',
    };

    if (download) {
      const filename = `relatorio-Incluvia-${run.id.slice(0, 8)}.md`;
      headers['Content-Disposition'] = `attachment; filename="${filename}"`;
    }

    return new NextResponse(markdown, {
      status: 200,
      headers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

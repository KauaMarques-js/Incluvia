import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { AppError, handleApiError } from '@/lib/errors';
import { guidanceFor, NEEDS_REVIEW_RULE_ID, suggestedSystemInstructions } from '@/lib/ai-bias-rubric';
import { ruleReviewStats } from '@/lib/ai-rule-stats';
import { getAiScenario } from '@/lib/ai-scenarios';

interface Params {
  params: Promise<{ evaluationId: string }>;
}

/**
 * GET /api/v1/ai-evaluations/:evaluationId
 * Avaliação com respostas, achados (com orientação e histórico da regra), instruções
 * sugeridas e a avaliação anterior do mesmo cenário no projeto (evolução).
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { evaluationId } = await params;

    const evaluation = await prisma.aiEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        project: { select: { id: true, name: true, status: true, createdById: true } },
        responses: { orderBy: [{ variant: 'desc' }, { position: 'asc' }] },
        findings: {
          orderBy: { createdAt: 'asc' },
          include: { reviewedBy: { select: { name: true } } },
        },
      },
    });

    if (!evaluation) {
      throw new AppError('NOT_FOUND', 'Avaliação de IA não encontrada.');
    }
    if (evaluation.project.createdById !== session.userId) {
      throw new AppError('FORBIDDEN', 'Acesso negado.');
    }

    const [stats, previous] = await Promise.all([
      ruleReviewStats(session.userId, [...new Set(evaluation.findings.map((f) => f.ruleId))]),
      prisma.aiEvaluation.findFirst({
        where: { projectId: evaluation.projectId, scenarioId: evaluation.scenarioId, createdAt: { lt: evaluation.createdAt } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          modelName: true,
          modelVersion: true,
          findings: { select: { impact: true, ruleId: true } },
        },
      }),
    ]);

    // O aviso "nenhum padrão encontrado" não é achado: fica fora da contagem.
    const countBy = (findings: { impact: string; ruleId: string }[]) => {
      const real = findings.filter((f) => f.ruleId !== NEEDS_REVIEW_RULE_ID);
      return { total: real.length, critical: real.filter((f) => f.impact === 'critical').length };
    };

    return NextResponse.json({
      data: {
        ...evaluation,
        scenario: getAiScenario(evaluation.scenarioId) ?? null,
        findings: evaluation.findings.map((finding) => ({
          ...finding,
          guidance: guidanceFor(finding.ruleId) ?? guidanceFor(finding.category),
          ruleStats: stats[finding.ruleId] ?? null,
        })),
        systemInstructions: suggestedSystemInstructions(evaluation.findings.filter((f) => f.reviewStatus !== 'false_positive')),
        previous: previous && {
          id: previous.id,
          createdAt: previous.createdAt,
          modelName: previous.modelName,
          modelVersion: previous.modelVersion,
          counts: countBy(previous.findings),
        },
        counts: countBy(evaluation.findings),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

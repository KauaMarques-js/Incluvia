import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { createAiEvaluationSchema } from '@/lib/schemas';
import { AppError, handleApiError } from '@/lib/errors';
import { getAiScenario } from '@/lib/ai-scenarios';
import { prepareEvaluation, toCreateData } from '@/lib/ai-evaluation-service';
import { isClaudeConfigured } from '@/lib/claude';
import { simulatorSupports } from '@/lib/ai-simulator';
import { ProjectStatus } from '@/lib/enums';

interface Params {
  params: Promise<{ projectId: string }>;
}

async function getOwnedProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError('NOT_FOUND', 'Projeto não encontrado.');
  if (project.createdById !== userId) throw new AppError('FORBIDDEN', 'Acesso negado a este projeto.');
  return project;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { projectId } = await params;
    await getOwnedProject(projectId, session.userId);

    const evaluations = await prisma.aiEvaluation.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { findings: true } },
      },
    });

    return NextResponse.json({ data: evaluations });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { projectId } = await params;
    const project = await getOwnedProject(projectId, session.userId);

    if (project.status === ProjectStatus.archived) {
      throw new AppError('CONFLICT', 'Não é possível avaliar IA em projeto arquivado.');
    }

    const input = createAiEvaluationSchema.parse(await request.json());
    const scenario = getAiScenario(input.scenarioId);
    if (!scenario) {
      throw new AppError('VALIDATION_ERROR', 'Cenário de teste inválido.');
    }
    if ((input.source === 'claude' || input.secondOpinion) && !isClaudeConfigured()) {
      throw new AppError('CONFLICT', 'A integração com o Claude não está configurada neste servidor (ANTHROPIC_API_KEY).');
    }
    if (input.source === 'simulator' && !simulatorSupports(scenario.id)) {
      throw new AppError('VALIDATION_ERROR', 'O simulador de demonstração não tem respostas para este cenário.');
    }

    const draft = await prepareEvaluation({
      scenario,
      mode: input.mode,
      prompt: input.prompt,
      referencePrompt: input.mode === 'paired' ? input.referencePrompt : null,
      source: input.source,
      repetitions: input.repetitions,
      targetResponses: input.targetResponses,
      referenceResponses: input.referenceResponses,
      modelName: input.modelName || null,
      modelVersion: input.modelVersion || null,
      secondOpinion: input.secondOpinion,
    });

    const evaluation = await prisma.aiEvaluation.create({
      data: toCreateData(draft, { projectId, scenario, userId: session.userId }),
      select: { id: true },
    });

    return NextResponse.json({ data: evaluation }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

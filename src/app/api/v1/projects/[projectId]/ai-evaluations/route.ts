import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { createAiEvaluationSchema } from '@/lib/schemas';
import { AppError, handleApiError } from '@/lib/errors';
import { getAiScenario } from '@/lib/ai-scenarios';
import { evaluateAiResponse } from '@/lib/ai-bias-rubric';
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

    const body = await request.json();
    const parsed = createAiEvaluationSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Verifique os campos informados.', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const scenario = getAiScenario(parsed.data.scenarioId);
    if (!scenario) {
      throw new AppError('VALIDATION_ERROR', 'Cenário de teste inválido.');
    }

    const rubricFindings = evaluateAiResponse({
      scenarioId: scenario.id,
      prompt: parsed.data.prompt,
      responseText: parsed.data.responseText,
    });

    const evaluation = await prisma.aiEvaluation.create({
      data: {
        projectId,
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        modelName: parsed.data.modelName || null,
        modelVersion: parsed.data.modelVersion || null,
        prompt: parsed.data.prompt,
        responseText: parsed.data.responseText,
        createdById: session.userId,
        findings: {
          create: rubricFindings.map((finding) => ({
            ruleId: finding.ruleId,
            category: finding.category,
            title: finding.title,
            description: finding.description,
            impact: finding.impact,
            evidence: finding.evidence,
            helpText: finding.helpText,
          })),
        },
      },
      include: {
        findings: true,
      },
    });

    return NextResponse.json({ data: evaluation }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

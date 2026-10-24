import type { Prisma } from '@prisma/client';
import { AppError } from '@/lib/errors';
import { evaluateResponses, type RubricFinding } from '@/lib/ai-bias-rubric';
import { aggregateJudgeIssues, judgeResponse } from '@/lib/ai-judge';
import { askClaude, CLAUDE_MODEL } from '@/lib/claude';
import { SIMULATOR_MODEL, SIMULATOR_VERSION, simulatedResponses } from '@/lib/ai-simulator';
import type { AiScenario } from '@/lib/ai-scenarios';

/**
 * Prepara uma avaliação de IA: obtém as respostas, aplica a rubrica e, se pedido,
 * a segunda opinião. Não acessa o banco: a rota e o seed persistem o resultado.
 */

export type ResponseSource = 'manual' | 'claude' | 'simulator';
export type EvaluationMode = 'paired' | 'single';

export interface EvaluationRequest {
  scenario: AiScenario;
  mode: EvaluationMode;
  prompt: string;
  referencePrompt: string | null;
  source: ResponseSource;
  /** Repetições por pergunta quando as respostas são geradas. */
  repetitions: number;
  targetResponses: string[];
  referenceResponses: string[];
  modelName: string | null;
  modelVersion: string | null;
  secondOpinion: boolean;
  /** Só para o simulador: escolhe outro trecho da lista de respostas. */
  simulatorOffset?: number;
}

export interface EvaluationDraft {
  mode: EvaluationMode;
  source: ResponseSource;
  prompt: string;
  referencePrompt: string | null;
  modelName: string | null;
  modelVersion: string | null;
  judgeStatus: 'done' | 'failed' | null;
  responses: { variant: 'target' | 'reference'; position: number; text: string; outcome: string | null }[];
  findings: RubricFinding[];
}

const clean = (texts: string[]) => texts.map((t) => t.trim()).filter(Boolean);

async function generateWithClaude(prompt: string, count: number) {
  try {
    return await Promise.all(Array.from({ length: count }, () => askClaude(prompt, { effort: 'medium' })));
  } catch (error) {
    console.error('[ai-evaluation] Falha ao gerar respostas com o Claude:', error instanceof Error ? error.message : error);
    throw new AppError('INTERNAL_ERROR', 'Não foi possível gerar as respostas com o Claude. Tente novamente ou cole as respostas.');
  }
}

async function collectResponses(req: EvaluationRequest) {
  const paired = req.mode === 'paired' && Boolean(req.referencePrompt);

  if (req.source === 'manual') {
    return {
      target: clean(req.targetResponses),
      reference: paired ? clean(req.referenceResponses) : [],
      modelName: req.modelName,
      modelVersion: req.modelVersion,
    };
  }

  if (req.source === 'simulator') {
    const offset = req.simulatorOffset ?? 0;
    return {
      target: simulatedResponses(req.scenario.id, 'target', req.repetitions, offset),
      reference: paired ? simulatedResponses(req.scenario.id, 'reference', req.repetitions, offset) : [],
      modelName: req.modelName ?? SIMULATOR_MODEL,
      modelVersion: req.modelVersion ?? SIMULATOR_VERSION,
    };
  }

  const [target, reference] = await Promise.all([
    generateWithClaude(req.prompt, req.repetitions),
    paired ? generateWithClaude(req.referencePrompt!, req.repetitions) : Promise.resolve([]),
  ]);
  // Com fallback, alguma resposta pode vir de outro modelo: registra todos que responderam.
  const served = [...new Set([...target, ...reference].map((r) => r.model))];
  return {
    target: target.map((r) => r.text),
    reference: reference.map((r) => r.text),
    modelName: CLAUDE_MODEL,
    modelVersion: served.join(', '),
  };
}

async function secondOpinion(scenario: AiScenario, prompt: string, responses: string[]) {
  try {
    const perResponse = await Promise.all(responses.map((r) => judgeResponse(scenario.hypothesis, prompt, r)));
    return { status: 'done' as const, findings: aggregateJudgeIssues(perResponse) };
  } catch (error) {
    console.error('[ai-evaluation] Segunda opinião indisponível:', error instanceof Error ? error.message : error);
    return { status: 'failed' as const, findings: [] };
  }
}

export async function prepareEvaluation(req: EvaluationRequest): Promise<EvaluationDraft> {
  const collected = await collectResponses(req);
  if (collected.target.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Nenhuma resposta para avaliar.');
  }

  const rubric = evaluateResponses({ scenario: req.scenario, target: collected.target, reference: collected.reference });
  const judge = req.secondOpinion ? await secondOpinion(req.scenario, req.prompt, collected.target) : null;
  const paired = collected.reference.length > 0;

  return {
    mode: paired ? 'paired' : 'single',
    source: req.source,
    prompt: req.prompt,
    referencePrompt: paired ? req.referencePrompt : null,
    modelName: collected.modelName,
    modelVersion: collected.modelVersion,
    judgeStatus: judge?.status ?? null,
    responses: [
      ...collected.target.map((text, i) => ({ variant: 'target' as const, position: i + 1, text, outcome: rubric.outcomes.target[i] ?? null })),
      ...collected.reference.map((text, i) => ({ variant: 'reference' as const, position: i + 1, text, outcome: rubric.outcomes.reference[i] ?? null })),
    ],
    findings: [...rubric.findings, ...(judge?.findings ?? [])],
  };
}

/** Dados de criação no Prisma (avaliação, respostas e achados em uma única escrita). */
export function toCreateData(
  draft: EvaluationDraft,
  context: { projectId: string; scenario: AiScenario; userId: string; createdAt?: Date }
): Prisma.AiEvaluationUncheckedCreateInput {
  const { responses, findings, ...evaluation } = draft;
  return {
    ...evaluation,
    projectId: context.projectId,
    scenarioId: context.scenario.id,
    scenarioTitle: context.scenario.title,
    createdById: context.userId,
    createdAt: context.createdAt,
    responses: { create: responses },
    findings: { create: findings },
  };
}

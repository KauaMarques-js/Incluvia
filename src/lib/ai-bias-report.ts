import { guidanceFor, NEEDS_REVIEW_RULE_ID, suggestedSystemInstructions } from '@/lib/ai-bias-rubric';
import {
  FINDING_SOURCE_LABEL,
  IMPACT_LABEL,
  IMPACT_ORDER,
  OUTCOME_LABEL,
  RESPONSE_SOURCE_LABEL,
  REVIEW_LABEL,
  frequencyLabel,
  methodLabel,
} from '@/lib/labels';

interface AiEvaluationForReport {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  mode: string;
  source: string;
  modelName: string | null;
  modelVersion: string | null;
  prompt: string;
  referencePrompt: string | null;
  judgeStatus: string | null;
  createdAt: Date;
  project: { name: string; description: string | null };
  responses: Array<{ variant: string; position: number; text: string; outcome: string | null }>;
  findings: Array<{
    ruleId: string;
    category: string;
    source: string;
    title: string;
    description: string;
    impact: string;
    evidence: string | null;
    helpText: string | null;
    occurrences: number;
    samples: number;
    referenceOccurrences: number | null;
    reviewStatus: string;
    reviewNote: string | null;
  }>;
}

const quote = (text: string) => text.split('\n').map((line) => `> ${line}`).join('\n');

function outcomeTable(responses: AiEvaluationForReport['responses']): string {
  const count = (variant: string, outcome: string) =>
    responses.filter((r) => r.variant === variant && r.outcome === outcome).length;
  const rows = ['favorable', 'unfavorable', 'neutral']
    .map((o) => `| ${OUTCOME_LABEL[o]} | ${count('target', o)} | ${count('reference', o)} |`)
    .join('\n');
  return `| Desfecho | Com a característica | Referência |\n| --- | ---: | ---: |\n${rows}\n`;
}

export function generateAiBiasMarkdownReport(evaluation: AiEvaluationForReport): string {
  const target = evaluation.responses.filter((r) => r.variant === 'target');
  const reference = evaluation.responses.filter((r) => r.variant === 'reference');
  const paired = evaluation.mode === 'paired' && reference.length > 0;
  const hasOutcomes = evaluation.responses.some((r) => r.outcome);
  const realFindings = evaluation.findings.filter((f) => f.ruleId !== NEEDS_REVIEW_RULE_ID);
  const date = evaluation.createdAt.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const model = [evaluation.modelName || 'não informado', evaluation.modelVersion].filter(Boolean).join(' · ');

  let md = `# Relatório de avaliação de capacitismo em IA — Incluvia

## Identificação

- **Projeto:** ${evaluation.project.name}
- **Cenário:** ${evaluation.scenarioTitle} (\`${evaluation.scenarioId}\`)
- **Método:** ${methodLabel(evaluation.mode, target.length)}
- **Origem das respostas:** ${RESPONSE_SOURCE_LABEL[evaluation.source] ?? evaluation.source}
- **Modelo:** ${model}
- **Data:** ${date}
- **ID:** \`${evaluation.id}\`

## O que esta avaliação cobre

A Incluvia aplicou uma **rubrica local** de capacitismo a ${target.length} resposta(s)${paired ? ` e comparou-as com ${reference.length} resposta(s) a uma pergunta de referência que muda **apenas** a menção à deficiência` : ''}. Cada achado informa em quantas respostas apareceu.${evaluation.judgeStatus === 'done' ? ' Achados marcados como “Segunda opinião (IA)” foram sugeridos por um modelo de linguagem e também exigem revisão humana.' : ''}

Os achados são **indícios** e **não provam discriminação**. A decisão é sempre de uma pessoa revisora.

## Perguntas

**Com a característica avaliada:**

${quote(evaluation.prompt)}
`;

  if (paired && evaluation.referencePrompt) {
    md += `\n**Referência (sem a característica):**\n\n${quote(evaluation.referencePrompt)}\n`;
  }

  if (paired && hasOutcomes) {
    md += `\n## Comparação de desfechos\n\n${outcomeTable(evaluation.responses)}`;
  }

  md += `\n## Achados (${realFindings.length})\n`;
  if (realFindings.length === 0) {
    md += '\nA rubrica não encontrou padrão conhecido. Isso **não** atesta ausência de capacitismo: leia as respostas abaixo.\n';
  }

  for (const impact of [...IMPACT_ORDER, 'unknown']) {
    for (const finding of realFindings.filter((f) => f.impact === impact)) {
      const guidance = guidanceFor(finding.ruleId) ?? guidanceFor(finding.category);
      md += `\n### ${finding.title}\n\n`;
      md += `- **Severidade:** ${IMPACT_LABEL[finding.impact] ?? finding.impact}\n`;
      md += `- **Origem:** ${FINDING_SOURCE_LABEL[finding.source] ?? finding.source}\n`;
      md += `- **Frequência:** ${frequencyLabel(finding.occurrences, finding.samples)}`;
      md += finding.referenceOccurrences !== null ? ` (na referência: ${finding.referenceOccurrences})\n` : '\n';
      md += `- **Revisão:** ${REVIEW_LABEL[finding.reviewStatus] ?? finding.reviewStatus}\n\n`;
      md += `${finding.description}\n\n`;
      if (finding.evidence) md += `**Trecho:** “${finding.evidence}”\n\n`;
      if (finding.helpText) md += `**Como corrigir:** ${finding.helpText}\n\n`;
      if (guidance) md += `**Exemplo:** ${guidance.rewrite}\n\n`;
      if (finding.reviewNote) md += `**Nota da revisão:** ${finding.reviewNote}\n\n`;
    }
  }

  const instructions = suggestedSystemInstructions(realFindings.filter((f) => f.reviewStatus !== 'false_positive'));
  if (instructions.length > 0) {
    md += `\n## Como corrigir no sistema avaliado\n\nInstruções sugeridas para o prompt de sistema (revise antes de usar):\n\n${instructions.map((i) => `- ${i}`).join('\n')}\n`;
  }

  md += '\n## Respostas analisadas\n';
  for (const [title, list] of [
    ['Com a característica', target],
    ['Referência', reference],
  ] as const) {
    if (list.length === 0) continue;
    md += `\n### ${title}\n`;
    for (const response of list) {
      const outcome = response.outcome ? ` — ${OUTCOME_LABEL[response.outcome]}` : '';
      md += `\n**Resposta ${response.position}${outcome}**\n\n${quote(response.text)}\n`;
    }
  }

  md += `
## Limitações

- Regras de texto não pegam todo viés; a comparação pareada reduz, mas não elimina, falsos positivos e negativos.
- Respostas de IA variam: poucas repetições dão evidência fraca.
- Testes de padrão não substituem consulta a pessoas com deficiência.
- Uma avaliação sem achados **não** está “livre de capacitismo”.
`;

  return md;
}

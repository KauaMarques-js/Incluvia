interface AiEvaluationForReport {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  modelName: string | null;
  modelVersion: string | null;
  prompt: string;
  responseText: string;
  createdAt: Date;
  project: {
    name: string;
    description: string | null;
  };
  findings: Array<{
    ruleId: string;
    category: string;
    title: string;
    description: string;
    impact: string;
    evidence: string | null;
    helpText: string | null;
    reviewStatus: string;
    reviewNote: string | null;
  }>;
}

export function generateAiBiasMarkdownReport(evaluation: AiEvaluationForReport): string {
  const impactCounts: Record<string, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    unknown: 0,
  };
  const reviewCounts: Record<string, number> = {
    unreviewed: 0,
    confirmed: 0,
    false_positive: 0,
    needs_context: 0,
    fixed: 0,
  };

  for (const finding of evaluation.findings) {
    if (finding.impact in impactCounts) impactCounts[finding.impact]++;
    if (finding.reviewStatus in reviewCounts) reviewCounts[finding.reviewStatus]++;
  }

  const dateFormatted = evaluation.createdAt.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const order = ['critical', 'serious', 'moderate', 'minor', 'unknown'];
  const grouped: Record<string, typeof evaluation.findings> = {};
  for (const key of order) grouped[key] = [];
  for (const finding of evaluation.findings) {
    const bucket = grouped[finding.impact] ? finding.impact : 'unknown';
    grouped[bucket].push(finding);
  }

  let md = `# Relatório de avaliação de capacitismo algorítmico — Incluvia

## Identificação

- **Projeto:** ${evaluation.project.name}
- **Cenário:** ${evaluation.scenarioTitle} (\`${evaluation.scenarioId}\`)
- **Modelo informado:** ${evaluation.modelName || 'não informado'}${evaluation.modelVersion ? ` (${evaluation.modelVersion})` : ''}
- **Data:** ${dateFormatted}
- **ID:** \`${evaluation.id}\`

${evaluation.project.description ? `> ${evaluation.project.description}\n` : ''}
## O que esta avaliação cobre

Esta execução aplica uma **rubrica local** sobre um prompt e uma resposta colados pelo auditor. Não chama provedor de IA, não treina modelo e **não prova discriminação**. Os achados são indícios linguísticos e de omissão, sujeitos a revisão humana.

## Material avaliado

### Prompt

\`\`\`text
${evaluation.prompt}
\`\`\`

### Resposta

\`\`\`text
${evaluation.responseText}
\`\`\`

## Resumo

| Impacto | Quantidade |
| --- | ---: |
| Crítico | ${impactCounts.critical} |
| Grave | ${impactCounts.serious} |
| Moderado | ${impactCounts.moderate} |
| Leve | ${impactCounts.minor} |

Revisão: ${reviewCounts.confirmed} confirmado(s), ${reviewCounts.false_positive} falso(s) positivo(s), ${reviewCounts.needs_context} com contexto, ${reviewCounts.unreviewed} sem revisão.

## Achados
`;

  for (const key of order) {
    const items = grouped[key];
    if (!items.length) continue;
    md += `\n### ${key}\n\n`;
    for (const finding of items) {
      md += `#### ${finding.title}\n\n`;
      md += `- **Regra:** \`${finding.ruleId}\`\n`;
      md += `- **Categoria:** ${finding.category}\n`;
      md += `- **Revisão:** ${finding.reviewStatus}\n`;
      md += `\n${finding.description}\n\n`;
      if (finding.evidence) md += `**Trecho:** \`${finding.evidence.replace(/`/g, "'")}\`\n\n`;
      if (finding.helpText) md += `**Orientação:** ${finding.helpText}\n\n`;
      if (finding.reviewNote) md += `**Nota humana:** ${finding.reviewNote}\n\n`;
    }
  }

  md += `## Limitações

- Testes de padrão não substituem consulta a pessoas com deficiência.
- Uma resposta sem achado automático **não** está “livre de capacitismo”.
- Diferenças entre modelos ou execuções não são, sozinhas, prova jurídica.
`;

  return md;
}

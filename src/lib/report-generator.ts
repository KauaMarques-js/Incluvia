interface AuditRunForReport {
  id: string;
  status: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  toolVersion: string | null;
  configuration: any;
  createdAt: Date;
  target: {
    name: string;
    startUrl: string;
    project: {
      name: string;
      description: string | null;
    };
  };
  findings: Array<{
    id: string;
    ruleId: string;
    title: string;
    description: string;
    impact: string;
    pageUrl: string;
    elementSelector: string | null;
    helpUrl: string | null;
    reviewStatus: string;
    reviewNote: string | null;
    reviewedAt: Date | null;
  }>;
}

export function generateMarkdownReport(run: AuditRunForReport): string {
  const { target, findings } = run;
  const project = target.project;

  let config: any = {};
  try {
    config = typeof run.configuration === 'string' ? JSON.parse(run.configuration) : (run.configuration || {});
  } catch {
    config = {};
  }

  // Counts by impact
  const impactCounts = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    unknown: 0,
  };

  // Counts by review status
  const reviewCounts = {
    unreviewed: 0,
    confirmed: 0,
    false_positive: 0,
    needs_context: 0,
    fixed: 0,
  };

  for (const f of findings) {
    if (f.impact in impactCounts) {
      impactCounts[f.impact as keyof typeof impactCounts]++;
    }
    if (f.reviewStatus in reviewCounts) {
      reviewCounts[f.reviewStatus as keyof typeof reviewCounts]++;
    }
  }

  const durationSec =
    run.startedAt && run.finishedAt
      ? ((run.finishedAt.getTime() - run.startedAt.getTime()) / 1000).toFixed(1)
      : 'N/A';

  const dateFormatted = run.createdAt.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  // Group findings by impact order: critical -> serious -> moderate -> minor -> unknown
  const order = ['critical', 'serious', 'moderate', 'minor', 'unknown'];
  const groupedFindings: Record<string, typeof findings> = {};
  for (const key of order) {
    groupedFindings[key] = findings.filter((f) => f.impact === key);
  }

  const lines: string[] = [
    `# Relatório de Auditoria de Acessibilidade — Incluvia`,
    '',
    `> **Aviso Importante sobre Limitações Metodológicas:**`,
    `> Este relatório apresenta indícios técnicos identificados por ferramentas de varredura automatizada (axe-core / Playwright) e revisões registradas por especialistas humanos.`,
    `> Varreduras automatizadas detectam tipicamente entre 30% e 50% dos problemas de acessibilidade de acordo com as WCAG 2.2. A ausência de violações automáticas **não certifica** acessibilidade total, conformidade legal, nem ausência de barreiras de usabilidade ou capacitismo algorítmico.`,
    '',
    `## 1. Identificação do Projeto e Alvo`,
    '',
    `- **Projeto:** ${project.name}`,
    project.description ? `- **Descrição do Projeto:** ${project.description}` : '',
    `- **Alvo Auditado:** ${target.name}`,
    `- **URL Inicial:** \`${target.startUrl}\``,
    `- **ID da Execução:** \`${run.id}\``,
    `- **Data de Início:** ${dateFormatted}`,
    `- **Duração da Execução:** ${durationSec}s`,
    `- **Versão do Motor de Auditoria:** ${run.toolVersion ?? 'axe-core 4.x / Playwright'}`,
    `- **Status da Execução:** ${run.status}`,
    '',
    `## 2. Escopo e Configuração dos Testes`,
    '',
    `- **Páginas Máximas:** ${config?.maxPages ?? 20}`,
    `- **Profundidade Máxima:** ${config?.maxDepth ?? 3}`,
    `- **Padrão Referência:** WCAG 2.2 Níveis A e AA / axe-core accessibility engine`,
    `- **Restrições de Segurança:** Acesso estritamente restrito ao mesmo host, com validação anti-SSRF e bloqueio de redes privadas/metadados.`,
    '',
    `## 3. Resumo Executivo dos Achados`,
    '',
    `| Severidade / Impacto | Quantidade | Percentual |`,
    `| :--- | :---: | :---: |`,
    `| 🔴 Crítico (Critical) | ${impactCounts.critical} | ${findings.length ? ((impactCounts.critical / findings.length) * 100).toFixed(1) : 0}% |`,
    `| 🟠 Grave (Serious) | ${impactCounts.serious} | ${findings.length ? ((impactCounts.serious / findings.length) * 100).toFixed(1) : 0}% |`,
    `| 🟡 Moderado (Moderate) | ${impactCounts.moderate} | ${findings.length ? ((impactCounts.moderate / findings.length) * 100).toFixed(1) : 0}% |`,
    `| 🔵 Leve (Minor) | ${impactCounts.minor} | ${findings.length ? ((impactCounts.minor / findings.length) * 100).toFixed(1) : 0}% |`,
    `| ⚪ Desconhecido (Unknown) | ${impactCounts.unknown} | ${findings.length ? ((impactCounts.unknown / findings.length) * 100).toFixed(1) : 0}% |`,
    `| **Total de Achados** | **${findings.length}** | **100%** |`,
    '',
    `### Estado da Revisão Humana`,
    '',
    `- **Não revisados:** ${reviewCounts.unreviewed}`,
    `- **Confirmados:** ${reviewCounts.confirmed}`,
    `- **Falsos positivos identificados:** ${reviewCounts.false_positive}`,
    `- **Necessitam de contexto adicional:** ${reviewCounts.needs_context}`,
    `- **Corrigidos:** ${reviewCounts.fixed}`,
    '',
    `## 4. Detalhamento dos Achados`,
    '',
  ].filter((l) => l !== '');

  if (findings.length === 0) {
    lines.push(
      `*Nenhum achado automatizado foi identificado durante esta varredura.*`,
      '',
      `Recomenda-se realizar testes complementares de navegação por teclado, testes com leitores de tela (NVDA/JAWS/VoiceOver) e auditoria manual com pessoas com deficiência.`
    );
  } else {
    for (const impactKey of order) {
      const list = groupedFindings[impactKey];
      if (list.length === 0) continue;

      const titleMap: Record<string, string> = {
        critical: 'Achados Críticos (Impacto Elevado — Impede o Acesso)',
        serious: 'Achados Graves (Impacto Significativo — Dificulta Severamente)',
        moderate: 'Achados Moderados (Impacto Intermediário — Causa Fricção)',
        minor: 'Achados Leves (Impacto Pequeno — Inconveniente Menor)',
        unknown: 'Achados com Impacto Indeterminado',
      };

      lines.push(`### ${titleMap[impactKey]} (${list.length})`, '');

      list.forEach((f, index) => {
        lines.push(
          `#### ${index + 1}. [${f.ruleId}] ${f.title}`,
          '',
          `- **Descrição:** ${f.description}`,
          `- **URL Afetada:** \`${f.pageUrl}\``,
          f.elementSelector ? `- **Seletor CSS:** \`${f.elementSelector}\`` : '',
          f.helpUrl ? `- **Documentação / Diretriz:** [Guia de Correção](${f.helpUrl})` : '',
          `- **Status de Revisão Humana:** \`${f.reviewStatus}\``,
          f.reviewNote ? `- **Nota do Revisor:** ${f.reviewNote}` : '',
          ''
        );
      });
    }
  }

  lines.push(
    `## 5. Recomendações Técnicas Gerais`,
    '',
    `1. **Priorizar achados críticos e graves:** Foco inicial naqueles que bloqueiam usuários de tecnologias assistivas, como falta de rótulos acessíveis em formulários, botões sem texto acessível e contraste insuficiente em textos centrais.`,
    `2. **Validação Manual Contínua:** Promover testes de usabilidade com usuários de leitores de tela e navegação exclusivamente via teclado (Tab, Shift+Tab, Enter, Espaço).`,
    `3. **Semântica HTML Nativa:** Substituir elementos genéricos (\`<div>\` e \`<span>\` clicáveis) por tags semânticas apropriadas (\`<button>\`, \`<a>\`, \`<main>\`, \`<nav>\`).`,
    `4. **Acessibilidade não é apenas código:** Avaliar a clareza textual, tempo suficiente para leitura, mensagens de erro explicativas e ausência de barreiras atitudinais ou capacitistas no fluxo da aplicação.`,
    '',
    `---`,
    `*Relatório gerado automaticamente pela Plataforma Incluvia.*`
  );

  return lines.filter((l) => l !== null && l !== undefined).join('\n');
}

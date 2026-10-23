import { describe, it, expect } from 'vitest';
import { generateMarkdownReport } from '../src/lib/report-generator';

describe('Markdown Report Generator (RF-08)', () => {
  const mockRun: any = {
    id: '12345678-1234-1234-1234-123456789abc',
    status: 'completed',
    startedAt: new Date('2026-10-23T14:00:00Z'),
    finishedAt: new Date('2026-10-23T14:00:15Z'),
    toolVersion: 'axe-core 4.10 / Playwright 1.48',
    configuration: { maxPages: 10, maxDepth: 2 },
    createdAt: new Date('2026-10-23T14:00:00Z'),
    target: {
      name: 'Portal Demonstrativo',
      startUrl: 'https://exemplo.gov.br',
      project: {
        name: 'Projeto Acessibilidade Geral',
        description: 'Auditoria institucional',
      },
    },
    findings: [
      {
        id: 'f1',
        ruleId: 'image-alt',
        title: 'Imagens devem possuir texto alternativo',
        description: 'Element does not have an alt attribute',
        impact: 'critical',
        pageUrl: 'https://exemplo.gov.br',
        elementSelector: 'img.banner-hero',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
        reviewStatus: 'confirmed',
        reviewNote: 'Imagem promocional sem descrição para leitores de tela.',
        reviewedAt: new Date(),
      },
      {
        id: 'f2',
        ruleId: 'color-contrast',
        title: 'Elementos devem ter contraste de cor suficiente',
        description: 'Element has insufficient color contrast of 2.5:1',
        impact: 'serious',
        pageUrl: 'https://exemplo.gov.br/sobre',
        elementSelector: 'span.subtext',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
        reviewStatus: 'unreviewed',
        reviewNote: null,
        reviewedAt: null,
      },
    ],
  };

  it('should generate markdown containing project and target details', () => {
    const report = generateMarkdownReport(mockRun);
    expect(report).toContain('# Relatório de Auditoria de Acessibilidade — Incluvia');
    expect(report).toContain('Portal Demonstrativo');
    expect(report).toContain('https://exemplo.gov.br');
    expect(report).toContain('12345678-1234-1234-1234-123456789abc');
  });

  it('should contain mandatory ethical and methodological disclaimers', () => {
    const report = generateMarkdownReport(mockRun);
    expect(report).toContain('Aviso Importante sobre Limitações Metodológicas');
    expect(report).toContain('não certifica');
    expect(report).toContain('capacitismo');
  });

  it('should summarize findings by impact and review status', () => {
    const report = generateMarkdownReport(mockRun);
    expect(report).toContain('Crítico (Critical)');
    expect(report).toContain('Grave (Serious)');
    expect(report).toContain('Total de Achados');
    expect(report).toContain('Não revisados:');
    expect(report).toContain('Confirmados:');
  });

  it('should detail individual findings with selectors and guidelines', () => {
    const report = generateMarkdownReport(mockRun);
    expect(report).toContain('[image-alt]');
    expect(report).toContain('img.banner-hero');
    expect(report).toContain('https://dequeuniversity.com/rules/axe/4.10/image-alt');
    expect(report).toContain('Imagem promocional sem descrição');
  });

  it('should not leak sensitive data or credentials', () => {
    const report = generateMarkdownReport(mockRun);
    expect(report).not.toContain('password');
    expect(report).not.toContain('cookie');
    expect(report).not.toContain('secret');
  });
});

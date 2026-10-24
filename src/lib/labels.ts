/**
 * Fonte única dos rótulos exibidos na interface (pt-BR).
 * Cores nunca comunicam estado sozinhas: todo badge usa estes textos.
 */

export const IMPACT_ORDER = ['critical', 'serious', 'moderate', 'minor'] as const;

export const IMPACT_LABEL: Record<string, string> = {
  critical: 'Crítico',
  serious: 'Grave',
  moderate: 'Moderado',
  minor: 'Leve',
  unknown: 'Desconhecido',
};

export const REVIEW_LABEL: Record<string, string> = {
  unreviewed: 'Não revisado',
  confirmed: 'Confirmado',
  false_positive: 'Falso positivo',
  needs_context: 'Requer contexto',
  fixed: 'Corrigido',
};

/** Explicação curta de cada estado de revisão (RF-06), usada no formulário de revisão. */
export const REVIEW_HINT: Record<string, string> = {
  unreviewed: 'Ainda não avaliado por uma pessoa.',
  confirmed: 'Barreira real, confirmada após revisão.',
  false_positive: 'Não se aplica neste contexto.',
  needs_context: 'Exige avaliação adicional.',
  fixed: 'Correção verificada por nova execução.',
};

export const AUDIT_STATUS_LABEL: Record<string, string> = {
  queued: 'Na fila',
  running: 'Em execução',
  completed: 'Concluída',
  failed: 'Falha técnica',
  cancelled: 'Cancelada',
};

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  active: 'Ativo',
  archived: 'Arquivado',
};

export function isAuditInProgress(status: string): boolean {
  return status === 'queued' || status === 'running';
}

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('pt-BR');
}

export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatDuration(from: string | Date, to: string | Date = new Date()): string {
  const seconds = Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes} min ${seconds % 60} s` : `${seconds} s`;
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

// ─── Avaliação de IA ─────────────────────────────────────────────────────────

export const RESPONSE_SOURCE_LABEL: Record<string, string> = {
  manual: 'Respostas coladas pelo auditor',
  claude: 'Geradas pela API do Claude',
  simulator: 'Simulador de demonstração (respostas pré-escritas, não geradas por IA)',
};

export const RESPONSE_SOURCE_SHORT: Record<string, string> = {
  manual: 'Respostas coladas',
  claude: 'Geradas com Claude',
  simulator: 'Simulador de demonstração',
};

export const FINDING_SOURCE_LABEL: Record<string, string> = {
  rubric: 'Rubrica',
  comparison: 'Comparação pareada',
  ai_judge: 'Segunda opinião (IA)',
};

export const OUTCOME_LABEL: Record<string, string> = {
  favorable: 'Favorável',
  unfavorable: 'Desfavorável',
  neutral: 'Sem decisão clara',
};

export function methodLabel(mode: string, samples: number): string {
  const reps = plural(samples, 'resposta', 'respostas');
  return mode === 'paired' ? `Comparação pareada · ${reps} por pergunta` : `Pergunta única · ${reps}`;
}

export function frequencyLabel(occurrences: number, samples: number): string {
  return `${occurrences} de ${samples} ${samples === 1 ? 'resposta' : 'respostas'}`;
}

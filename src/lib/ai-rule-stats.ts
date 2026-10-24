import { prisma } from '@/lib/prisma';

/**
 * Histórico das revisões humanas por regra: cada achado confirmado ou marcado como
 * falso positivo mede a precisão da regra. Assim a rubrica é calibrada por quem revisa.
 */
export interface RuleStats {
  confirmed: number;
  falsePositive: number;
  /** Achados com decisão (confirmado, corrigido ou falso positivo). */
  decided: number;
}

export async function ruleReviewStats(userId: string, ruleIds?: string[]): Promise<Record<string, RuleStats>> {
  const rows = await prisma.aiFinding.groupBy({
    by: ['ruleId', 'reviewStatus'],
    where: {
      evaluation: { project: { createdById: userId } },
      reviewStatus: { in: ['confirmed', 'fixed', 'false_positive'] },
      ...(ruleIds ? { ruleId: { in: ruleIds } } : {}),
    },
    _count: { _all: true },
  });

  const stats: Record<string, RuleStats> = {};
  for (const row of rows) {
    const entry = (stats[row.ruleId] ??= { confirmed: 0, falsePositive: 0, decided: 0 });
    if (row.reviewStatus === 'false_positive') entry.falsePositive += row._count._all;
    else entry.confirmed += row._count._all;
    entry.decided += row._count._all;
  }
  return stats;
}

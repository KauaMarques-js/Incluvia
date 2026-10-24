import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { handleApiError } from '@/lib/errors';
import { AI_SCENARIOS } from '@/lib/ai-scenarios';
import { RULE_CATALOG } from '@/lib/ai-bias-rubric';
import { ruleReviewStats } from '@/lib/ai-rule-stats';
import { simulatorSupports } from '@/lib/ai-simulator';
import { CLAUDE_MODEL, isClaudeConfigured } from '@/lib/claude';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/ai-catalog
 * Biblioteca de cenários, regras da rubrica (com histórico de revisões do usuário)
 * e meios disponíveis para obter respostas.
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const stats = await ruleReviewStats(session.userId);

    return NextResponse.json({
      data: {
        scenarios: AI_SCENARIOS.map((scenario) => ({
          ...scenario,
          simulator: simulatorSupports(scenario.id),
        })),
        rules: RULE_CATALOG.map((rule) => ({ ...rule, stats: stats[rule.ruleId] ?? null })),
        claude: { available: isClaudeConfigured(), model: CLAUDE_MODEL },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

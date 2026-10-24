import Anthropic from '@anthropic-ai/sdk';

/**
 * Único ponto de acesso à API do Claude (SDK oficial).
 * Usado para gerar respostas do modelo auditado e para a segunda opinião da rubrica.
 * As credenciais vêm do ambiente (ANTHROPIC_API_KEY); nada é exposto ao navegador.
 */
export const CLAUDE_MODEL = 'claude-opus-5-5';

export class ClaudeRefusalError extends Error {
  constructor() {
    super('O Claude recusou a solicitação.');
    this.name = 'ClaudeRefusalError';
  }
}

/** A integração só aparece como disponível quando há credencial no servidor. */
export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

interface AskOptions {
  effort: 'low' | 'medium' | 'high';
  /** JSON Schema para resposta estruturada. */
  jsonSchema?: Record<string, unknown>;
}

/** Envia um prompt e devolve o texto da resposta e o modelo que de fato respondeu. */
export async function askClaude(prompt: string, { effort, jsonSchema }: AskOptions): Promise<{ text: string; model: string }> {
  const response = await getClient().beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    // Se o classificador de segurança recusar, a API repete no modelo recomendado.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort, ...(jsonSchema ? { format: { type: 'json_schema', schema: jsonSchema } } : {}) },
    messages: [{ role: 'user', content: prompt }],
  });

  if (response.stop_reason === 'refusal') throw new ClaudeRefusalError();

  const text = response.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
  return { text, model: response.model };
}

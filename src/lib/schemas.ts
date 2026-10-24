import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('E-mail inválido.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Project ─────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres.')
    .max(200, 'Nome deve ter no máximo 200 caracteres.'),
  description: z
    .string()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres.')
    .optional()
    .default(''),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres.')
    .max(200, 'Nome deve ter no máximo 200 caracteres.')
    .optional(),
  description: z
    .string()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres.')
    .optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ─── Target ──────────────────────────────────────────────────────────────────

export const createTargetSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres.')
    .max(200, 'Nome deve ter no máximo 200 caracteres.'),
  startUrl: z
    .string()
    .url('URL inválida.')
    .max(2000, 'URL deve ter no máximo 2000 caracteres.'),
  description: z
    .string()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres.')
    .optional()
    .default(''),
  authorizationConfirmed: z.literal(true, {
    errorMap: () => ({
      message: 'Você deve confirmar que tem autorização para testar este alvo.',
    }),
  }),
});

export type CreateTargetInput = z.infer<typeof createTargetSchema>;

// ─── Audit ───────────────────────────────────────────────────────────────────

export const startAuditSchema = z.object({
  maxPages: z.number().int().min(1).max(100).optional().default(20),
  maxDepth: z.number().int().min(1).max(10).optional().default(3),
});

export type StartAuditInput = z.infer<typeof startAuditSchema>;

// ─── Finding Review ──────────────────────────────────────────────────────────

export const reviewFindingSchema = z.object({
  reviewStatus: z.enum([
    'unreviewed',
    'confirmed',
    'false_positive',
    'needs_context',
    'fixed',
  ]),
  reviewNote: z
    .string()
    .max(2000, 'Nota deve ter no máximo 2000 caracteres.')
    .optional()
    .default(''),
});

export type ReviewFindingInput = z.infer<typeof reviewFindingSchema>;

const aiResponseText = z.string().max(20000, 'Cada resposta deve ter no máximo 20000 caracteres.');
const aiPrompt = z.string().trim().max(8000, 'A pergunta deve ter no máximo 8000 caracteres.');

export const createAiEvaluationSchema = z
  .object({
    scenarioId: z.string().min(1, 'Selecione um cenário.'),
    mode: z.enum(['paired', 'single']).default('paired'),
    prompt: aiPrompt.pipe(z.string().min(10, 'Informe a pergunta (mínimo 10 caracteres).')),
    referencePrompt: aiPrompt.optional().default(''),
    source: z.enum(['manual', 'claude', 'simulator']).default('manual'),
    repetitions: z.number().int().min(1).max(5).default(3),
    targetResponses: z.array(aiResponseText).max(5, 'No máximo 5 respostas por pergunta.').default([]),
    referenceResponses: z.array(aiResponseText).max(5, 'No máximo 5 respostas por pergunta.').default([]),
    modelName: z.string().trim().max(200).optional().default(''),
    modelVersion: z.string().trim().max(200).optional().default(''),
    secondOpinion: z.boolean().default(false),
    materialAuthorized: z.literal(true, {
      errorMap: () => ({ message: 'Confirme que o material foi obtido com autorização ou é de teste.' }),
    }),
  })
  .superRefine((data, ctx) => {
    const paired = data.mode === 'paired';
    if (paired && data.referencePrompt.length < 10) {
      ctx.addIssue({ code: 'custom', path: ['referencePrompt'], message: 'Informe a pergunta de referência (mínimo 10 caracteres).' });
    }
    if (data.source !== 'manual') return;
    if (!data.targetResponses.some((r) => r.trim().length >= 5)) {
      ctx.addIssue({ code: 'custom', path: ['targetResponses'], message: 'Cole ao menos uma resposta (mínimo 5 caracteres).' });
    }
    if (paired && !data.referenceResponses.some((r) => r.trim().length >= 5)) {
      ctx.addIssue({ code: 'custom', path: ['referenceResponses'], message: 'Cole ao menos uma resposta à pergunta de referência.' });
    }
  });

export type CreateAiEvaluationInput = z.infer<typeof createAiEvaluationSchema>;

// ─── Pagination ──────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

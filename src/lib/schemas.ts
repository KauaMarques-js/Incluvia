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

export const createAiEvaluationSchema = z.object({
  scenarioId: z.string().min(1, 'Selecione um cenário.'),
  modelName: z.string().max(200).optional().default(''),
  modelVersion: z.string().max(200).optional().default(''),
  prompt: z
    .string()
    .min(10, 'Informe o prompt usado na IA (mínimo 10 caracteres).')
    .max(8000, 'Prompt deve ter no máximo 8000 caracteres.'),
  responseText: z
    .string()
    .min(5, 'Cole a resposta da IA (mínimo 5 caracteres).')
    .max(20000, 'Resposta deve ter no máximo 20000 caracteres.'),
  materialAuthorized: z.literal(true, {
    errorMap: () => ({
      message: 'Confirme que o material foi obtido com autorização ou é de teste.',
    }),
  }),
});

export type CreateAiEvaluationInput = z.infer<typeof createAiEvaluationSchema>;

// ─── Pagination ──────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

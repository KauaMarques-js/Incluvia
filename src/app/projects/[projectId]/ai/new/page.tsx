'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError, errorMessage, type CreateAiEvaluationInput } from '@/lib/api-client';
import { useResource } from '@/lib/use-resource';
import type { AiEvaluationDetail, AiScenario } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { Field, firstErrors } from '@/components/Field';
import { ErrorState, LoadingState } from '@/components/States';

const DEFAULT_SCENARIO = 'hiring-cerebral-palsy';
const MAX_RESPONSES = 5;

type Source = CreateAiEvaluationInput['source'];
type Mode = CreateAiEvaluationInput['mode'];

interface FormState {
  scenarioId: string;
  mode: Mode;
  prompt: string;
  referencePrompt: string;
  source: Source;
  repetitions: number;
  targetResponses: string[];
  referenceResponses: string[];
  modelName: string;
  modelVersion: string;
  secondOpinion: boolean;
  authorized: boolean;
}

function stateForScenario(scenario: AiScenario, current?: FormState): FormState {
  return {
    scenarioId: scenario.id,
    mode: scenario.referencePrompt !== null ? 'paired' : 'single',
    prompt: scenario.prompt,
    referencePrompt: scenario.referencePrompt ?? '',
    source: current?.source === 'simulator' && !scenario.simulator ? 'manual' : (current?.source ?? 'manual'),
    repetitions: current?.repetitions ?? 3,
    targetResponses: [''],
    referenceResponses: [''],
    modelName: current?.modelName ?? '',
    modelVersion: current?.modelVersion ?? '',
    secondOpinion: current?.secondOpinion ?? false,
    authorized: false,
  };
}

/** Repetir: mesmas perguntas e método, respostas novas (outra versão do modelo, outra data). */
function stateFromPrevious(previous: AiEvaluationDetail): FormState {
  const reps = previous.responses.filter((r) => r.variant === 'target').length || 3;
  return {
    scenarioId: previous.scenarioId,
    mode: previous.mode,
    prompt: previous.prompt,
    referencePrompt: previous.referencePrompt ?? '',
    source: previous.source,
    repetitions: Math.min(reps, MAX_RESPONSES),
    targetResponses: [''],
    referenceResponses: [''],
    modelName: previous.source === 'manual' ? (previous.modelName ?? '') : '',
    modelVersion: '',
    secondOpinion: previous.judgeStatus !== null,
    authorized: false,
  };
}

function ResponseList({
  id,
  label,
  values,
  error,
  onChange,
}: {
  id: string;
  label: string;
  values: string[];
  error?: string;
  onChange: (values: string[]) => void;
}) {
  const update = (index: number, value: string) => onChange(values.map((v, i) => (i === index ? value : v)));
  return (
    <fieldset className="response-list">
      <legend className="form-label">{label}</legend>
      {values.map((value, index) => (
        <div key={index} className="form-group">
          <div className="response-head">
            <label htmlFor={`${id}-${index}`} className="small">
              Resposta {index + 1}
            </label>
            {values.length > 1 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(values.filter((_, i) => i !== index))}>
                Remover<span className="sr-only"> resposta {index + 1}</span>
              </button>
            )}
          </div>
          <textarea
            id={`${id}-${index}`}
            className="form-textarea"
            rows={4}
            value={value}
            aria-invalid={error && index === 0 ? true : undefined}
            aria-describedby={error && index === 0 ? `${id}-error` : undefined}
            onChange={(e) => update(index, e.target.value)}
          />
        </div>
      ))}
      {error && (
        <p className="form-error" id={`${id}-error`}>
          {error}
        </p>
      )}
      {values.length < MAX_RESPONSES && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([...values, ''])}>
          Adicionar repetição
        </button>
      )}
    </fieldset>
  );
}

function NewAiEvaluationForm() {
  const { projectId } = useParams<{ projectId: string }>();
  const fromId = useSearchParams().get('from');
  const router = useRouter();

  const { data: project } = useResource(() => api.getProject(projectId), [projectId]);
  const catalog = useResource(() => api.getAiCatalog(), []);
  const previous = useResource(
    () => (fromId ? api.getAiEvaluation(fromId) : Promise.resolve({ data: null })),
    [fromId]
  );

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Preenche o formulário uma vez: a partir da avaliação anterior ou do cenário padrão.
  useEffect(() => {
    if (form || !catalog.data || previous.loading) return;
    if (previous.data) {
      setForm(stateFromPrevious(previous.data));
      return;
    }
    const initial = catalog.data.scenarios.find((s) => s.id === DEFAULT_SCENARIO) ?? catalog.data.scenarios[0];
    if (initial) setForm(stateForScenario(initial));
  }, [form, catalog.data, previous.loading, previous.data]);

  if (catalog.error) return <ErrorState error={catalog.error} resource="Biblioteca de cenários" />;
  if (!form || !catalog.data) return <LoadingState label="Carregando cenários…" />;

  const { scenarios, claude } = catalog.data;
  const scenario = scenarios.find((s) => s.id === form.scenarioId) ?? scenarios[0];
  const paired = form.mode === 'paired';
  const generated = form.source !== 'manual';
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm({ ...form, [key]: value });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const errors: Record<string, string> = {};
    if (form.prompt.trim().length < 10) errors.prompt = 'Informe a pergunta (mínimo 10 caracteres).';
    if (paired && form.referencePrompt.trim().length < 10) errors.referencePrompt = 'Informe a pergunta de referência.';
    if (!generated && !form.targetResponses.some((r) => r.trim().length >= 5)) errors.targetResponses = 'Cole ao menos uma resposta.';
    if (!generated && paired && !form.referenceResponses.some((r) => r.trim().length >= 5)) {
      errors.referenceResponses = 'Cole ao menos uma resposta à pergunta de referência.';
    }
    if (!form.authorized) errors.materialAuthorized = 'Confirme esta declaração para continuar.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Corrija os campos destacados.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await api.createAiEvaluation(projectId, {
        scenarioId: form.scenarioId,
        mode: form.mode,
        prompt: form.prompt,
        referencePrompt: paired ? form.referencePrompt : undefined,
        source: form.source,
        repetitions: form.repetitions,
        targetResponses: generated ? [] : form.targetResponses,
        referenceResponses: generated || !paired ? [] : form.referenceResponses,
        modelName: form.modelName.trim() || undefined,
        modelVersion: form.modelVersion.trim() || undefined,
        secondOpinion: form.secondOpinion,
        materialAuthorized: true,
      });
      router.push(`/ai-evaluations/${res.data.id}`);
    } catch (err) {
      setError(errorMessage(err, 'Falha ao executar a avaliação.'));
      if (err instanceof ApiError) setFieldErrors(firstErrors(err.fields));
      setSaving(false);
    }
  }

  const sources: { value: Source; label: string; hint: string; disabled: boolean }[] = [
    {
      value: 'manual',
      label: 'Colar respostas',
      hint: 'De qualquer sistema: chatbot da empresa, assistente interno, ChatGPT, Gemini.',
      disabled: false,
    },
    {
      value: 'claude',
      label: `Gerar com o Claude (${claude.model})`,
      hint: claude.available
        ? 'As perguntas são enviadas à API da Anthropic, uma vez por repetição.'
        : 'Indisponível: configure ANTHROPIC_API_KEY no servidor.',
      disabled: !claude.available,
    },
    {
      value: 'simulator',
      label: 'Simulador de demonstração',
      hint: scenario.simulator
        ? 'Respostas pré-escritas para apresentar o fluxo. Não são geradas por IA.'
        : 'Sem respostas de demonstração para este cenário.',
      disabled: !scenario.simulator,
    },
  ];

  const modes = [
    {
      value: 'paired' as const,
      label: 'Comparação pareada (recomendado)',
      hint:
        scenario.referencePrompt === null
          ? 'Este cenário não tem pergunta de referência.'
          : 'Duas perguntas que diferem só na menção à deficiência. Diferenças nas respostas são o indício mais forte de viés.',
      disabled: scenario.referencePrompt === null,
    },
    { value: 'single' as const, label: 'Pergunta única', hint: 'Aplica só a rubrica de linguagem a uma pergunta.', disabled: false },
  ];

  return (
    <div className="narrow wide-form">
      <PageHeader
        title={previous.data ? 'Repetir avaliação de IA' : 'Nova avaliação de IA'}
        breadcrumbs={[
          { label: 'Projetos', href: '/projects' },
          { label: project?.name ?? 'Projeto', href: `/projects/${projectId}` },
          { label: previous.data ? 'Repetir avaliação' : 'Nova avaliação de IA' },
        ]}
        description={
          previous.data
            ? 'Mesmas perguntas e método da avaliação anterior. Use para testar uma nova versão do modelo e acompanhar a evolução.'
            : 'Faça a mesma pergunta com e sem a menção à deficiência e compare as respostas. A rubrica roda no servidor da Incluvia.'
        }
      />

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <section className="form-step" aria-labelledby="step-scenario">
          <h2 id="step-scenario">1. Cenário</h2>
          <Field id="scenario" label="Cenário de teste" required>
            {(props) => (
              <select
                {...props}
                className="form-select"
                value={form.scenarioId}
                onChange={(e) => setForm(stateForScenario(scenarios.find((s) => s.id === e.target.value)!, form))}
              >
                {scenarios.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <dl className="scenario-summary">
            <div>
              <dt>Hipótese</dt>
              <dd>{scenario.hypothesis}</dd>
            </div>
            <div>
              <dt>Contexto</dt>
              <dd>
                {scenario.context}
                {scenario.disabilities.length > 0 && ` · ${scenario.disabilities.join(', ')}`}
                {scenario.intersectional && ` · ${scenario.intersectional}`}
              </dd>
            </div>
            <div>
              <dt>Validação</dt>
              <dd>
                {scenario.validation === 'validated'
                  ? 'Validado com consultores PCD'
                  : 'Proposto pela equipe; validação com consultores PCD pendente'}
                {' · '}
                <Link href="/ai-library">Ver biblioteca</Link>
              </dd>
            </div>
          </dl>
        </section>

        <section className="form-step" aria-labelledby="step-prompts">
          <h2 id="step-prompts">2. Perguntas</h2>
          <fieldset className="form-group radio-group">
            <legend className="form-label">Método</legend>
            <div>
              {modes.map((option) => (
                <label key={option.value} className="radio-option">
                  <input
                    type="radio"
                    name="mode"
                    value={option.value}
                    checked={form.mode === option.value}
                    disabled={option.disabled}
                    onChange={() => set('mode', option.value)}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <span className="radio-hint">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field
            id="prompt"
            label={paired ? 'Pergunta com a característica avaliada' : 'Pergunta enviada à IA'}
            required
            error={fieldErrors.prompt}
          >
            {(props) => (
              <textarea {...props} className="form-textarea" rows={3} value={form.prompt} onChange={(e) => set('prompt', e.target.value)} />
            )}
          </Field>
          {paired && (
            <Field
              id="referencePrompt"
              label="Pergunta de referência"
              required
              hint="Igual à anterior, sem a menção à deficiência. Mude só isso."
              error={fieldErrors.referencePrompt}
            >
              {(props) => (
                <textarea
                  {...props}
                  className="form-textarea"
                  rows={3}
                  value={form.referencePrompt}
                  onChange={(e) => set('referencePrompt', e.target.value)}
                />
              )}
            </Field>
          )}
        </section>

        <section className="form-step" aria-labelledby="step-responses">
          <h2 id="step-responses">3. Respostas</h2>
          <fieldset className="form-group radio-group">
            <legend className="form-label">Origem das respostas</legend>
            <div>
              {sources.map((option) => (
                <label key={option.value} className="radio-option">
                  <input
                    type="radio"
                    name="source"
                    value={option.value}
                    checked={form.source === option.value}
                    disabled={option.disabled}
                    onChange={() => set('source', option.value)}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <span className="radio-hint">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {generated ? (
            <Field
              id="repetitions"
              label="Repetições por pergunta"
              required
              hint="Respostas de IA variam. Com mais repetições, a frequência dos achados fica mais confiável."
            >
              {(props) => (
                <select
                  {...props}
                  className="form-select narrow-input"
                  value={form.repetitions}
                  onChange={(e) => set('repetitions', Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          ) : (
            <>
              <p className="form-hint">
                Faça cada pergunta várias vezes ao sistema avaliado, de preferência em conversas novas, e cole cada resposta.
              </p>
              <div className={paired ? 'pair-grid' : undefined}>
                <ResponseList
                  id="target"
                  label={paired ? 'Respostas à pergunta com a característica' : 'Respostas'}
                  values={form.targetResponses}
                  error={fieldErrors.targetResponses}
                  onChange={(values) => set('targetResponses', values)}
                />
                {paired && (
                  <ResponseList
                    id="reference"
                    label="Respostas à pergunta de referência"
                    values={form.referenceResponses}
                    error={fieldErrors.referenceResponses}
                    onChange={(values) => set('referenceResponses', values)}
                  />
                )}
              </div>
              <div className="form-row">
                <Field id="modelName" label="Sistema avaliado" hint="Ex.: chatbot de atendimento.">
                  {(props) => (
                    <input {...props} className="form-input" maxLength={200} value={form.modelName} onChange={(e) => set('modelName', e.target.value)} />
                  )}
                </Field>
                <Field id="modelVersion" label="Versão ou data" hint="Ex.: 2026-10 ou v1.2.">
                  {(props) => (
                    <input
                      {...props}
                      className="form-input"
                      maxLength={200}
                      value={form.modelVersion}
                      onChange={(e) => set('modelVersion', e.target.value)}
                    />
                  )}
                </Field>
              </div>
            </>
          )}

          <label className="form-check">
            <input
              type="checkbox"
              checked={form.secondOpinion}
              disabled={!claude.available}
              onChange={(e) => set('secondOpinion', e.target.checked)}
            />
            <span>
              <strong>Pedir segunda opinião ao Claude</strong>
              <br />
              {claude.available
                ? 'Uma IA lê as respostas com as mesmas categorias da rubrica. Os achados aparecem separados e também passam por revisão.'
                : 'Indisponível: configure ANTHROPIC_API_KEY no servidor.'}
            </span>
          </label>
        </section>

        <section className="form-step" aria-labelledby="step-confirm">
          <h2 id="step-confirm">4. Confirmação</h2>
          <div className="form-group">
            <label className="form-check">
              <input
                type="checkbox"
                checked={form.authorized}
                aria-invalid={fieldErrors.materialAuthorized ? true : undefined}
                aria-describedby={fieldErrors.materialAuthorized ? 'material-error' : undefined}
                onChange={(e) => set('authorized', e.target.checked)}
              />
              <span>
                <strong>
                  {generated
                    ? 'As perguntas não contêm dados pessoais (obrigatório).'
                    : 'O material foi obtido com autorização ou é um teste controlado (obrigatório).'}
                </strong>
                <br />
                Não incluí dados de saúde, diagnóstico ou informações que identifiquem pessoas.
              </span>
            </label>
            {fieldErrors.materialAuthorized && (
              <p className="form-error" id="material-error">
                {fieldErrors.materialAuthorized}
              </p>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (generated ? 'Gerando respostas e aplicando a rubrica…' : 'Aplicando a rubrica…') : 'Executar avaliação'}
            </button>
            <Link href={`/projects/${projectId}`} className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
          {saving && form.source === 'claude' && (
            <p className="form-hint" role="status">
              Gerar respostas com a API pode levar até um minuto.
            </p>
          )}
        </section>
      </form>
    </div>
  );
}

export default function NewAiEvaluationPage() {
  return (
    <Suspense fallback={<LoadingState label="Carregando…" />}>
      <NewAiEvaluationForm />
    </Suspense>
  );
}

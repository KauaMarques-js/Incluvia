'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError, errorMessage } from '@/lib/api-client';
import { useResource } from '@/lib/use-resource';
import { PageHeader } from '@/components/PageHeader';
import { Field, firstErrors } from '@/components/Field';

const DEFAULT_SCENARIO = 'generative-stereotype';

export default function NewAiEvaluationPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project } = useResource(() => api.getProject(projectId), [projectId]);
  const { data: scenarios, error: scenariosError } = useResource(() => api.getAiScenarios(), []);

  const [scenarioId, setScenarioId] = useState(DEFAULT_SCENARIO);
  const [modelName, setModelName] = useState('');
  const [modelVersion, setModelVersion] = useState('');
  const [prompt, setPrompt] = useState('');
  const [responseText, setResponseText] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selected = scenarios?.find((item) => item.id === scenarioId);

  // Ao carregar os cenários, sugere o prompt do cenário padrão.
  useEffect(() => {
    const initial = scenarios?.find((item) => item.id === DEFAULT_SCENARIO) ?? scenarios?.[0];
    if (initial) {
      setScenarioId(initial.id);
      setPrompt(initial.suggestedPrompt);
    }
  }, [scenarios]);

  function handleScenarioChange(id: string) {
    setScenarioId(id);
    const next = scenarios?.find((item) => item.id === id);
    if (next) setPrompt(next.suggestedPrompt);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const localErrors: Record<string, string> = {};
    if (prompt.trim().length < 10) localErrors.prompt = 'Informe o prompt usado (mínimo 10 caracteres).';
    if (responseText.trim().length < 5) localErrors.responseText = 'Cole a resposta da IA (mínimo 5 caracteres).';
    if (!authorized) localErrors.materialAuthorized = 'Confirme a origem do material para continuar.';
    setFieldErrors(localErrors);
    if (Object.keys(localErrors).length > 0) {
      setError('Corrija os campos destacados.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await api.createAiEvaluation(projectId, {
        scenarioId,
        modelName: modelName.trim() || undefined,
        modelVersion: modelVersion.trim() || undefined,
        prompt,
        responseText,
        materialAuthorized: true,
      });
      router.push(`/ai-evaluations/${res.data.id}`);
    } catch (err) {
      setError(errorMessage(err, 'Falha ao avaliar a resposta.'));
      if (err instanceof ApiError) setFieldErrors(firstErrors(err.fields));
      setSaving(false);
    }
  }

  return (
    <div className="narrow">
      <PageHeader
        title="Avaliar resposta de IA"
        breadcrumbs={[
          { label: 'Projetos', href: '/projects' },
          { label: project?.name ?? 'Projeto', href: `/projects/${projectId}` },
          { label: 'Nova avaliação de IA' },
        ]}
        description="Cole o prompt e a resposta de um sistema de IA. A rubrica roda localmente — o texto não é enviado a nenhum provedor."
      />

      <div className="alert alert-warning">
        <p>
          <strong>Isto não é prova de discriminação.</strong> A rubrica aponta indícios (paternalismo, presunção de
          incapacidade, tragédia, segregação, omissão). A conclusão é sempre da revisão humana.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {(error || scenariosError) && (
          <div className="alert alert-error" role="alert">
            {error ?? scenariosError?.message}
          </div>
        )}

        <Field
          id="scenario"
          label="Cenário de teste"
          required
          hint={selected ? `Hipótese: ${selected.hypothesis}` : undefined}
          error={fieldErrors.scenarioId}
        >
          {(props) => (
            <select {...props} className="form-select" value={scenarioId} onChange={(e) => handleScenarioChange(e.target.value)}>
              {(scenarios ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          )}
        </Field>

        <div className="form-row">
          <Field id="modelName" label="Modelo" hint="Ex.: assistente interno." error={fieldErrors.modelName}>
            {(props) => (
              <input {...props} className="form-input" maxLength={200} value={modelName} onChange={(e) => setModelName(e.target.value)} />
            )}
          </Field>
          <Field id="modelVersion" label="Versão ou data" hint="Ex.: 2026-10 ou v1.2." error={fieldErrors.modelVersion}>
            {(props) => (
              <input
                {...props}
                className="form-input"
                maxLength={200}
                value={modelVersion}
                onChange={(e) => setModelVersion(e.target.value)}
              />
            )}
          </Field>
        </div>

        <Field id="prompt" label="Prompt enviado à IA" required hint="Preenchido com a sugestão do cenário; ajuste se necessário." error={fieldErrors.prompt}>
          {(props) => (
            <textarea {...props} className="form-textarea" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          )}
        </Field>

        <Field id="responseText" label="Resposta da IA" required hint="Cole a resposta exatamente como foi gerada." error={fieldErrors.responseText}>
          {(props) => (
            <textarea {...props} className="form-textarea" rows={8} value={responseText} onChange={(e) => setResponseText(e.target.value)} />
          )}
        </Field>

        <div className="form-group">
          <label className="form-check">
            <input
              type="checkbox"
              checked={authorized}
              aria-invalid={fieldErrors.materialAuthorized ? true : undefined}
              aria-describedby={fieldErrors.materialAuthorized ? 'material-error' : undefined}
              onChange={(e) => setAuthorized(e.target.checked)}
            />
            <span>
              <strong>O material foi obtido com autorização ou é um teste controlado (obrigatório).</strong>
              <br />
              Não colei dados pessoais de saúde ou diagnóstico.
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
            {saving ? 'Aplicando rubrica…' : 'Aplicar rubrica'}
          </button>
          <Link href={`/projects/${projectId}`} className="btn btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

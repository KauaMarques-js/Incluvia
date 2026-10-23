'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function NewAiEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [scenarios, setScenarios] = useState<any[]>([]);
  const [scenarioId, setScenarioId] = useState('generative-stereotype');
  const [modelName, setModelName] = useState('');
  const [modelVersion, setModelVersion] = useState('');
  const [prompt, setPrompt] = useState('');
  const [responseText, setResponseText] = useState('');
  const [materialAuthorized, setMaterialAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAiScenarios()
      .then((res) => {
        const list = res.data || [];
        setScenarios(list);
        const selected = list.find((item: any) => item.id === 'generative-stereotype') || list[0];
        if (selected) {
          setScenarioId(selected.id);
          if (selected.suggestedPrompt) setPrompt(selected.suggestedPrompt);
        }
      })
      .catch((err) => setError(err.message || 'Falha ao carregar cenários.'));
  }, []);

  const selected = scenarios.find((item) => item.id === scenarioId);

  function handleScenarioChange(id: string) {
    setScenarioId(id);
    const next = scenarios.find((item) => item.id === id);
    if (next?.suggestedPrompt) setPrompt(next.suggestedPrompt);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!materialAuthorized) {
      setError('Confirme que o prompt e a resposta foram obtidos com autorização ou são material de teste.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.createAiEvaluation(projectId, {
        scenarioId,
        modelName: modelName.trim() || undefined,
        modelVersion: modelVersion.trim() || undefined,
        prompt,
        responseText,
        materialAuthorized: true,
      });
      if (res.data?.id) {
        router.push(`/ai-evaluations/${res.data.id}`);
      } else {
        router.push(`/projects/${projectId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao avaliar a resposta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '2rem auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href={`/projects/${projectId}`} style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none' }}>
          ← Voltar para o projeto
        </Link>
      </div>

      <div className="card">
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Avaliar resposta de IA</h1>
        <p className="lead-text">
          Cole um prompt e a resposta de um sistema. A Incluvia aplica uma rubrica local de capacitismo algorítmico — sem enviar o texto a nenhum provedor.
        </p>

        <div className="alert alert-warning" role="region" aria-label="Limite da rubrica">
          <strong>Isto não é prova de discriminação.</strong>
          <p style={{ marginTop: '0.25rem', fontSize: '0.8125rem' }}>
            Os achados são indícios (linguagem paternalista, presunção de incapacidade, tragédia, segregação, omissão). A revisão humana decide o que vale.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="scenario" className="form-label">Cenário de teste</label>
            <select
              id="scenario"
              className="form-select"
              value={scenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              required
            >
              {scenarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            {selected && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Hipótese: {selected.hypothesis}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="modelName" className="form-label">Nome do modelo (opcional)</label>
            <input
              id="modelName"
              className="form-input"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="ex.: assistente interno, GPT, Gemini"
            />
          </div>

          <div className="form-group">
            <label htmlFor="modelVersion" className="form-label">Versão ou data (opcional)</label>
            <input
              id="modelVersion"
              className="form-input"
              value={modelVersion}
              onChange={(e) => setModelVersion(e.target.value)}
              placeholder="ex.: 2026-10 ou v1.2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="prompt" className="form-label">Prompt enviado à IA</label>
            <textarea
              id="prompt"
              className="form-input"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="responseText" className="form-label">Resposta da IA</label>
            <textarea
              id="responseText"
              className="form-input"
              rows={8}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={materialAuthorized}
                onChange={(e) => setMaterialAuthorized(e.target.checked)}
              />
              <span>
                Confirmo que este material foi obtido com autorização ou é um teste controlado. Não colei dados pessoais de saúde ou diagnóstico.
              </span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Avaliando...' : 'Aplicar rubrica'}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

const IMPACT_LABEL: Record<string, string> = {
  critical: 'Crítico',
  serious: 'Grave',
  moderate: 'Moderado',
  minor: 'Leve',
  unknown: 'Desconhecido',
};

const REVIEW_LABEL: Record<string, string> = {
  unreviewed: 'Não revisado',
  confirmed: 'Confirmado',
  false_positive: 'Falso positivo',
  needs_context: 'Requer contexto',
  fixed: 'Corrigido',
};

export default function AiEvaluationDetailPage() {
  const params = useParams();
  const evaluationId = params.evaluationId as string;

  const [evaluation, setEvaluation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [reviewStatus, setReviewStatus] = useState('confirmed');
  const [reviewNote, setReviewNote] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    api.getAiEvaluation(evaluationId)
      .then((res) => setEvaluation(res.data))
      .catch((err) => setError(err.message || 'Falha ao carregar avaliação.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!evaluationId) return;
    load();
  }, [evaluationId]);

  async function handleSaveReview(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await api.reviewAiFinding(selected.id, { reviewStatus, reviewNote });
      setSelected(null);
      load();
    } catch (err: any) {
      alert(err.message || 'Falha ao salvar revisão.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>Carregando avaliação...</div>;
  }

  if (error || !evaluation) {
    return (
      <div>
        <div className="alert alert-error" role="alert">{error || 'Avaliação não encontrada.'}</div>
        <Link href="/" className="btn btn-secondary">Voltar</Link>
      </div>
    );
  }

  const findings = evaluation.findings || [];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href={`/projects/${evaluation.project?.id}`} style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none' }}>
          ← Voltar para {evaluation.project?.name || 'o projeto'}
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1>Avaliação de capacitismo em IA</h1>
            <p className="lead-text">{evaluation.scenarioTitle}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Modelo: {evaluation.modelName || 'não informado'}
              {evaluation.modelVersion ? ` · ${evaluation.modelVersion}` : ''}
              {' · '}
              {new Date(evaluation.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
          <a
            href={`/api/v1/ai-evaluations/${evaluation.id}/report?download=true`}
            className="btn btn-primary btn-sm"
            download
          >
            Baixar relatório
          </a>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem' }}>Prompt</h2>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{evaluation.prompt}</pre>
        <h2 style={{ fontSize: '1.125rem', marginTop: '1rem' }}>Resposta</h2>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{evaluation.responseText}</pre>
      </div>

      <h2>Achados da rubrica ({findings.length})</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
        Cada item precisa de revisão humana. A rubrica só aponta padrões; não certifica o modelo.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {findings.map((finding: any) => (
          <div key={finding.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div>
                <span className={`badge badge-${finding.impact}`}>{IMPACT_LABEL[finding.impact] || finding.impact}</span>
                {' '}
                <span className={`badge badge-${finding.reviewStatus}`}>{REVIEW_LABEL[finding.reviewStatus] || finding.reviewStatus}</span>
                <h3 style={{ marginTop: '0.5rem' }}>{finding.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{finding.description}</p>
                {finding.evidence && (
                  <p style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                    Trecho: <code>{finding.evidence}</code>
                  </p>
                )}
                {finding.helpText && (
                  <p style={{ fontSize: '0.8125rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>{finding.helpText}</p>
                )}
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSelected(finding);
                  setReviewStatus(finding.reviewStatus === 'unreviewed' ? 'confirmed' : finding.reviewStatus);
                  setReviewNote(finding.reviewNote || '');
                }}
              >
                Revisar
              </button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem' }}>Revisão humana: {selected.title}</h2>
          <form onSubmit={handleSaveReview}>
            <div className="form-group">
              <label htmlFor="reviewStatus" className="form-label">Estado</label>
              <select
                id="reviewStatus"
                className="form-select"
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
              >
                <option value="confirmed">Confirmado</option>
                <option value="false_positive">Falso positivo</option>
                <option value="needs_context">Requer contexto</option>
                <option value="fixed">Corrigido</option>
                <option value="unreviewed">Não revisado</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="reviewNote" className="form-label">Nota</label>
              <textarea
                id="reviewNote"
                className="form-input"
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar revisão'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

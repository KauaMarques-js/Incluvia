'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function TargetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const targetId = params.targetId as string;

  const [target, setTarget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Start Audit Modal state
  const [showModal, setShowModal] = useState(false);
  const [maxPages, setMaxPages] = useState(20);
  const [maxDepth, setMaxDepth] = useState(3);
  const [startingAudit, setStartingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetId) return;
    loadTarget();
  }, [targetId]);

  function loadTarget() {
    setLoading(true);
    api.getTarget(targetId)
      .then((res) => setTarget(res.data))
      .catch((err) => setError(err.message || 'Falha ao carregar detalhes do alvo.'))
      .finally(() => setLoading(false));
  }

  async function handleStartAudit(e: React.FormEvent) {
    e.preventDefault();
    setStartingAudit(true);
    setAuditError(null);

    try {
      const res = await api.startAudit(targetId, {
        maxPages: Number(maxPages),
        maxDepth: Number(maxDepth),
      });

      if (res.data?.id) {
        router.push(`/audits/${res.data.id}`);
      } else {
        setShowModal(false);
        loadTarget();
      }
    } catch (err: any) {
      setAuditError(err.message || 'Falha ao iniciar auditoria.');
    } finally {
      setStartingAudit(false);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        Carregando detalhes do alvo...
      </div>
    );
  }

  if (error || !target) {
    return (
      <div>
        <div className="alert alert-error" role="alert">
          {error || 'Alvo não encontrado.'}
        </div>
        <Link href="/projects" className="btn btn-secondary">
          ← Voltar para Projetos
        </Link>
      </div>
    );
  }

  const project = target.project;
  const auditRuns = target.auditRuns || [];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href={`/projects/${project.id}`} style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none' }}>
          ← Voltar para Projeto: {project.name}
        </Link>
      </div>

      {/* Target Info Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1>{target.name}</h1>
              <span className="badge badge-completed">Autorizado</span>
            </div>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>URL Inicial:</strong>{' '}
              <a href={target.startUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                {target.startUrl} ↗
              </a>
            </p>
            {target.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                {target.description}
              </p>
            )}
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Autorização confirmada formalmente em {new Date(target.authorizationConfirmedAt).toLocaleString('pt-BR')}
            </p>
          </div>

          <div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              ▶ Iniciar Nova Auditoria
            </button>
          </div>
        </div>
      </div>

      {/* Audit History Section */}
      <div>
        <h2 style={{ marginBottom: '1rem' }}>Histórico de Execuções ({auditRuns.length})</h2>

        {auditRuns.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">Nenhuma auditoria executada para este alvo</h3>
            <p className="empty-state-desc">
              Inicie uma auditoria automatizada para identificar violações WCAG 2.2 e riscos de barreiras digitais.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              Iniciar Primeira Auditoria
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table" aria-label="Histórico de execuções de auditoria">
              <thead>
                <tr>
                  <th scope="col">Status</th>
                  <th scope="col">Data de Criação</th>
                  <th scope="col">Início / Término</th>
                  <th scope="col">Achados</th>
                  <th scope="col"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {auditRuns.map((run: any) => (
                  <tr key={run.id}>
                    <td>
                      <span className={`badge badge-${run.status}`}>
                        {run.status === 'completed' && 'Concluída'}
                        {run.status === 'running' && 'Em execução'}
                        {run.status === 'queued' && 'Na fila'}
                        {run.status === 'failed' && 'Falhou'}
                        {run.status === 'cancelled' && 'Cancelada'}
                      </span>
                    </td>
                    <td>{new Date(run.createdAt).toLocaleString('pt-BR')}</td>
                    <td>
                      {run.startedAt ? new Date(run.startedAt).toLocaleTimeString('pt-BR') : '—'}
                      {' / '}
                      {run.finishedAt ? new Date(run.finishedAt).toLocaleTimeString('pt-BR') : '—'}
                    </td>
                    <td>
                      <strong>{run._count?.findings ?? run.findings?.length ?? 0}</strong> achado(s)
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/audits/${run.id}`} className="btn btn-secondary btn-sm">
                        Ver Resultados →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Start Audit Modal */}
      {showModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-content">
            <h2 id="modal-title" style={{ marginBottom: '0.75rem' }}>Configurar Nova Execução</h2>
            <p className="lead-text" style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Defina os parâmetros de varredura controlada para o alvo <strong>{target.name}</strong> ({target.startUrl}).
            </p>

            {auditError && (
              <div className="alert alert-error" role="alert">
                {auditError}
              </div>
            )}

            <form onSubmit={handleStartAudit}>
              <div className="form-group">
                <label htmlFor="maxPages" className="form-label">
                  Limite de Páginas a Auditar
                </label>
                <p className="form-hint" id="maxPages-hint">
                  Quantidade máxima de páginas internas navegadas no mesmo host (1 a 100). Padrão conservador: 20.
                </p>
                <input
                  id="maxPages"
                  type="number"
                  min={1}
                  max={100}
                  className="form-input"
                  aria-describedby="maxPages-hint"
                  value={maxPages}
                  onChange={(e) => setMaxPages(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxDepth" className="form-label">
                  Profundidade de Navegação
                </label>
                <p className="form-hint" id="maxDepth-hint">
                  Nível de profundidade a partir da página inicial (1 a 10). Padrão: 3 cliques.
                </p>
                <input
                  id="maxDepth"
                  type="number"
                  min={1}
                  max={10}
                  className="form-input"
                  aria-describedby="maxDepth-hint"
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(Number(e.target.value))}
                />
              </div>

              <div className="alert alert-info" style={{ fontSize: '0.8125rem' }}>
                O motor Playwright + axe-core executará a varredura em segundo plano. Ao confirmar, o processamento será iniciado na fila.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={startingAudit}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={startingAudit}
                >
                  {startingAudit ? 'Enfileirando...' : 'Iniciar Auditoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

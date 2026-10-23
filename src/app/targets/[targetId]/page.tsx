'use client';

import { useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError, errorMessage } from '@/lib/api-client';
import { useResource } from '@/lib/use-resource';
import { formatDateTime, formatDuration, isAuditInProgress, plural } from '@/lib/labels';
import { PageHeader } from '@/components/PageHeader';
import { AuditStatusBadge } from '@/components/Badges';
import { Modal } from '@/components/Modal';
import { Field, firstErrors } from '@/components/Field';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';

const DEFAULT_LIMITS = { maxPages: 20, maxDepth: 3 };

export default function TargetDetailPage() {
  const { targetId } = useParams<{ targetId: string }>();
  const router = useRouter();
  const { data: target, error, loading } = useResource(() => api.getTarget(targetId), [targetId]);

  const [showPrepare, setShowPrepare] = useState(false);
  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleStartAudit(e: FormEvent) {
    e.preventDefault();
    setStarting(true);
    setStartError(null);
    setFieldErrors({});
    try {
      const res = await api.startAudit(targetId, limits);
      router.push(`/audits/${res.data.id}`);
    } catch (err) {
      setStartError(errorMessage(err, 'Falha ao iniciar auditoria.'));
      if (err instanceof ApiError) setFieldErrors(firstErrors(err.fields));
      setStarting(false);
    }
  }

  if (loading) return <LoadingState label="Carregando alvo…" />;
  if (error || !target) return <ErrorState error={error} resource="Alvo" />;

  const { project } = target;
  const auditRuns = target.auditRuns ?? [];
  const activeRun = auditRuns.find((run) => isAuditInProgress(run.status));
  const canStart = project.status !== 'archived' && !activeRun;

  const startButton = (label: string) =>
    canStart && (
      <button type="button" className="btn btn-primary" onClick={() => setShowPrepare(true)}>
        {label}
      </button>
    );

  return (
    <>
      <PageHeader
        title={target.name}
        breadcrumbs={[
          { label: 'Projetos', href: '/projects' },
          { label: project.name, href: `/projects/${project.id}` },
          { label: target.name },
        ]}
        badge={<span className="badge badge-completed">Autorização confirmada</span>}
        description={target.description}
        meta={
          <>
            <span>
              URL inicial:{' '}
              <a href={target.startUrl} target="_blank" rel="noopener noreferrer">
                {target.startUrl}
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </span>
            <span>Autorização registrada em {formatDateTime(target.authorizationConfirmedAt)}</span>
          </>
        }
        actions={startButton('Nova auditoria')}
      />

      {activeRun && (
        <div className="alert alert-info" role="status">
          Já existe uma auditoria {activeRun.status === 'queued' ? 'na fila' : 'em execução'} para este alvo.{' '}
          <Link href={`/audits/${activeRun.id}`}>Acompanhar execução</Link>
        </div>
      )}

      <section aria-labelledby="history-title">
        <div className="section-header">
          <div>
            <h2 id="history-title">Histórico de execuções ({auditRuns.length})</h2>
            <p>
              Ao comparar execuções, lembre que mudanças no site, na versão do motor ou nos limites podem alterar os
              resultados.
            </p>
          </div>
        </div>

        {auditRuns.length === 0 ? (
          <EmptyState
            title="Nenhuma auditoria executada"
            description="Inicie uma auditoria automatizada para identificar barreiras WCAG 2.2 neste site."
            action={startButton('Preparar primeira auditoria')}
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <caption className="sr-only">Histórico de execuções de auditoria</caption>
              <thead>
                <tr>
                  <th scope="col">Criada em</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Duração</th>
                  <th scope="col">Achados</th>
                  <th scope="col" className="actions">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditRuns.map((run) => (
                  <tr key={run.id}>
                    <td className="nowrap">{formatDateTime(run.createdAt)}</td>
                    <td>
                      <AuditStatusBadge status={run.status} />
                    </td>
                    <td className="nowrap">
                      {run.startedAt && run.finishedAt ? formatDuration(run.startedAt, run.finishedAt) : '—'}
                    </td>
                    <td>{plural(run._count?.findings ?? 0, 'achado', 'achados')}</td>
                    <td className="actions">
                      <Link href={`/audits/${run.id}`} className="btn btn-secondary btn-sm">
                        Ver resultados<span className="sr-only"> da execução de {formatDateTime(run.createdAt)}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={showPrepare} title="Preparar auditoria" onClose={() => setShowPrepare(false)}>
        <form onSubmit={handleStartAudit} noValidate>
          <p className="dialog-context">
            Alvo: <strong>{target.name}</strong> — <code className="inline-code">{target.startUrl}</code>
          </p>

          {startError && (
            <div className="alert alert-error" role="alert">
              {startError}
            </div>
          )}

          <div className="form-row">
            <Field id="maxPages" label="Limite de páginas" required hint="De 1 a 100. Padrão: 20." error={fieldErrors.maxPages}>
              {(props) => (
                <input
                  {...props}
                  type="number"
                  min={1}
                  max={100}
                  className="form-input"
                  value={limits.maxPages}
                  onChange={(e) => setLimits({ ...limits, maxPages: Number(e.target.value) })}
                />
              )}
            </Field>
            <Field id="maxDepth" label="Profundidade de links" required hint="De 1 a 10. Padrão: 3." error={fieldErrors.maxDepth}>
              {(props) => (
                <input
                  {...props}
                  type="number"
                  min={1}
                  max={10}
                  className="form-input"
                  value={limits.maxDepth}
                  onChange={(e) => setLimits({ ...limits, maxDepth: Number(e.target.value) })}
                />
              )}
            </Field>
          </div>

          <div className="alert alert-info">
            <p>
              Escopo: a página inicial e links internos do mesmo host, dentro dos limites acima. A execução roda em segundo
              plano (Playwright + axe-core) e você poderá acompanhá-la na próxima tela.
            </p>
          </div>

          <div className="form-actions form-actions-end">
            <button type="button" className="btn btn-secondary" onClick={() => setShowPrepare(false)} disabled={starting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={starting}>
              {starting ? 'Enfileirando…' : 'Iniciar auditoria'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

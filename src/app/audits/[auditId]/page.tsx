'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, errorMessage } from '@/lib/api-client';
import { useDebouncedValue, useResource } from '@/lib/use-resource';
import {
  IMPACT_LABEL,
  IMPACT_ORDER,
  REVIEW_LABEL,
  formatDateTime,
  formatDuration,
  isAuditInProgress,
  plural,
} from '@/lib/labels';
import type { AuditDetail, Finding, ReviewableFinding } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { AuditStatusBadge } from '@/components/Badges';
import { ConfirmDialog, Modal } from '@/components/Modal';
import { ReviewDialog } from '@/components/ReviewDialog';
import { FindingCard } from '@/components/FindingCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';

const POLL_INTERVAL_MS = 3000;

/** A API ordena severidade alfabeticamente; aqui a ordem é por gravidade. */
function byImpact(a: Finding, b: Finding) {
  const rank = (impact: string) => {
    const index = IMPACT_ORDER.indexOf(impact as (typeof IMPACT_ORDER)[number]);
    return index === -1 ? IMPACT_ORDER.length : index;
  };
  return rank(a.impact) - rank(b.impact);
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}

function RunStatusNotice({ audit }: { audit: AuditDetail }) {
  switch (audit.status) {
    case 'queued':
      return (
        <div className="alert alert-info" role="status">
          <p>
            <strong>Na fila.</strong> A execução começa quando o worker de auditoria estiver ativo (
            <code>npm run worker</code>). Esta página se atualiza sozinha.
          </p>
        </div>
      );
    case 'running':
      return (
        <div className="alert alert-info" role="status">
          <p>
            <strong>Em execução há {formatDuration(audit.startedAt ?? audit.createdAt)}.</strong> O Playwright está
            percorrendo as páginas autorizadas e o axe-core avalia critérios WCAG 2.2 AA. Os achados aparecem abaixo
            conforme são registrados.
          </p>
        </div>
      );
    case 'failed':
      return (
        <div className="alert alert-error" role="alert">
          <p>
            <strong>Não foi possível testar o site.</strong> Isto é uma falha técnica da execução, não um resultado de
            acessibilidade. Detalhe: {audit.errorCode || 'erro de navegação não especificado'}.
          </p>
        </div>
      );
    case 'cancelled':
      return (
        <div className="alert alert-warning" role="status">
          Execução cancelada. Os achados registrados até o cancelamento continuam disponíveis.
        </div>
      );
    default:
      return null;
  }
}

export default function AuditDetailPage() {
  const { auditId } = useParams<{ auditId: string }>();
  const audit = useResource(() => api.getAudit(auditId), [auditId]);

  const [impactFilter, setImpactFilter] = useState('');
  const [reviewFilter, setReviewFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const search = useDebouncedValue(searchTerm.trim());
  const findings = useResource(
    () => api.getFindings(auditId, { impact: impactFilter, reviewStatus: reviewFilter, search }),
    [auditId, impactFilter, reviewFilter, search]
  );

  const [reviewing, setReviewing] = useState<ReviewableFinding | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [report, setReport] = useState<{ open: boolean; content?: string; error?: string }>({ open: false });

  const status = audit.data?.status;
  const inProgress = status ? isAuditInProgress(status) : false;
  const { reload: reloadAudit } = audit;
  const { reload: reloadFindings } = findings;

  useEffect(() => {
    if (!inProgress) return;
    const timer = setInterval(() => {
      reloadAudit({ silent: true });
      reloadFindings({ silent: true });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [inProgress, reloadAudit, reloadFindings]);

  async function handleCancel() {
    setCancelling(true);
    setCancelError(null);
    try {
      await api.cancelAudit(auditId);
      setConfirmCancel(false);
      await reloadAudit({ silent: true });
    } catch (err) {
      setCancelError(errorMessage(err, 'Falha ao cancelar a execução.'));
    } finally {
      setCancelling(false);
    }
  }

  async function openReport() {
    setReport({ open: true });
    try {
      setReport({ open: true, content: await api.getAuditReport(auditId) });
    } catch (err) {
      setReport({ open: true, error: errorMessage(err, 'Falha ao gerar a prévia do relatório.') });
    }
  }

  function refreshAfterReview() {
    reloadFindings({ silent: true });
    reloadAudit({ silent: true });
  }

  if (audit.loading) return <LoadingState label="Carregando auditoria…" />;
  if (audit.error || !audit.data) return <ErrorState error={audit.error} resource="Auditoria" />;

  const run = audit.data;
  const { target } = run;
  const { summary } = run;
  const list = [...(findings.data ?? [])].sort(byImpact);
  const total = findings.pagination?.total ?? list.length;
  const hasFilters = Boolean(impactFilter || reviewFilter || searchTerm);
  const downloadUrl = api.auditReportDownloadUrl(run.id);

  return (
    <>
      <PageHeader
        title={`Auditoria de ${target.name}`}
        documentTitle={`Auditoria — ${target.name}`}
        breadcrumbs={[
          { label: 'Projetos', href: '/projects' },
          { label: target.project.name, href: `/projects/${target.project.id}` },
          { label: target.name, href: `/targets/${target.id}` },
          { label: `Auditoria de ${formatDateTime(run.createdAt)}` },
        ]}
        badge={<AuditStatusBadge status={run.status} />}
        meta={
          <>
            <span>
              Alvo: <ExternalLink href={target.startUrl}>{target.startUrl}</ExternalLink>
            </span>
            <span>Criada em {formatDateTime(run.createdAt)}</span>
            {run.startedAt && run.finishedAt && <span>Duração: {formatDuration(run.startedAt, run.finishedAt)}</span>}
            {run.toolVersion && <span>Motor: {run.toolVersion}</span>}
          </>
        }
        actions={
          inProgress ? (
            <button type="button" className="btn btn-danger" onClick={() => setConfirmCancel(true)}>
              Cancelar execução
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-secondary" onClick={openReport}>
                Prévia do relatório
              </button>
              <a href={downloadUrl} className="btn btn-primary" download>
                Baixar relatório (.md)
              </a>
            </>
          )
        }
      />

      <RunStatusNotice audit={run} />

      <section aria-labelledby="summary-title">
        <div className="section-header">
          <div>
            <h2 id="summary-title">Resumo</h2>
            <p>
              {plural(summary.total, 'achado automatizado', 'achados automatizados')},{' '}
              {plural(summary.reviewed, 'revisado por pessoa', 'revisados por pessoas')}. Testes automatizados detectam
              apenas parte das barreiras e não comprovam conformidade.
            </p>
          </div>
        </div>
        <dl className="stat-strip">
          {IMPACT_ORDER.map((impact) => (
            <div key={impact}>
              <dt>
                <span className={`swatch swatch-${impact}`} aria-hidden="true" />
                {IMPACT_LABEL[impact]}
              </dt>
              <dd>{summary.byImpact[impact] ?? 0}</dd>
            </div>
          ))}
          <div>
            <dt>
              <span className="swatch swatch-review" aria-hidden="true" />
              Revisados por pessoas
            </dt>
            <dd>
              {summary.reviewed} <small>de {summary.total}</small>
            </dd>
          </div>
        </dl>
      </section>

      <section className="section" aria-labelledby="findings-title">
        <div className="section-header">
          <h2 id="findings-title">Achados</h2>
        </div>

        <div className="filters" role="search" aria-label="Filtrar achados">
          <div className="form-group">
            <label htmlFor="search-findings" className="form-label">
              Pesquisar
            </label>
            <input
              id="search-findings"
              type="search"
              className="form-input"
              placeholder="Regra, título ou página"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="impact-filter" className="form-label">
              Severidade
            </label>
            <select id="impact-filter" className="form-select" value={impactFilter} onChange={(e) => setImpactFilter(e.target.value)}>
              <option value="">Todas</option>
              {IMPACT_ORDER.map((impact) => (
                <option key={impact} value={impact}>
                  {IMPACT_LABEL[impact]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="review-filter" className="form-label">
              Revisão
            </label>
            <select id="review-filter" className="form-select" value={reviewFilter} onChange={(e) => setReviewFilter(e.target.value)}>
              <option value="">Todas</option>
              {Object.entries(REVIEW_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!hasFilters}
            onClick={() => {
              setSearchTerm('');
              setImpactFilter('');
              setReviewFilter('');
            }}
          >
            Limpar filtros
          </button>
        </div>

        <p className="results-count" role="status" aria-live="polite">
          {findings.loading ? 'Buscando achados…' : `Exibindo ${plural(list.length, 'achado', 'achados')} de ${total}.`}
        </p>

        {findings.error ? (
          <div className="alert alert-error" role="alert">
            {findings.error.message}
          </div>
        ) : list.length === 0 && !findings.loading ? (
          <EmptyState
            title={
              hasFilters
                ? 'Nenhum achado corresponde aos filtros'
                : inProgress
                  ? 'Aguardando os primeiros achados'
                  : run.status === 'completed'
                    ? 'Nenhum achado automatizado'
                    : 'Sem achados registrados'
            }
            description={
              hasFilters
                ? 'Altere ou limpe os filtros para ver outros achados.'
                : run.status === 'completed'
                  ? 'O axe-core não encontrou violações nas páginas testadas. Isso não certifica acessibilidade: faça a revisão manual.'
                  : undefined
            }
          />
        ) : (
          <ul className="issue-list" aria-label="Achados da auditoria">
            {list.map((finding) => (
              <li key={finding.id}>
                <FindingCard
                  finding={finding}
                  onReview={setReviewing}
                  details={[
                    ['Página', <ExternalLink key="page" href={finding.pageUrl}>{finding.pageUrl}</ExternalLink>],
                    finding.elementSelector && [
                      'Elemento',
                      <code key="selector" className="inline-code">{finding.elementSelector}</code>,
                    ],
                    finding.helpUrl && [
                      'Como corrigir',
                      <ExternalLink key="help" href={finding.helpUrl}>Documentação da regra</ExternalLink>,
                    ],
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ReviewDialog
        finding={reviewing}
        onClose={() => setReviewing(null)}
        onSave={api.reviewFinding}
        onSaved={refreshAfterReview}
      />

      <ConfirmDialog
        open={confirmCancel}
        title="Cancelar execução?"
        confirmLabel="Cancelar execução"
        busy={cancelling}
        error={cancelError}
        onConfirm={handleCancel}
        onClose={() => {
          setConfirmCancel(false);
          setCancelError(null);
        }}
        message={<p>A varredura será interrompida. Achados já registrados serão mantidos.</p>}
      />

      <Modal
        open={report.open}
        size="lg"
        title="Prévia do relatório"
        onClose={() => setReport({ open: false })}
        footer={
          <a href={downloadUrl} className="btn btn-primary" download>
            Baixar relatório (.md)
          </a>
        }
      >
        {report.error ? (
          <div className="alert alert-error" role="alert">
            {report.error}
          </div>
        ) : report.content === undefined ? (
          <LoadingState label="Gerando relatório…" />
        ) : (
          <pre className="code-block scroll" tabIndex={0} aria-label="Conteúdo do relatório em Markdown">
            {report.content}
          </pre>
        )}
      </Modal>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function AuditDetailPage() {
  const params = useParams();
  const auditId = params.auditId as string;

  const [audit, setAudit] = useState<any>(null);
  const [findings, setFindings] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [impactFilter, setImpactFilter] = useState('');
  const [reviewFilter, setReviewFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected finding for review modal/drawer
  const [selectedFinding, setSelectedFinding] = useState<any>(null);
  const [reviewStatus, setReviewStatus] = useState('confirmed');
  const [reviewNote, setReviewNote] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  // Markdown preview modal
  const [showMarkdownModal, setShowMarkdownModal] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const [loadingMarkdown, setLoadingMarkdown] = useState(false);

  // Action states
  const [cancelling, setCancelling] = useState(false);

  // Load audit data
  useEffect(() => {
    if (!auditId) return;
    loadAudit();
  }, [auditId]);

  // Load findings when filters change or audit status is completed
  useEffect(() => {
    if (!auditId) return;
    loadFindings();
  }, [auditId, impactFilter, reviewFilter, searchTerm]);

  // Polling when running or queued
  useEffect(() => {
    if (!audit) return;
    if (['queued', 'running'].includes(audit.status)) {
      const timer = setInterval(() => {
        loadAudit(false);
        loadFindings(false);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [audit?.status]);

  async function loadAudit(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      const res = await api.getAudit(auditId);
      setAudit(res.data);
    } catch (err: any) {
      setError(err.message || 'Falha ao buscar dados da auditoria.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  async function loadFindings(showSpinner = false) {
    try {
      const res = await api.getFindings(auditId, {
        impact: impactFilter || undefined,
        reviewStatus: reviewFilter || undefined,
        search: searchTerm || undefined,
      });
      setFindings(res.data || []);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Erro ao buscar achados:', err);
    }
  }

  async function handleCancel() {
    if (!confirm('Deseja interromper esta execução de auditoria?')) return;
    setCancelling(true);
    try {
      await api.cancelAudit(auditId);
      loadAudit();
    } catch (err: any) {
      alert(err.message || 'Falha ao cancelar execução.');
    } finally {
      setCancelling(false);
    }
  }

  function openReviewModal(finding: any) {
    setSelectedFinding(finding);
    setReviewStatus(finding.reviewStatus === 'unreviewed' ? 'confirmed' : finding.reviewStatus);
    setReviewNote(finding.reviewNote || '');
  }

  async function handleSaveReview(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFinding) return;
    setSavingReview(true);
    try {
      await api.reviewFinding(selectedFinding.id, {
        reviewStatus,
        reviewNote,
      });
      setSelectedFinding(null);
      loadFindings();
      loadAudit(false);
    } catch (err: any) {
      alert(err.message || 'Falha ao salvar revisão.');
    } finally {
      setSavingReview(false);
    }
  }

  async function openMarkdownPreview() {
    setShowMarkdownModal(true);
    setLoadingMarkdown(true);
    try {
      const res = await fetch(`/api/v1/audits/${auditId}/report`);
      const text = await res.text();
      setMarkdownContent(text);
    } catch (err) {
      setMarkdownContent('Erro ao carregar prévia do relatório.');
    } finally {
      setLoadingMarkdown(false);
    }
  }

  if (loading && !audit) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        Carregando dados da auditoria...
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div>
        <div className="alert alert-error" role="alert">
          {error || 'Auditoria não encontrada.'}
        </div>
        <Link href="/projects" className="btn btn-secondary">
          ← Voltar para Projetos
        </Link>
      </div>
    );
  }

  const target = audit.target;
  const project = target?.project;
  const isRunning = ['queued', 'running'].includes(audit.status);

  // Group counts
  const impactSummary = findings.reduce(
    (acc, f) => {
      acc[f.impact] = (acc[f.impact] || 0) + 1;
      return acc;
    },
    { critical: 0, serious: 0, moderate: 0, minor: 0 } as Record<string, number>
  );

  const reviewedCount = findings.filter((f) => f.reviewStatus !== 'unreviewed').length;

  return (
    <div>
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.875rem' }}>
        <Link href={`/projects/${project?.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
          ← Projeto: {project?.name}
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <Link href={`/targets/${target?.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
          Alvo: {target?.name}
        </Link>
      </div>

      {/* Main Status Header Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1>Relatório de Execução</h1>
              <span className={`badge badge-${audit.status}`}>
                {audit.status === 'completed' && '✓ Concluída'}
                {audit.status === 'running' && '⚙ Em processamento...'}
                {audit.status === 'queued' && '⏳ Na fila'}
                {audit.status === 'failed' && '✕ Falha técnica'}
                {audit.status === 'cancelled' && '⊘ Cancelada'}
              </span>
            </div>

            <p style={{ marginBottom: '0.35rem' }}>
              <strong>Alvo auditado:</strong>{' '}
              <a href={target?.startUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                {target?.startUrl} ↗
              </a>
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              <span>
                <strong>ID:</strong> <code>{audit.id.slice(0, 8)}</code>
              </span>
              <span>
                <strong>Criada em:</strong> {new Date(audit.createdAt).toLocaleString('pt-BR')}
              </span>
              {audit.toolVersion && (
                <span>
                  <strong>Motor:</strong> {audit.toolVersion}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {isRunning ? (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={cancelling}
                onClick={handleCancel}
              >
                {cancelling ? 'Cancelando...' : 'Cancelar Execução'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={openMarkdownPreview}
                >
                  👁️ Prévia do Relatório
                </button>
                <a
                  href={`/api/v1/audits/${audit.id}/report?download=true`}
                  className="btn btn-primary btn-sm"
                  download
                >
                  📥 Baixar Relatório Markdown
                </a>
              </>
            )}
          </div>
        </div>

        {isRunning && (
          <div className="alert alert-info" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
            <strong>Execução em andamento:</strong> O motor Playwright + axe-core está navegando pelas páginas autorizadas e avaliando critérios WCAG 2.2 AA. Esta tela é atualizada automaticamente a cada 3 segundos.
          </div>
        )}

        {audit.status === 'failed' && (
          <div className="alert alert-error" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
            <strong>Falha técnica durante a varredura:</strong> {audit.errorCode || 'Não foi possível completar os testes de navegação.'}
          </div>
        )}
      </div>

      {/* Summary Stat Grid */}
      <div className="stat-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--sev-critical-border)' }}>
          <div className="stat-label">Achados Críticos</div>
          <div className="stat-value" style={{ color: 'var(--sev-critical-text)' }}>
            {impactSummary.critical || 0}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--sev-serious-border)' }}>
          <div className="stat-label">Achados Graves</div>
          <div className="stat-value" style={{ color: 'var(--sev-serious-text)' }}>
            {impactSummary.serious || 0}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--sev-moderate-border)' }}>
          <div className="stat-label">Achados Moderados</div>
          <div className="stat-value" style={{ color: 'var(--sev-moderate-text)' }}>
            {impactSummary.moderate || 0}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="stat-label">Revisões Humanas</div>
          <div className="stat-value" style={{ color: '#d8b4fe' }}>
            {reviewedCount} / {findings.length}
          </div>
        </div>
      </div>

      {/* Findings Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>Achados de Acessibilidade ({pagination?.total ?? findings.length})</h2>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '220px' }}>
            <label htmlFor="search-findings" className="sr-only">Pesquisar achados</label>
            <input
              id="search-findings"
              type="search"
              className="form-input"
              placeholder="Buscar por regra, título ou seletor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="impact-filter" className="sr-only">Filtrar por severidade</label>
            <select
              id="impact-filter"
              className="form-select"
              value={impactFilter}
              onChange={(e) => setImpactFilter(e.target.value)}
            >
              <option value="">Todas as Severidades</option>
              <option value="critical">🔴 Crítico</option>
              <option value="serious">🟠 Grave</option>
              <option value="moderate">🟡 Moderado</option>
              <option value="minor">🔵 Leve</option>
            </select>
          </div>
          <div>
            <label htmlFor="review-filter" className="sr-only">Filtrar por estado de revisão</label>
            <select
              id="review-filter"
              className="form-select"
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value)}
            >
              <option value="">Todos os Estados de Revisão</option>
              <option value="unreviewed">Não revisado</option>
              <option value="confirmed">Confirmado</option>
              <option value="false_positive">Falso positivo</option>
              <option value="needs_context">Requer contexto</option>
              <option value="fixed">Corrigido</option>
            </select>
          </div>
        </div>

        {findings.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">
              {isRunning
                ? 'Varredura em execução...'
                : 'Nenhum achado corresponde aos filtros selecionados'}
            </h3>
            <p className="empty-state-desc">
              {isRunning
                ? 'Aguarde enquanto as páginas são analisadas.'
                : 'Tente limpar os filtros de severidade e status de revisão.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {findings.map((f) => (
              <div key={f.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                    <span className={`badge badge-${f.impact}`}>
                      {f.impact === 'critical' && '🔴 Crítico'}
                      {f.impact === 'serious' && '🟠 Grave'}
                      {f.impact === 'moderate' && '🟡 Moderado'}
                      {f.impact === 'minor' && '🔵 Leve'}
                      {f.impact === 'unknown' && '⚪ Desconhecido'}
                    </span>
                    <span className={`badge badge-${f.reviewStatus}`}>
                      {f.reviewStatus === 'unreviewed' && 'Não revisado'}
                      {f.reviewStatus === 'confirmed' && 'Confirmado'}
                      {f.reviewStatus === 'false_positive' && 'Falso positivo'}
                      {f.reviewStatus === 'needs_context' && 'Requer contexto'}
                      {f.reviewStatus === 'fixed' && 'Corrigido'}
                    </span>
                    <code className="inline-code">{f.ruleId}</code>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openReviewModal(f)}
                  >
                    ✏️ Revisar Achado
                  </button>
                </div>

                <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.35rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {f.description}
                </p>

                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div>
                    <strong>Página afetada:</strong>{' '}
                    <a href={f.pageUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                      {f.pageUrl} ↗
                    </a>
                  </div>
                  {f.elementSelector && (
                    <div>
                      <strong>Seletor CSS:</strong> <code>{f.elementSelector}</code>
                    </div>
                  )}
                  {f.helpUrl && (
                    <div>
                      <strong>Diretriz Técnica:</strong>{' '}
                      <a href={f.helpUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)' }}>
                        Documentação WCAG / Deque ↗
                      </a>
                    </div>
                  )}
                  {f.reviewNote && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                      <strong>Nota do Auditor ({f.reviewedBy?.name || 'Revisor'}):</strong> {f.reviewNote}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Human Review Modal */}
      {selectedFinding && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
          <div className="modal-content">
            <h2 id="review-modal-title" style={{ marginBottom: '0.5rem' }}>Revisão Humana de Achado</h2>
            <p className="lead-text" style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              <strong>[{selectedFinding.ruleId}]</strong> {selectedFinding.title}
            </p>

            <form onSubmit={handleSaveReview}>
              <div className="form-group">
                <label htmlFor="reviewStatus" className="form-label">
                  Classificação do Achado
                </label>
                <select
                  id="reviewStatus"
                  className="form-select"
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                >
                  <option value="confirmed">Confirmado — Barreira real identificada</option>
                  <option value="false_positive">Falso Positivo — Não se aplica neste contexto</option>
                  <option value="needs_context">Requer Contexto — Avaliação complementar necessária</option>
                  <option value="fixed">Corrigido — Ajuste verificado pela equipe</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="reviewNote" className="form-label">
                  Nota Técnica da Revisão
                </label>
                <p className="form-hint" id="reviewNote-hint">
                  Descreva o impacto percebido para tecnologias assistivas, exceções ou orientações específicas de correção.
                </p>
                <textarea
                  id="reviewNote"
                  className="form-textarea"
                  rows={4}
                  aria-describedby="reviewNote-hint"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Justificativa da classificação, orientações aos desenvolvedores..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={savingReview}
                  onClick={() => setSelectedFinding(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingReview}
                >
                  {savingReview ? 'Salvando...' : 'Salvar Revisão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Markdown Preview Modal */}
      {showMarkdownModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="md-modal-title">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 id="md-modal-title">Prévia do Relatório Markdown</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowMarkdownModal(false)}
              >
                Fechar
              </button>
            </div>

            {loadingMarkdown ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Gerando documento de relatório...
              </div>
            ) : (
              <div>
                <pre className="code-block" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {markdownContent}
                </pre>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <a
                    href={`/api/v1/audits/${audit.id}/report?download=true`}
                    className="btn btn-primary btn-sm"
                    download
                  >
                    Baixar Arquivo .md
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

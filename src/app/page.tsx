'use client';

import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useResource } from '@/lib/use-resource';
import { formatDateTime, isAuditInProgress, plural } from '@/lib/labels';
import { PageHeader } from '@/components/PageHeader';
import { ProjectsTable } from '@/components/ProjectsTable';
import { AuditStatusBadge } from '@/components/Badges';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';

const FLOW = [
  { title: 'Projeto', text: 'Agrupa alvos web e avaliações de IA.' },
  { title: 'Alvo autorizado', text: 'URL com autorização formal registrada.' },
  { title: 'Auditoria', text: 'Playwright + axe-core em páginas do mesmo host.' },
  { title: 'Revisão humana', text: 'Confirme, descarte ou peça contexto para cada achado.' },
  { title: 'Relatório', text: 'Exporte em Markdown com escopo e limitações.' },
];

export default function DashboardPage() {
  const projects = useResource(() => api.getProjects(), []);
  const audits = useResource(() => api.getRecentAudits(5), []);

  const header = (
    <PageHeader
      title="Painel"
      description="Audite barreiras em sites (WCAG 2.2 AA) e vieses em respostas de IA que ignoram ou inferiorizam pessoas com deficiência."
      actions={
        <Link href="/projects/new" className="btn btn-primary">
          Novo projeto
        </Link>
      }
    />
  );

  if (projects.loading) {
    return (
      <>
        {header}
        <LoadingState label="Carregando painel…" />
      </>
    );
  }

  if (projects.error || !projects.data) {
    return <ErrorState error={projects.error} resource="Painel" backHref="/login" backLabel="Ir para o login" />;
  }

  const list = projects.data;
  const recentRuns = audits.data ?? [];
  const inProgress = recentRuns.find((run) => isAuditInProgress(run.status));
  const stats = [
    { label: 'Projetos ativos', value: list.filter((p) => p.status === 'active').length },
    { label: 'Alvos web', value: list.reduce((sum, p) => sum + (p._count?.targets ?? 0), 0) },
    { label: 'Auditorias', value: audits.pagination?.total ?? recentRuns.length },
    { label: 'Avaliações de IA', value: list.reduce((sum, p) => sum + (p._count?.aiEvaluations ?? 0), 0) },
  ];

  return (
    <>
      {header}

      {inProgress && (
        <div className="alert alert-info" role="status">
          Há uma auditoria {inProgress.status === 'queued' ? 'na fila' : 'em execução'} para{' '}
          <strong>{inProgress.target.name}</strong>.{' '}
          <Link href={`/audits/${inProgress.id}`}>Acompanhar execução</Link>
        </div>
      )}

      <section aria-labelledby="stats-title">
        <h2 id="stats-title" className="sr-only">
          Resumo
        </h2>
        <dl className="stat-strip">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section" aria-labelledby="audits-title">
        <div className="section-header">
          <h2 id="audits-title">Auditorias recentes</h2>
        </div>
        {audits.loading ? (
          <LoadingState label="Carregando auditorias…" />
        ) : recentRuns.length === 0 ? (
          <EmptyState
            title="Nenhuma auditoria executada"
            description="Abra um projeto, cadastre um alvo autorizado e inicie a primeira auditoria."
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <caption className="sr-only">Últimas execuções de auditoria</caption>
              <thead>
                <tr>
                  <th scope="col">Alvo</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Achados</th>
                  <th scope="col">Criada em</th>
                  <th scope="col" className="actions">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((run) => (
                  <tr key={run.id}>
                    <td>
                      <Link href={`/targets/${run.target.id}`} className="row-link">
                        {run.target.name}
                      </Link>
                      <p className="cell-note">{run.target.project.name}</p>
                    </td>
                    <td>
                      <AuditStatusBadge status={run.status} />
                    </td>
                    <td>{plural(run._count?.findings ?? 0, 'achado', 'achados')}</td>
                    <td className="nowrap">{formatDateTime(run.createdAt)}</td>
                    <td className="actions">
                      <Link href={`/audits/${run.id}`} className="btn btn-secondary btn-sm">
                        {isAuditInProgress(run.status)
                          ? 'Acompanhar'
                          : run.status === 'completed'
                            ? 'Continuar revisão'
                            : 'Ver detalhes'}
                        <span className="sr-only"> — {run.target.name}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="section" aria-labelledby="projects-title">
        <div className="section-header">
          <h2 id="projects-title">Projetos recentes</h2>
          {list.length > 0 && <Link href="/projects">Ver todos os projetos</Link>}
        </div>
        {list.length === 0 ? (
          <EmptyState
            title="Nenhum projeto cadastrado ainda"
            description="Crie um projeto para organizar alvos, auditorias e avaliações de IA."
            action={
              <Link href="/projects/new" className="btn btn-primary">
                Criar primeiro projeto
              </Link>
            }
          />
        ) : (
          <ProjectsTable projects={list.slice(0, 5)} caption="Projetos recentes" />
        )}
      </section>

      <section className="section" aria-labelledby="flow-title">
        <div className="section-header">
          <div>
            <h2 id="flow-title">Como funciona</h2>
            <p>Resultados automáticos são indícios: a conclusão é sempre de uma pessoa revisora.</p>
          </div>
        </div>
        <ol className="steps">
          {FLOW.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              {step.text}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useResource } from '@/lib/use-resource';
import { plural } from '@/lib/labels';
import { PageHeader } from '@/components/PageHeader';
import { ProjectsTable } from '@/components/ProjectsTable';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';

type StatusFilter = 'all' | 'active' | 'archived';

export default function ProjectsListPage() {
  const { data, error, loading } = useResource(() => api.getProjects(), []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  const header = (
    <PageHeader
      title="Projetos"
      description="Cada projeto reúne alvos web autorizados, histórico de auditorias e avaliações de respostas de IA."
      actions={
        <Link href="/projects/new" className="btn btn-primary">
          Novo projeto
        </Link>
      }
    />
  );

  if (loading) {
    return (
      <>
        {header}
        <LoadingState label="Carregando projetos…" />
      </>
    );
  }

  if (error || !data) return <ErrorState error={error} resource="Projetos" backHref="/" backLabel="Voltar ao painel" />;

  const term = searchTerm.trim().toLowerCase();
  const filtered = data.filter(
    (p) =>
      (statusFilter === 'all' || p.status === statusFilter) &&
      (!term || p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term))
  );
  const hasFilters = term !== '' || statusFilter !== 'active';

  return (
    <>
      {header}

      {data.length === 0 ? (
        <EmptyState
          headingLevel="h2"
          title="Nenhum projeto cadastrado"
          description="Crie o primeiro projeto para cadastrar alvos e iniciar auditorias."
          action={
            <Link href="/projects/new" className="btn btn-primary">
              Criar primeiro projeto
            </Link>
          }
        />
      ) : (
        <>
          <div className="filters filters-2" role="search" aria-label="Filtrar projetos">
            <div className="form-group">
              <label htmlFor="search" className="form-label">
                Pesquisar
              </label>
              <input
                id="search"
                type="search"
                className="form-input"
                placeholder="Nome ou descrição"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="active">Ativos</option>
                <option value="archived">Arquivados</option>
                <option value="all">Todos</option>
              </select>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={!hasFilters}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('active');
              }}
            >
              Limpar filtros
            </button>
          </div>

          <p className="results-count" role="status" aria-live="polite">
            {plural(filtered.length, 'projeto encontrado', 'projetos encontrados')}
          </p>

          {filtered.length === 0 ? (
            <EmptyState
              headingLevel="h2"
              title="Nenhum projeto corresponde aos filtros"
              description="Altere a pesquisa ou o status para ver outros projetos."
            />
          ) : (
            <ProjectsTable projects={filtered} caption="Lista de projetos" />
          )}
        </>
      )}
    </>
  );
}

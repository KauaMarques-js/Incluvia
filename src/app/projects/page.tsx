'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');

  useEffect(() => {
    api.getProjects()
      .then((res) => {
        setProjects(res.data || []);
      })
      .catch((err) => {
        setError(err.message || 'Falha ao buscar projetos.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1>Projetos de Auditoria</h1>
          <p className="lead-text" style={{ marginBottom: 0 }}>
            Gerencie e monitore o histórico de projetos de acessibilidade web.
          </p>
        </div>
        <Link href="/projects/new" className="btn btn-primary">
          + Criar Novo Projeto
        </Link>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1', minWidth: '220px' }}>
          <label htmlFor="search" className="sr-only">Pesquisar projeto</label>
          <input
            id="search"
            type="search"
            className="form-input"
            placeholder="Pesquisar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ minWidth: '160px' }}>
          <label htmlFor="status" className="sr-only">Filtrar por status</label>
          <select
            id="status"
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Todos os Status</option>
            <option value="active">Apenas Ativos</option>
            <option value="archived">Apenas Arquivados</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Carregando projetos...
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state-title">Nenhum projeto encontrado</h2>
          <p className="empty-state-desc">
            {searchTerm || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de pesquisa.'
              : 'Cadastre seu primeiro projeto de auditoria para começar.'}
          </p>
          <Link href="/projects/new" className="btn btn-primary">
            + Criar Novo Projeto
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table" aria-label="Lista de projetos">
            <thead>
              <tr>
                <th scope="col">Projeto</th>
                <th scope="col">Status</th>
                <th scope="col">Alvos Associados</th>
                <th scope="col">Data de Criação</th>
                <th scope="col"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr key={project.id}>
                  <td>
                    <strong>
                      <Link href={`/projects/${project.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {project.name}
                      </Link>
                    </strong>
                    {project.description && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {project.description}
                      </p>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${project.status === 'active' ? 'badge-completed' : 'badge-queued'}`}>
                      {project.status === 'active' ? 'Ativo' : 'Arquivado'}
                    </span>
                  </td>
                  <td>{project._count?.targets ?? 0} alvo(s)</td>
                  <td>{new Date(project.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/projects/${project.id}`} className="btn btn-secondary btn-sm">
                      Detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

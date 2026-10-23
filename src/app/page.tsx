'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getProjects()
      .then((res) => {
        setProjects(res.data || []);
      })
      .catch((err) => {
        setError(err.message || 'Falha ao carregar dados do painel.');
      })
      .finally(() => setLoading(false));
  }, []);

  const totalTargets = projects.reduce((acc, p) => acc + (p._count?.targets ?? 0), 0);
  const activeProjects = projects.filter((p) => p.status === 'active');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1>Painel de capacitismo algorítmico</h1>
          <p className="lead-text">
            Audite barreiras em sites (WCAG) e vieses em respostas de IA que ignoram ou inferiorizam pessoas com deficiência.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/projects/new" className="btn btn-primary">
            + Novo Projeto
          </Link>
          <Link href="/projects" className="btn btn-secondary">
            Ver Todos os Projetos
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error} — <Link href="/login" style={{ color: 'inherit', fontWeight: 'bold' }}>Faça login para acessar</Link>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Projetos Ativos</div>
          <div className="stat-value">{activeProjects.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total de Alvos Cadastrados</div>
          <div className="stat-value">{totalTargets}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Interface (módulo B)</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', color: 'var(--primary)', marginTop: '0.5rem' }}>
            WCAG + axe-core
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">IA (módulo C)</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', color: 'var(--accent-purple)', marginTop: '0.5rem' }}>
            Rubrica de viés
          </div>
        </div>
      </div>

      {/* Guidelines Card */}
      <div className="card" style={{ marginBottom: '2rem', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
        <h2 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🛡️</span> Diretrizes Éticas e Metodológicas (Incluvia)
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
          Capacitismo algorítmico é quando um site ou uma IA trata PCD como exceção: ignora, segrega ou inferioriza. A Incluvia registra dois tipos de evidência — barreira na interface e viés na resposta — e exige revisão humana. Nenhum resultado automático declara o sistema “livre de capacitismo”.
        </p>
      </div>

      {/* Projects List */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Projetos Recentes</h2>
          <Link href="/projects" style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none' }}>
            Explorar projetos →
          </Link>
        </div>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Carregando projetos cadastrados...
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">Nenhum projeto cadastrado ainda</h3>
            <p className="empty-state-desc">
              Inicie criando um projeto para organizar seus alvos e auditorias de acessibilidade.
            </p>
            <Link href="/projects/new" className="btn btn-primary">
              Criar Primeiro Projeto
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table" aria-label="Tabela de projetos recentes">
              <thead>
                <tr>
                  <th scope="col">Nome do Projeto</th>
                  <th scope="col">Status</th>
                  <th scope="col">Alvos</th>
                  <th scope="col">Criado em</th>
                  <th scope="col"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 5).map((project) => (
                  <tr key={project.id}>
                    <td>
                      <strong>
                        <Link href={`/projects/${project.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {project.name}
                        </Link>
                      </strong>
                      {project.description && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
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
                        Acessar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

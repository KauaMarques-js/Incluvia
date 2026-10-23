'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    loadProject();
  }, [projectId]);

  function loadProject() {
    setLoading(true);
    api.getProject(projectId)
      .then((res) => setProject(res.data))
      .catch((err) => setError(err.message || 'Falha ao carregar detalhes do projeto.'))
      .finally(() => setLoading(false));
  }

  async function handleArchive() {
    if (!confirm('Deseja realmente arquivar este projeto? O histórico de auditorias será preservado.')) {
      return;
    }
    setActionLoading(true);
    try {
      await api.archiveProject(projectId);
      loadProject();
    } catch (err: any) {
      alert(err.message || 'Falha ao arquivar projeto.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        Carregando detalhes do projeto...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div>
        <div className="alert alert-error" role="alert">
          {error || 'Projeto não encontrado.'}
        </div>
        <Link href="/projects" className="btn btn-secondary">
          ← Voltar para Projetos
        </Link>
      </div>
    );
  }

  const isArchived = project.status === 'archived';

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/projects" style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none' }}>
          ← Voltar para Projetos
        </Link>
      </div>

      {/* Project Header Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1>{project.name}</h1>
              <span className={`badge ${isArchived ? 'badge-cancelled' : 'badge-completed'}`}>
                {isArchived ? 'Arquivado' : 'Ativo'}
              </span>
            </div>
            {project.description ? (
              <p className="lead-text" style={{ marginBottom: '0.75rem' }}>
                {project.description}
              </p>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                Sem descrição detalhada fornecida.
              </p>
            )}
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Criado em {new Date(project.createdAt).toLocaleDateString('pt-BR')} por {project.createdBy?.name || 'Auditor'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {!isArchived && (
              <Link href={`/projects/${project.id}/ai/new`} className="btn btn-primary">
                + Avaliar resposta de IA
              </Link>
            )}
            {!isArchived && (
              <Link href={`/projects/${project.id}/targets/new`} className="btn btn-secondary">
                + Cadastrar alvo web
              </Link>
            )}
            {!isArchived && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={actionLoading}
                onClick={handleArchive}
              >
                Arquivar Projeto
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem' }}>Duas frentes da mesma ideia</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Capacitismo algorítmico aparece na interface (site que exclui) e na decisão/linguagem da IA (resposta que inferioriza). Este projeto registra os dois, sempre com revisão humana.
        </p>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
          <h2>Avaliações de IA ({project.aiEvaluations?.length ?? 0})</h2>
          {!isArchived && (
            <Link href={`/projects/${project.id}/ai/new`} className="btn btn-secondary btn-sm">
              + Nova avaliação
            </Link>
          )}
        </div>

        {project.aiEvaluations?.length ? (
          <div className="table-container">
            <table className="data-table" aria-label="Avaliações de respostas de IA">
              <thead>
                <tr>
                  <th scope="col">Cenário</th>
                  <th scope="col">Modelo</th>
                  <th scope="col">Achados</th>
                  <th scope="col">Data</th>
                  <th scope="col"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {project.aiEvaluations.map((item: any) => (
                  <tr key={item.id}>
                    <td><strong>{item.scenarioTitle}</strong></td>
                    <td>{item.modelName || '—'}</td>
                    <td>{item._count?.findings ?? 0}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/ai-evaluations/${item.id}`} className="btn btn-secondary btn-sm">
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h3 className="empty-state-title">Nenhuma resposta de IA avaliada</h3>
            <p className="empty-state-desc">
              Cole um prompt e a saída do modelo para procurar linguagem capacitista, omissão e presunção de incapacidade.
            </p>
            {!isArchived && (
              <Link href={`/projects/${project.id}/ai/new`} className="btn btn-primary">
                Avaliar primeira resposta
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Targets Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Alvos de Auditoria do Projeto ({project.targets?.length ?? 0})</h2>
          {!isArchived && (
            <Link href={`/projects/${project.id}/targets/new`} className="btn btn-secondary btn-sm">
              + Novo Alvo
            </Link>
          )}
        </div>

        {project.targets?.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">Nenhum alvo cadastrado neste projeto</h3>
            <p className="empty-state-desc">
              Cadastre a URL do site ou sistema que possui autorização formal para receber auditorias automatizadas.
            </p>
            {!isArchived && (
              <Link href={`/projects/${project.id}/targets/new`} className="btn btn-primary">
                Cadastrar Primeiro Alvo
              </Link>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table" aria-label="Alvos de auditoria cadastrados">
              <thead>
                <tr>
                  <th scope="col">Identificação do Alvo</th>
                  <th scope="col">URL Inicial</th>
                  <th scope="col">Autorização Formal</th>
                  <th scope="col">Auditorias</th>
                  <th scope="col"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {project.targets.map((target: any) => (
                  <tr key={target.id}>
                    <td>
                      <strong>
                        <Link href={`/targets/${target.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {target.name}
                        </Link>
                      </strong>
                      {target.description && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {target.description}
                        </p>
                      )}
                    </td>
                    <td>
                      <code className="inline-code">{target.startUrl}</code>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: '#10b981' }}>
                        ✓ Confirmada ({new Date(target.authorizationConfirmedAt).toLocaleDateString('pt-BR')})
                      </span>
                    </td>
                    <td>{target._count?.auditRuns ?? target.auditRuns?.length ?? 0} execução(ões)</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/targets/${target.id}`} className="btn btn-secondary btn-sm">
                        Abrir Alvo →
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

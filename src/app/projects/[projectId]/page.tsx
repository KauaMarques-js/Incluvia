'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, errorMessage } from '@/lib/api-client';
import { useResource } from '@/lib/use-resource';
import { RESPONSE_SOURCE_SHORT, formatDate, plural } from '@/lib/labels';
import { PageHeader } from '@/components/PageHeader';
import { ProjectStatusBadge } from '@/components/Badges';
import { ConfirmDialog } from '@/components/Modal';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, error, loading, reload } = useResource(() => api.getProject(projectId), [projectId]);

  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  async function handleArchive() {
    setArchiving(true);
    setArchiveError(null);
    try {
      await api.archiveProject(projectId);
      setConfirmArchive(false);
      await reload({ silent: true });
    } catch (err) {
      setArchiveError(errorMessage(err, 'Falha ao arquivar projeto.'));
    } finally {
      setArchiving(false);
    }
  }

  if (loading) return <LoadingState label="Carregando projeto…" />;
  if (error || !project) return <ErrorState error={error} resource="Projeto" />;

  const isArchived = project.status === 'archived';
  const targets = project.targets ?? [];
  const evaluations = project.aiEvaluations ?? [];

  return (
    <>
      <PageHeader
        title={project.name}
        breadcrumbs={[{ label: 'Projetos', href: '/projects' }, { label: project.name }]}
        badge={<ProjectStatusBadge status={project.status} />}
        description={project.description || 'Sem descrição.'}
        meta={
          <span>
            Criado em {formatDate(project.createdAt)}
            {project.createdBy?.name ? ` por ${project.createdBy.name}` : ''}
          </span>
        }
        actions={
          !isArchived && (
            <>
              <Link href={`/projects/${project.id}/targets/new`} className="btn btn-primary">
                Cadastrar alvo web
              </Link>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmArchive(true)}>
                Arquivar projeto
              </button>
            </>
          )
        }
      />

      {isArchived && (
        <div className="alert alert-info" role="status">
          Projeto arquivado: o histórico continua disponível para consulta e relatórios, mas não é possível cadastrar
          novos alvos, auditorias ou avaliações.
        </div>
      )}

      <section aria-labelledby="targets-title">
        <div className="section-header">
          <div>
            <h2 id="targets-title">Alvos web ({targets.length})</h2>
            <p>Sites com autorização formal registrada. Abra um alvo para auditar e consultar o histórico.</p>
          </div>
        </div>

        {targets.length === 0 ? (
          <EmptyState
            title="Nenhum alvo cadastrado"
            description="Cadastre a URL de um site para o qual a equipe tenha autorização formal de auditoria."
            action={
              !isArchived && (
                <Link href={`/projects/${project.id}/targets/new`} className="btn btn-primary">
                  Cadastrar primeiro alvo
                </Link>
              )
            }
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <caption className="sr-only">Alvos web do projeto</caption>
              <thead>
                <tr>
                  <th scope="col">Alvo</th>
                  <th scope="col">URL inicial</th>
                  <th scope="col">Autorização</th>
                  <th scope="col">Auditorias</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((target) => (
                  <tr key={target.id}>
                    <td>
                      <Link href={`/targets/${target.id}`} className="row-link">
                        {target.name}
                      </Link>
                      {target.description && <p className="cell-note">{target.description}</p>}
                    </td>
                    <td>
                      <code className="inline-code">{target.startUrl}</code>
                    </td>
                    <td className="nowrap">Confirmada em {formatDate(target.authorizationConfirmedAt)}</td>
                    <td className="nowrap">{plural(target._count?.auditRuns ?? 0, 'execução', 'execuções')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="section" aria-labelledby="ai-title">
        <div className="section-header">
          <div>
            <h2 id="ai-title">Avaliações de respostas de IA ({evaluations.length})</h2>
            <p>
              Compara respostas com e sem a menção à deficiência e procura linguagem capacitista.{' '}
              <Link href="/ai-library">Ver biblioteca de cenários e regras</Link>
            </p>
          </div>
          {!isArchived && evaluations.length > 0 && (
            <Link href={`/projects/${project.id}/ai/new`} className="btn btn-secondary btn-sm">
              Nova avaliação de IA
            </Link>
          )}
        </div>

        {evaluations.length === 0 ? (
          <EmptyState
            title="Nenhuma resposta de IA avaliada"
            description="Faça a mesma pergunta com e sem a menção à deficiência e compare as respostas de um sistema de IA."
            action={
              !isArchived && (
                <Link href={`/projects/${project.id}/ai/new`} className="btn btn-secondary">
                  Avaliar resposta de IA
                </Link>
              )
            }
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <caption className="sr-only">Avaliações de respostas de IA</caption>
              <thead>
                <tr>
                  <th scope="col">Cenário</th>
                  <th scope="col">Método</th>
                  <th scope="col">Sistema avaliado</th>
                  <th scope="col">Achados</th>
                  <th scope="col">Data</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/ai-evaluations/${item.id}`} className="row-link">
                        {item.scenarioTitle}
                      </Link>
                    </td>
                    <td>
                      {item.mode === 'paired' ? 'Pareada' : 'Pergunta única'}
                      <p className="cell-note">{RESPONSE_SOURCE_SHORT[item.source] ?? item.source}</p>
                    </td>
                    <td>{[item.modelName || 'Não informado', item.modelVersion].filter(Boolean).join(' · ')}</td>
                    <td>{plural(item._count?.findings ?? 0, 'achado', 'achados')}</td>
                    <td className="nowrap">{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmArchive}
        title="Arquivar projeto?"
        confirmLabel="Arquivar projeto"
        busy={archiving}
        error={archiveError}
        onConfirm={handleArchive}
        onClose={() => {
          setConfirmArchive(false);
          setArchiveError(null);
        }}
        message={
          <>
            <p>
              <strong>{project.name}</strong> ficará somente para consulta.
            </p>
            <p>Alvos, auditorias, achados e relatórios são preservados — nada é apagado.</p>
          </>
        }
      />
    </>
  );
}

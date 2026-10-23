import Link from 'next/link';
import { ProjectStatusBadge } from '@/components/Badges';
import { formatDate, plural } from '@/lib/labels';
import type { ProjectSummary } from '@/lib/types';

/** Tabela de projetos usada no Painel e na tela Projetos. */
export function ProjectsTable({ projects, caption }: { projects: ProjectSummary[]; caption: string }) {
  return (
    <div className="table-container">
      <table className="data-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Projeto</th>
            <th scope="col">Status</th>
            <th scope="col">Conteúdo</th>
            <th scope="col">Criado em</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>
                <Link href={`/projects/${project.id}`} className="row-link">
                  {project.name}
                </Link>
                {project.description && <p className="cell-note">{project.description}</p>}
              </td>
              <td>
                <ProjectStatusBadge status={project.status} />
              </td>
              <td className="nowrap">
                {plural(project._count?.targets ?? 0, 'alvo web', 'alvos web')}
                <br />
                <span className="muted">{plural(project._count?.aiEvaluations ?? 0, 'avaliação de IA', 'avaliações de IA')}</span>
              </td>
              <td className="nowrap">{formatDate(project.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

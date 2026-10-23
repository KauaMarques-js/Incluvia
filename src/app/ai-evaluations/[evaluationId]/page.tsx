'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useResource } from '@/lib/use-resource';
import { formatDateTime, plural } from '@/lib/labels';
import type { ReviewableFinding } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { ReviewDialog } from '@/components/ReviewDialog';
import { FindingCard } from '@/components/FindingCard';
import { ErrorState, LoadingState } from '@/components/States';

export default function AiEvaluationDetailPage() {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const { data: evaluation, error, loading, reload } = useResource(
    () => api.getAiEvaluation(evaluationId),
    [evaluationId]
  );
  const [reviewing, setReviewing] = useState<ReviewableFinding | null>(null);

  if (loading) return <LoadingState label="Carregando avaliação…" />;
  if (error || !evaluation) return <ErrorState error={error} resource="Avaliação" />;

  const { project } = evaluation;
  const findings = evaluation.findings ?? [];
  const reviewed = findings.filter((f) => f.reviewStatus !== 'unreviewed').length;
  const model = [evaluation.modelName || 'Modelo não informado', evaluation.modelVersion].filter(Boolean).join(' · ');

  return (
    <>
      <PageHeader
        title={evaluation.scenarioTitle}
        documentTitle="Avaliação de IA"
        breadcrumbs={[
          { label: 'Projetos', href: '/projects' },
          { label: project.name, href: `/projects/${project.id}` },
          { label: 'Avaliação de IA' },
        ]}
        description="Avaliação de capacitismo em resposta de IA, feita com a rubrica local."
        meta={
          <>
            <span>{model}</span>
            <span>{formatDateTime(evaluation.createdAt)}</span>
          </>
        }
        actions={
          <a href={api.aiReportDownloadUrl(evaluation.id)} className="btn btn-primary" download>
            Baixar relatório (.md)
          </a>
        }
      />

      <section aria-labelledby="material-title">
        <div className="section-header">
          <h2 id="material-title">Material avaliado</h2>
        </div>
        <dl className="material">
          <dt>Prompt enviado</dt>
          <dd className="text-block">{evaluation.prompt}</dd>
          <dt>Resposta da IA</dt>
          <dd className="text-block">{evaluation.responseText}</dd>
        </dl>
      </section>

      <section className="section" aria-labelledby="findings-title">
        <div className="section-header">
          <div>
            <h2 id="findings-title">Achados da rubrica ({findings.length})</h2>
            <p>
              {plural(reviewed, 'revisado', 'revisados')} de {findings.length}. A rubrica só aponta padrões; não certifica
              o modelo.
            </p>
          </div>
        </div>

        <ul className="issue-list" aria-label="Achados da rubrica">
          {findings.map((finding) => (
            <li key={finding.id}>
              <FindingCard
                finding={finding}
                onReview={setReviewing}
                details={[
                  finding.evidence && ['Trecho', <q key="evidence">{finding.evidence}</q>],
                  finding.helpText && ['Orientação', finding.helpText],
                ]}
              />
            </li>
          ))}
        </ul>
      </section>

      <ReviewDialog
        finding={reviewing}
        onClose={() => setReviewing(null)}
        onSave={api.reviewAiFinding}
        onSaved={() => reload({ silent: true })}
      />
    </>
  );
}

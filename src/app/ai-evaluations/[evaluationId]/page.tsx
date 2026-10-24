'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useResource } from '@/lib/use-resource';
import {
  FINDING_SOURCE_LABEL,
  OUTCOME_LABEL,
  RESPONSE_SOURCE_SHORT,
  formatDate,
  formatDateTime,
  frequencyLabel,
  methodLabel,
  plural,
} from '@/lib/labels';
import type { AiEvaluationDetail, AiFinding, AiResponse, ReviewableFinding } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { ReviewDialog } from '@/components/ReviewDialog';
import { FindingCard } from '@/components/FindingCard';
import { ErrorState, LoadingState } from '@/components/States';

const NEEDS_REVIEW = 'ableism-needs-human-review';

function OutcomeBadge({ outcome }: { outcome: AiResponse['outcome'] }) {
  if (!outcome) return null;
  return (
    <span className={`badge badge-outcome-${outcome}`}>
      <span className="sr-only">Desfecho: </span>
      {OUTCOME_LABEL[outcome]}
    </span>
  );
}

function ComparisonSummary({ evaluation }: { evaluation: AiEvaluationDetail }) {
  const target = evaluation.responses.filter((r) => r.variant === 'target');
  const reference = evaluation.responses.filter((r) => r.variant === 'reference');
  const count = (list: AiResponse[], outcome: string) => list.filter((r) => r.outcome === outcome).length;
  const gap = evaluation.findings.find((f) => f.source === 'comparison');

  return (
    <section className="section" aria-labelledby="comparison-title">
      <div className="section-header">
        <div>
          <h2 id="comparison-title">Comparação de desfechos</h2>
          <p>A mesma decisão, pedida com e sem a menção à deficiência.</p>
        </div>
      </div>
      <div className={`verdict ${gap ? 'verdict-alert' : 'verdict-ok'}`} role="status">
        {gap
          ? gap.description
          : `As duas versões tiveram o mesmo padrão de desfecho em ${plural(target.length, 'resposta', 'respostas')}. Isso não prova ausência de viés; leia as respostas.`}
      </div>
      <div className="table-container">
        <table className="data-table">
          <caption className="sr-only">Desfecho das respostas por versão da pergunta</caption>
          <thead>
            <tr>
              <th scope="col">Desfecho</th>
              <th scope="col" className="num">
                Com a menção à deficiência
              </th>
              <th scope="col" className="num">
                Referência
              </th>
            </tr>
          </thead>
          <tbody>
            {(['favorable', 'unfavorable', 'neutral'] as const).map((outcome) => (
              <tr key={outcome}>
                <th scope="row">{OUTCOME_LABEL[outcome]}</th>
                <td className="num">
                  {count(target, outcome)} de {target.length}
                </td>
                <td className="num">
                  {count(reference, outcome)} de {reference.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Evolution({ evaluation }: { evaluation: AiEvaluationDetail }) {
  const { previous, counts } = evaluation;
  if (!previous) return null;
  const delta = counts.total - previous.counts.total;
  const trend = delta < 0 ? 'Menos achados que' : delta > 0 ? 'Mais achados que' : 'Mesmo número de achados que';
  const model = [previous.modelName, previous.modelVersion].filter(Boolean).join(' · ');

  return (
    <section className="section" aria-labelledby="evolution-title">
      <div className="section-header">
        <div>
          <h2 id="evolution-title">Evolução</h2>
          <p>
            {trend} a <Link href={`/ai-evaluations/${previous.id}`}>avaliação de {formatDate(previous.createdAt)}</Link>
            {model && ` (${model})`}. Mudanças no modelo, nas perguntas ou nas repetições afetam a comparação.
          </p>
        </div>
      </div>
      <dl className="stat-strip">
        <div>
          <dt>Achados antes</dt>
          <dd>
            {previous.counts.total} <small>({previous.counts.critical} críticos)</small>
          </dd>
        </div>
        <div>
          <dt>Achados agora</dt>
          <dd>
            {counts.total} <small>({counts.critical} críticos)</small>
          </dd>
        </div>
      </dl>
    </section>
  );
}

function findingDetails(finding: AiFinding): Array<[string, React.ReactNode] | false | null> {
  const frequency =
    finding.referenceOccurrences === null
      ? frequencyLabel(finding.occurrences, finding.samples)
      : `${frequencyLabel(finding.occurrences, finding.samples)} · na referência: ${finding.referenceOccurrences}`;
  const stats = finding.ruleStats;
  return [
    ['Frequência', frequency],
    ['Origem', FINDING_SOURCE_LABEL[finding.source] ?? finding.source],
    finding.evidence !== null && ['Trecho', <q key="evidence">{finding.evidence}</q>],
    finding.helpText !== null && ['Como corrigir', finding.helpText],
    finding.guidance !== null && ['Exemplo', finding.guidance.rewrite],
    stats !== null && stats.decided > 0 && [
      'Histórico da regra',
      `Confirmada em ${stats.confirmed} de ${plural(stats.decided, 'revisão', 'revisões')} (falsos positivos: ${stats.falsePositive})`,
    ],
  ];
}

function ResponseColumn({ title, prompt, responses }: { title: string; prompt: string | null; responses: AiResponse[] }) {
  return (
    <div className="response-column">
      <h3>{title}</h3>
      {prompt && <p className="text-block">{prompt}</p>}
      <ol className="response-items">
        {responses.map((response) => (
          <li key={response.id}>
            <details>
              <summary>
                Resposta {response.position} <OutcomeBadge outcome={response.outcome} />
              </summary>
              <p className="text-block">{response.text}</p>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function AiEvaluationDetailPage() {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const { data: evaluation, error, loading, reload } = useResource(() => api.getAiEvaluation(evaluationId), [evaluationId]);
  const [reviewing, setReviewing] = useState<ReviewableFinding | null>(null);

  if (loading) return <LoadingState label="Carregando avaliação…" />;
  if (error || !evaluation) return <ErrorState error={error} resource="Avaliação" />;

  const { project, findings } = evaluation;
  const target = evaluation.responses.filter((r) => r.variant === 'target');
  const reference = evaluation.responses.filter((r) => r.variant === 'reference');
  const paired = evaluation.mode === 'paired' && reference.length > 0;
  const hasOutcomes = paired && evaluation.responses.some((r) => r.outcome);
  const realFindings = findings.filter((f) => f.ruleId !== NEEDS_REVIEW);
  const reviewed = findings.filter((f) => f.reviewStatus !== 'unreviewed').length;
  // No simulador, o "modelo" é a própria origem: mostra só a versão simulada.
  const model =
    evaluation.source === 'simulator'
      ? evaluation.modelVersion
      : [evaluation.modelName || 'Sistema não informado', evaluation.modelVersion].filter(Boolean).join(' · ');

  return (
    <>
      <PageHeader
        title={evaluation.scenarioTitle}
        documentTitle="Avaliação de IA"
        breadcrumbs={[
          { label: 'Projetos', href: '/projects' },
          { label: project.name, href: `/projects/${project.id}` },
          { label: `Avaliação de IA de ${formatDate(evaluation.createdAt)}` },
        ]}
        badge={<span className="badge badge-queued">{methodLabel(evaluation.mode, target.length)}</span>}
        description={evaluation.scenario?.hypothesis}
        meta={
          <>
            <span>{RESPONSE_SOURCE_SHORT[evaluation.source]}</span>
            {model && <span>{model}</span>}
            <span>{formatDateTime(evaluation.createdAt)}</span>
          </>
        }
        actions={
          <>
            {project.status === 'active' && (
              <Link href={`/projects/${project.id}/ai/new?from=${evaluation.id}`} className="btn btn-secondary">
                Repetir avaliação
              </Link>
            )}
            <a href={api.aiReportDownloadUrl(evaluation.id)} className="btn btn-primary" download>
              Baixar relatório (.md)
            </a>
          </>
        }
      />

      {evaluation.source === 'simulator' && (
        <div className="alert alert-info">
          <p>
            <strong>Demonstração:</strong> as respostas vêm do simulador da Incluvia (texto pré-escrito), não de uma IA. O
            método, a rubrica e a revisão são os mesmos de uma avaliação real.
          </p>
        </div>
      )}
      {evaluation.judgeStatus === 'failed' && (
        <div className="alert alert-warning" role="status">
          A segunda opinião do Claude não pôde ser obtida. A avaliação contém apenas a rubrica local.
        </div>
      )}

      {hasOutcomes && <ComparisonSummary evaluation={evaluation} />}
      <Evolution evaluation={evaluation} />

      <section className="section" aria-labelledby="findings-title">
        <div className="section-header">
          <div>
            <h2 id="findings-title">Achados ({realFindings.length})</h2>
            <p>
              {reviewed} de {findings.length} revisados. Achados são indícios; a decisão é da revisão humana.
            </p>
          </div>
        </div>
        <ul className="issue-list" aria-label="Achados da avaliação">
          {findings.map((finding) => (
            <li key={finding.id}>
              <FindingCard finding={finding} onReview={setReviewing} details={findingDetails(finding)} />
            </li>
          ))}
        </ul>
      </section>

      {evaluation.systemInstructions.length > 0 && (
        <section className="section" aria-labelledby="fix-title">
          <div className="section-header">
            <div>
              <h2 id="fix-title">Como corrigir no sistema avaliado</h2>
              <p>Instruções sugeridas para o prompt de sistema, a partir dos achados não descartados. Revise antes de usar.</p>
            </div>
          </div>
          <pre className="code-block" tabIndex={0} aria-label="Instruções sugeridas">
            {evaluation.systemInstructions.map((instruction) => `- ${instruction}`).join('\n')}
          </pre>
        </section>
      )}

      <section className="section" aria-labelledby="responses-title">
        <div className="section-header">
          <div>
            <h2 id="responses-title">Respostas analisadas</h2>
            <p>Abra cada resposta para ler o texto completo.</p>
          </div>
        </div>
        <div className={paired ? 'pair-grid' : undefined}>
          <ResponseColumn title={paired ? 'Com a menção à deficiência' : 'Pergunta'} prompt={evaluation.prompt} responses={target} />
          {paired && <ResponseColumn title="Referência" prompt={evaluation.referencePrompt} responses={reference} />}
        </div>
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

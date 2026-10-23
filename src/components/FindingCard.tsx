import { Fragment, type ReactNode } from 'react';
import { ImpactBadge, ReviewBadge } from '@/components/Badges';
import type { ReviewableFinding } from '@/lib/types';

interface FindingCardProps {
  finding: ReviewableFinding;
  /** Pares rótulo/valor (página, seletor, trecho…); itens falsos são ignorados. */
  details: Array<[string, ReactNode] | false | null | undefined | ''>;
  onReview: (finding: ReviewableFinding) => void;
}

/** Achado com severidade, estado de revisão, evidência e ação de revisão humana. */
export function FindingCard({ finding, details, onReview }: FindingCardProps) {
  const rows = details.filter((row): row is [string, ReactNode] => Boolean(row));

  return (
    <article className="finding" aria-labelledby={`finding-${finding.id}`}>
      <div className="finding-head">
        <div className="cluster">
          <ImpactBadge impact={finding.impact} />
          <ReviewBadge status={finding.reviewStatus} />
          <code className="inline-code">{finding.ruleId}</code>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onReview(finding)}>
          Revisar<span className="sr-only">: {finding.title}</span>
        </button>
      </div>

      <h3 id={`finding-${finding.id}`}>{finding.title}</h3>
      <p>{finding.description}</p>

      {rows.length > 0 && (
        <dl className="finding-details">
          {rows.map(([label, value]) => (
            <Fragment key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </Fragment>
          ))}
        </dl>
      )}

      {finding.reviewNote && (
        <p className="review-note">
          <strong>Nota da revisão{finding.reviewedBy?.name ? ` (${finding.reviewedBy.name})` : ''}:</strong>{' '}
          {finding.reviewNote}
        </p>
      )}
    </article>
  );
}

import {
  AUDIT_STATUS_LABEL,
  IMPACT_LABEL,
  PROJECT_STATUS_LABEL,
  REVIEW_LABEL,
} from '@/lib/labels';

/** Badges sempre exibem texto: a cor é apenas reforço (WCAG 1.4.1). */

export function ImpactBadge({ impact }: { impact: string }) {
  return (
    <span className={`badge badge-${impact}`}>
      <span className="sr-only">Severidade: </span>
      {IMPACT_LABEL[impact] ?? impact}
    </span>
  );
}

export function ReviewBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status}`}>
      <span className="sr-only">Revisão: </span>
      {REVIEW_LABEL[status] ?? status}
    </span>
  );
}

export function AuditStatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{AUDIT_STATUS_LABEL[status] ?? status}</span>;
}

export function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${status === 'active' ? 'badge-completed' : 'badge-cancelled'}`}>
      {PROJECT_STATUS_LABEL[status] ?? status}
    </span>
  );
}

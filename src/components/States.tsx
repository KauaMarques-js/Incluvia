import Link from 'next/link';
import type { ReactNode } from 'react';
import { ApiError } from '@/lib/api-client';

export function LoadingState({ label }: { label: string }) {
  return (
    <p className="state" role="status" aria-live="polite">
      {label}
    </p>
  );
}

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  headingLevel?: 'h2' | 'h3';
}

export function EmptyState({ title, description, action, headingLevel: Heading = 'h3' }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Heading className="empty-state-title">{title}</Heading>
      {description && <p className="empty-state-desc">{description}</p>}
      {action}
    </div>
  );
}

/** Mensagem de falha com ação de recuperação, distinguindo permissão e recurso inexistente (§6.5). */
export function ErrorState({
  error,
  resource,
  backHref = '/projects',
  backLabel = 'Voltar para Projetos',
}: {
  error: Error | null;
  resource: string;
  backHref?: string;
  backLabel?: string;
}) {
  const status = error instanceof ApiError ? error.status : undefined;
  const title =
    status === 404
      ? `${resource} não encontrado(a)`
      : status === 403
        ? 'Você não tem acesso a este conteúdo'
        : `Não foi possível carregar ${resource.toLowerCase()}`;

  return (
    <div className="empty-state" role="alert">
      <h1 className="empty-state-title">{title}</h1>
      <p className="empty-state-desc">{error?.message ?? 'Tente novamente em instantes.'}</p>
      <Link href={backHref} className="btn btn-secondary">
        {backLabel}
      </Link>
    </div>
  );
}

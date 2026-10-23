'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';

export interface Crumb {
  label: string;
  href?: string;
}

/** Trilha de navegação Projetos › Projeto › Alvo › Auditoria. O último item é a página atual. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="breadcrumbs">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href && index < items.length - 1 ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface PageHeaderProps {
  title: string;
  /** Título da aba do navegador; por padrão, o próprio título. */
  documentTitle?: string;
  description?: ReactNode;
  badge?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
}

/** Cabeçalho padrão de página: trilha, título (h1), descrição, metadados e ação principal. */
export function PageHeader({ title, documentTitle, description, badge, meta, actions, breadcrumbs }: PageHeaderProps) {
  useEffect(() => {
    document.title = `${documentTitle ?? title} · Incluvia`;
  }, [documentTitle, title]);

  return (
    <div className="page-header">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="page-header-row">
        <div className="page-header-text">
          <div className="title-row">
            <h1>{title}</h1>
            {badge}
          </div>
          {description && <div className="lead-text">{description}</div>}
          {meta && <div className="meta-list">{meta}</div>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </div>
  );
}

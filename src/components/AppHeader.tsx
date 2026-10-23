'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { User } from '@/lib/types';

const NAV_ITEMS = [
  { href: '/', label: 'Painel', isActive: (path: string) => path === '/' },
  {
    href: '/projects',
    label: 'Projetos',
    isActive: (path: string) => ['/projects', '/targets', '/audits', '/ai-evaluations'].some((p) => path.startsWith(p)),
  },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (isLoginPage || user) return;
    api.me().then((res) => setUser(res.data)).catch(() => setUser(null));
  }, [isLoginPage, user]);

  async function handleLogout() {
    await api.logout().catch(() => undefined);
    setUser(null);
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="nav-brand">
          <span className="brand-name">Incluvia</span>
          <span className="brand-tagline">Auditoria de acessibilidade e capacitismo algorítmico</span>
        </Link>

        {!isLoginPage && (
          <nav aria-label="Navegação principal" className="nav">
            <ul className="nav-links">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="nav-link"
                    aria-current={item.isActive(pathname) ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {user && (
              <div className="nav-user">
                <span className="nav-user-name">
                  <span className="sr-only">Conectado como </span>
                  {user.name}
                </span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
                  Sair
                </button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

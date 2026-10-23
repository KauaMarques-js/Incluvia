import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Incluvia — Auditoria e Acessibilidade Algorítmica',
  description:
    'Plataforma de auditoria de acessibilidade web (WCAG 2.2 AA) e prevenção ao capacitismo algorítmico.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo principal
        </a>

        <header className="navbar">
          <div className="navbar-inner">
            <Link href="/" className="nav-brand" aria-label="Incluvia Início">
              <span>Incluvia</span>
              <span className="badge-tag">Acessibilidade e capacitismo</span>
            </Link>

            <nav aria-label="Navegação principal">
              <ul className="nav-links">
                <li>
                  <Link href="/" className="nav-link">
                    Painel
                  </Link>
                </li>
                <li>
                  <Link href="/projects" className="nav-link">
                    Projetos
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="nav-link">
                    Sessão
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main id="main-content" className="app-container" tabIndex={-1}>
          {children}
        </main>

        <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '2rem 1rem', marginTop: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
          <p>
            <strong>Incluvia</strong> — Plataforma de Auditoria e Acessibilidade Algorítmica.
          </p>
          <p style={{ marginTop: '0.5rem', maxWidth: '750px', margin: '0.5rem auto 0' }}>
            Resultados automatizados constituem indícios técnicos e requerem validação humana. Nenhuma varredura automática comprova conformidade jurídica ou ausência integral de barreiras.
          </p>
        </footer>
      </body>
    </html>
  );
}

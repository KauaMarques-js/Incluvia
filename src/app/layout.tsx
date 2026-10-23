import type { Metadata } from 'next';
import './globals.css';
import { AppHeader } from '@/components/AppHeader';
import { VLibrasWidget } from '@/components/VLibrasWidget';

export const metadata: Metadata = {
  title: 'Incluvia — Auditoria e Acessibilidade Algorítmica',
  description:
    'Plataforma de auditoria de acessibilidade web (WCAG 2.2 AA) e prevenção ao capacitismo algorítmico.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo principal
        </a>

        <AppHeader />

        <main id="main-content" className="app-container" tabIndex={-1}>
          {children}
        </main>

        <footer className="site-footer">
          <div className="site-footer-inner">
            <p>
              <strong>Incluvia</strong> — Plataforma de Auditoria e Acessibilidade Algorítmica.
            </p>
            <p>
              Resultados automatizados são indícios técnicos e exigem validação humana. Nenhuma varredura automática
              comprova conformidade jurídica ou ausência de barreiras.
            </p>
          </div>
        </footer>

        <VLibrasWidget />
      </body>
    </html>
  );
}

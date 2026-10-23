'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, errorMessage } from '@/lib/api-client';
import { PageHeader } from '@/components/PageHeader';
import type { User } from '@/lib/types';

/** Credenciais criadas pelo seed (ambiente local de demonstração). */
const DEMO_ACCOUNTS = [
  { label: 'Auditor', email: 'auditor@incluvia.local', password: 'Auditor@123456' },
  { label: 'Administrador', email: 'admin@incluvia.local', password: 'Admin@123456' },
];

/** Aceita apenas caminhos internos para evitar redirecionamento aberto. */
function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.me().then((res) => setCurrentUser(res.data)).catch(() => setCurrentUser(null));
  }, []);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha para entrar.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.login({ email, password });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, 'Falha na autenticação. Verifique os dados.'));
      setLoading(false);
    }
  }

  async function handleLogout() {
    await api.logout().catch(() => undefined);
    setCurrentUser(null);
    router.refresh();
  }

  return (
    <div className="panel">
      <PageHeader
        title="Entrar na Incluvia"
        documentTitle="Entrar"
        description="Acesso restrito a auditores e administradores autorizados."
      />

      {currentUser ? (
        <>
          <div className="alert alert-info" role="status">
            Você já está conectado como <strong>{currentUser.name}</strong> ({currentUser.email}).
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={() => router.push(next)}>
              Continuar
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Sair e trocar de conta
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleLogin} noValidate>
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Senha
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>

          <div className="form-section">
            <p className="form-hint">Ambiente de demonstração — preencher com a conta:</p>
            <div className="cluster">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                  }}
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="login-wrapper">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

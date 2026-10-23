'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.me()
      .then((res) => {
        if (res.data?.user) {
          setCurrentUser(res.data.user);
        }
      })
      .catch(() => {});
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.login({ email, password });
      setSuccess(`Autenticado como ${res.data?.name} (${res.data?.role})`);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    try {
      await api.logout();
      setCurrentUser(null);
      setSuccess('Sessão encerrada com sucesso.');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Falha ao encerrar sessão.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '480px', margin: '3rem auto' }}>
      <div className="card">
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Autenticação Incluvia</h1>
        <p className="lead-text" style={{ marginBottom: '1.5rem' }}>
          Acesso restrito para auditores e administradores autorizados.
        </p>

        {currentUser ? (
          <div>
            <div className="alert alert-info">
              Conectado como <strong>{currentUser.name}</strong> ({currentUser.email}) — Papel: <code>{currentUser.role}</code>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => router.push('/')}
              >
                Ir para o Painel
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                onClick={handleLogout}
              >
                Encerrar Sessão
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} noValidate>
            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success" role="status">
                {success}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                E-mail institucional
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="auditor@Incluvia.local"
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
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Validando credenciais...' : 'Entrar na Plataforma'}
            </button>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Credenciais padrão para testes locais:
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setEmail('auditor@Incluvia.local');
                    setPassword('Auditor@123456');
                  }}
                >
                  Preencher Auditor
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setEmail('admin@Incluvia.local');
                    setPassword('Admin@123456');
                  }}
                >
                  Preencher Admin
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

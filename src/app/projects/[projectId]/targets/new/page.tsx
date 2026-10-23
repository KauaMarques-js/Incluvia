'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function NewTargetPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [name, setName] = useState('');
  const [startUrl, setStartUrl] = useState('');
  const [description, setDescription] = useState('');
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!authorizationConfirmed) {
      setError('É obrigatório confirmar a autorização formal antes de cadastrar o alvo.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.createTarget(projectId, {
        name,
        startUrl,
        description: description.trim() ? description : undefined,
        authorizationConfirmed: true,
      });

      if (res.data?.id) {
        router.push(`/targets/${res.data.id}`);
      } else {
        router.push(`/projects/${projectId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao cadastrar alvo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '640px', margin: '2rem auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href={`/projects/${projectId}`} style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none' }}>
          ← Voltar para Detalhes do Projeto
        </Link>
      </div>

      <div className="card">
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Cadastrar Alvo de Auditoria</h1>
        <p className="lead-text">
          Configure a URL de partida e confirme a autorização prévia de auditoria técnica.
        </p>

        {/* Security / SSRF Warning Banner */}
        <div className="alert alert-warning" role="region" aria-label="Aviso de segurança e limites de auditoria">
          <strong>Proteção Anti-SSRF e Regras de Segurança:</strong>
          <p style={{ marginTop: '0.25rem', fontSize: '0.8125rem' }}>
            Apenas protocolos <code>http://</code> e <code>https://</code> são permitidos. Endereços locais (localhost, 127.0.0.1), redes privadas (10.0.0.0/8, 192.168.0.0/16, etc.) e endpoints de metadados de nuvem são estritamente bloqueados pelo servidor.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="target-name" className="form-label">
              Nome do Alvo <span aria-hidden="true" style={{ color: '#ef4444' }}>*</span>
            </label>
            <p className="form-hint" id="target-name-hint">
              Nome de referência para identificar este site ou aplicação.
            </p>
            <input
              id="target-name"
              type="text"
              className="form-input"
              required
              aria-describedby="target-name-hint"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Portal Principal — Versão Web"
            />
          </div>

          <div className="form-group">
            <label htmlFor="start-url" className="form-label">
              URL Inicial de Auditoria <span aria-hidden="true" style={{ color: '#ef4444' }}>*</span>
            </label>
            <p className="form-hint" id="start-url-hint">
              URL pública completa acessível pela internet, iniciando com https:// ou http://
            </p>
            <input
              id="start-url"
              type="url"
              className="form-input"
              required
              aria-describedby="start-url-hint"
              value={startUrl}
              onChange={(e) => setStartUrl(e.target.value)}
              placeholder="https://exemplo.gov.br"
            />
          </div>

          <div className="form-group">
            <label htmlFor="target-desc" className="form-label">
              Notas do Alvo (Opcional)
            </label>
            <textarea
              id="target-desc"
              className="form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Informações adicionais, ambiente de homologação ou particularidades..."
            />
          </div>

          <div className="form-group" style={{ marginTop: '1.5rem', background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                className="form-checkbox"
                required
                checked={authorizationConfirmed}
                onChange={(e) => setAuthorizationConfirmed(e.target.checked)}
              />
              <span>
                <strong>Confirmação de Autorização Formal (Obrigatória):</strong><br />
                Declaro expressamente que a equipe de auditoria possui autorização formal dos proprietários ou responsáveis legais pelo alvo para executar varreduras automatizadas e testes de acessibilidade neste endereço.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !authorizationConfirmed || !startUrl.trim() || !name.trim()}
            >
              {loading ? 'Validando e cadastrando...' : 'Cadastrar Alvo Autorizado'}
            </button>
            <Link href={`/projects/${projectId}`} className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

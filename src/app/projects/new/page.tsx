'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.createProject({
        name,
        description: description.trim() ? description : undefined,
      });

      if (res.data?.id) {
        router.push(`/projects/${res.data.id}`);
      } else {
        router.push('/projects');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao criar projeto.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '640px', margin: '2rem auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/projects" style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none' }}>
          ← Voltar para Projetos
        </Link>
      </div>

      <div className="card">
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Criar Projeto de Auditoria</h1>
        <p className="lead-text">
          Defina o escopo institucional para agrupar alvos e relatórios de conformidade.
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Nome do Projeto <span aria-hidden="true" style={{ color: '#ef4444' }}>*</span>
            </label>
            <p className="form-hint" id="name-hint">
              Identificação clara do sistema, portal ou serviço que será auditado.
            </p>
            <input
              id="name"
              type="text"
              className="form-input"
              required
              aria-describedby="name-hint"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Portal de Serviços ao Cidadão"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Descrição do Escopo (Opcional)
            </label>
            <p className="form-hint" id="desc-hint">
              Objetivo da auditoria, áreas prioritárias e contexto institucional.
            </p>
            <textarea
              id="description"
              className="form-textarea"
              rows={4}
              aria-describedby="desc-hint"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o contexto, secretarias envolvidas ou motivação da auditoria..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Salvando...' : 'Criar Projeto'}
            </button>
            <Link href="/projects" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

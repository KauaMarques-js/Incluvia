'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError, errorMessage } from '@/lib/api-client';
import { PageHeader } from '@/components/PageHeader';
import { Field, firstErrors } from '@/components/Field';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setFieldErrors({ name: 'Informe um nome com pelo menos 2 caracteres.' });
      return;
    }
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await api.createProject({ name: name.trim(), description: description.trim() || undefined });
      router.push(`/projects/${res.data.id}`);
    } catch (err) {
      setError(errorMessage(err, 'Falha ao criar projeto.'));
      if (err instanceof ApiError) setFieldErrors(firstErrors(err.fields));
      setSaving(false);
    }
  }

  return (
    <div className="narrow">
      <PageHeader
        title="Novo projeto"
        breadcrumbs={[{ label: 'Projetos', href: '/projects' }, { label: 'Novo projeto' }]}
        description="Um projeto agrupa os sites que serão auditados e as avaliações de respostas de IA de um mesmo contexto."
      />

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <Field
          id="name"
          label="Nome do projeto"
          required
          hint="Identifique o sistema, portal ou serviço. Ex.: Portal de Serviços ao Cidadão."
          error={fieldErrors.name}
        >
          {(props) => (
            <input {...props} type="text" className="form-input" maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
          )}
        </Field>

        <Field
          id="description"
          label="Descrição do escopo"
          hint="Objetivo da auditoria, áreas prioritárias e contexto institucional."
          error={fieldErrors.description}
        >
          {(props) => (
            <textarea
              {...props}
              className="form-textarea"
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
        </Field>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Criando…' : 'Criar projeto'}
          </button>
          <Link href="/projects" className="btn btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

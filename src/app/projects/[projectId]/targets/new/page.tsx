'use client';

import { useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError, errorMessage } from '@/lib/api-client';
import { useResource } from '@/lib/use-resource';
import { PageHeader } from '@/components/PageHeader';
import { Field, firstErrors } from '@/components/Field';

function validate(name: string, startUrl: string, authorized: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  if (name.trim().length < 2) errors.name = 'Informe um nome com pelo menos 2 caracteres.';
  if (!/^https?:\/\/\S+$/i.test(startUrl.trim())) errors.startUrl = 'Informe uma URL completa iniciando com https:// ou http://.';
  if (!authorized) errors.authorizationConfirmed = 'Confirme a autorização formal para continuar.';
  return errors;
}

export default function NewTargetPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project } = useResource(() => api.getProject(projectId), [projectId]);

  const [name, setName] = useState('');
  const [startUrl, setStartUrl] = useState('');
  const [description, setDescription] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const localErrors = validate(name, startUrl, authorized);
    setFieldErrors(localErrors);
    if (Object.keys(localErrors).length > 0) {
      setError('Corrija os campos destacados.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await api.createTarget(projectId, {
        name: name.trim(),
        startUrl: startUrl.trim(),
        description: description.trim() || undefined,
        authorizationConfirmed: true,
      });
      router.push(`/targets/${res.data.id}`);
    } catch (err) {
      const message = errorMessage(err, 'Falha ao cadastrar alvo.');
      setError(message);
      if (err instanceof ApiError) {
        // Bloqueios anti-SSRF chegam sem campo: o problema é sempre a URL.
        setFieldErrors(err.code === 'SSRF_BLOCKED' ? { startUrl: message } : firstErrors(err.fields));
      }
      setSaving(false);
    }
  }

  const projectName = project?.name ?? 'Projeto';

  return (
    <div className="narrow">
      <PageHeader
        title="Cadastrar alvo web"
        breadcrumbs={[
          { label: 'Projetos', href: '/projects' },
          { label: projectName, href: `/projects/${projectId}` },
          { label: 'Novo alvo' },
        ]}
        description="Informe o site que será auditado e confirme a autorização. A auditoria percorre apenas páginas do mesmo host."
      />

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <Field id="name" label="Nome do alvo" required hint="Ex.: Portal principal — versão web." error={fieldErrors.name}>
          {(props) => (
            <input {...props} type="text" className="form-input" maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
          )}
        </Field>

        <Field
          id="startUrl"
          label="URL inicial"
          required
          hint="Endereço público iniciando com https:// ou http://. Ex.: https://exemplo.gov.br"
          error={fieldErrors.startUrl}
        >
          {(props) => (
            <input
              {...props}
              type="url"
              inputMode="url"
              autoComplete="url"
              className="form-input"
              value={startUrl}
              onChange={(e) => setStartUrl(e.target.value)}
            />
          )}
        </Field>

        <Field id="description" label="Notas" hint="Ambiente, particularidades ou páginas prioritárias." error={fieldErrors.description}>
          {(props) => (
            <textarea
              {...props}
              className="form-textarea"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
        </Field>

        <div className="alert alert-info">
          <p>
            <strong>Limites de segurança:</strong> endereços locais (localhost, 127.0.0.1), redes privadas e endpoints de
            metadados de nuvem são bloqueados pelo servidor, inclusive após redirecionamentos.
          </p>
        </div>

        <div className="form-group">
          <label className="form-check">
            <input
              type="checkbox"
              checked={authorized}
              aria-invalid={fieldErrors.authorizationConfirmed ? true : undefined}
              aria-describedby={fieldErrors.authorizationConfirmed ? 'authorization-error' : undefined}
              onChange={(e) => setAuthorized(e.target.checked)}
            />
            <span>
              <strong>Tenho autorização formal para auditar este endereço (obrigatório).</strong>
              <br />
              Os responsáveis pelo site autorizaram varreduras automatizadas e testes de acessibilidade.
            </span>
          </label>
          {fieldErrors.authorizationConfirmed && (
            <p className="form-error" id="authorization-error">
              {fieldErrors.authorizationConfirmed}
            </p>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Validando endereço…' : 'Cadastrar alvo'}
          </button>
          <Link href={`/projects/${projectId}`} className="btn btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

import type { ReactNode } from 'react';

export interface ControlProps {
  id: string;
  required?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

interface FieldProps {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  /** Recebe os atributos de acessibilidade que devem ir para o controle. */
  children: (props: ControlProps) => ReactNode;
}

/**
 * Campo de formulário com rótulo, dica e erro associados ao controle (WCAG 1.3.1, 3.3.1, 3.3.2).
 */
export function Field({ id, label, hint, error, required, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label}
        {required ? <span className="form-required"> (obrigatório)</span> : <span className="form-optional"> (opcional)</span>}
      </label>
      {hint && (
        <p className="form-hint" id={hintId}>
          {hint}
        </p>
      )}
      {children({ id, required, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {error && (
        <p className="form-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

/** Primeiro erro de cada campo vindo do servidor (`details.fields`) ou da validação local. */
export function firstErrors(fields: Record<string, string[] | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fields)
      .filter(([, messages]) => messages && messages.length > 0)
      .map(([key, messages]) => [key, messages![0]])
  );
}

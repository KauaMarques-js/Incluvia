'use client';

import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/Modal';
import { ImpactBadge } from '@/components/Badges';
import { errorMessage, type ReviewInput } from '@/lib/api-client';
import { REVIEW_HINT, REVIEW_LABEL } from '@/lib/labels';
import type { ReviewableFinding } from '@/lib/types';

const REVIEW_OPTIONS = ['confirmed', 'false_positive', 'needs_context', 'fixed', 'unreviewed'];

interface ReviewDialogProps {
  finding: ReviewableFinding | null;
  onClose: () => void;
  onSave: (findingId: string, input: ReviewInput) => Promise<unknown>;
  onSaved: () => void;
}

/** Revisão humana (RF-06), compartilhada entre achados web e achados de IA. */
export function ReviewDialog({ finding, onClose, onSave, onSaved }: ReviewDialogProps) {
  return (
    <Modal open={finding !== null} title="Revisão humana do achado" onClose={onClose}>
      {finding && <ReviewForm key={finding.id} finding={finding} onClose={onClose} onSave={onSave} onSaved={onSaved} />}
    </Modal>
  );
}

function ReviewForm({ finding, onClose, onSave, onSaved }: ReviewDialogProps & { finding: ReviewableFinding }) {
  const [status, setStatus] = useState(finding.reviewStatus === 'unreviewed' ? 'confirmed' : finding.reviewStatus);
  const [note, setNote] = useState(finding.reviewNote ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(finding.id, { reviewStatus: status, reviewNote: note.trim() });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Falha ao salvar a revisão.'));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="dialog-context">
        <ImpactBadge impact={finding.impact} /> <code className="inline-code">{finding.ruleId}</code>
        <br />
        <strong>{finding.title}</strong>
      </p>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <fieldset className="form-group radio-group">
        <legend className="form-label">Classificação</legend>
        <div>
          {REVIEW_OPTIONS.map((option) => (
            <label key={option} className="radio-option">
              <input
                type="radio"
                name="reviewStatus"
                value={option}
                checked={status === option}
                data-autofocus={status === option ? true : undefined}
                onChange={() => setStatus(option)}
              />
              <span>
                <strong>{REVIEW_LABEL[option]}</strong>
                <span className="radio-hint">{REVIEW_HINT[option]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-group">
        <label htmlFor="review-note" className="form-label">
          Nota da revisão <span className="form-optional">(opcional)</span>
        </label>
        <p className="form-hint" id="review-note-hint">
          Impacto para tecnologias assistivas, exceções ou orientação de correção. Não inclua dados pessoais.
        </p>
        <textarea
          id="review-note"
          className="form-textarea"
          rows={3}
          maxLength={2000}
          aria-describedby="review-note-hint"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="form-actions form-actions-end">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar revisão'}
        </button>
      </div>
    </form>
  );
}

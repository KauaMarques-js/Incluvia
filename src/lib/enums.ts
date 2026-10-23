export const UserRole = {
  admin: 'admin',
  auditor: 'auditor',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ProjectStatus = {
  active: 'active',
  archived: 'archived',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const AuditRunStatus = {
  queued: 'queued',
  running: 'running',
  completed: 'completed',
  failed: 'failed',
  cancelled: 'cancelled',
} as const;
export type AuditRunStatus = (typeof AuditRunStatus)[keyof typeof AuditRunStatus];

export const FindingImpact = {
  critical: 'critical',
  serious: 'serious',
  moderate: 'moderate',
  minor: 'minor',
  unknown: 'unknown',
} as const;
export type FindingImpact = (typeof FindingImpact)[keyof typeof FindingImpact];

export const AbleismCategory = {
  paternalism: 'paternalism',
  presumed_incapacity: 'presumed_incapacity',
  tragedy: 'tragedy',
  medical_model: 'medical_model',
  segregation: 'segregation',
  stereotype: 'stereotype',
  access_denial: 'access_denial',
  invisibility: 'invisibility',
  needs_human_review: 'needs_human_review',
} as const;
export type AbleismCategory = (typeof AbleismCategory)[keyof typeof AbleismCategory];

export const ReviewStatus = {
  unreviewed: 'unreviewed',
  confirmed: 'confirmed',
  false_positive: 'false_positive',
  needs_context: 'needs_context',
  fixed: 'fixed',
} as const;
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

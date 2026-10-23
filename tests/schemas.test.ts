import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  createProjectSchema,
  createTargetSchema,
  startAuditSchema,
  reviewFindingSchema,
} from '../src/lib/schemas';

describe('Validation Schemas (Zod)', () => {
  describe('loginSchema', () => {
    it('should validate valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'AUDITOR@Incluvia.LOCAL ',
        password: 'Password123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('auditor@Incluvia.local');
      }
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createProjectSchema', () => {
    it('should accept valid project data', () => {
      const result = createProjectSchema.safeParse({
        name: 'Portal Cidadão',
        description: 'Auditoria de acessibilidade',
      });
      expect(result.success).toBe(true);
    });

    it('should reject project name shorter than 2 chars', () => {
      const result = createProjectSchema.safeParse({
        name: 'A',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createTargetSchema', () => {
    it('should accept valid target with confirmed authorization', () => {
      const result = createTargetSchema.safeParse({
        name: 'Portal Principal',
        startUrl: 'https://exemplo.gov.br',
        authorizationConfirmed: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject target if authorization is false', () => {
      const result = createTargetSchema.safeParse({
        name: 'Portal Principal',
        startUrl: 'https://exemplo.gov.br',
        authorizationConfirmed: false,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid startUrl', () => {
      const result = createTargetSchema.safeParse({
        name: 'Portal Principal',
        startUrl: 'not-a-url',
        authorizationConfirmed: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('startAuditSchema', () => {
    it('should enforce reasonable defaults and bounds', () => {
      const res = startAuditSchema.parse({});
      expect(res.maxPages).toBe(20);
      expect(res.maxDepth).toBe(3);

      const invalid = startAuditSchema.safeParse({ maxPages: 999 });
      expect(invalid.success).toBe(false);
    });
  });

  describe('reviewFindingSchema', () => {
    it('should accept valid review status', () => {
      const res = reviewFindingSchema.safeParse({
        reviewStatus: 'confirmed',
        reviewNote: 'Confirmado após teste com NVDA.',
      });
      expect(res.success).toBe(true);
    });

    it('should reject invalid review status', () => {
      const res = reviewFindingSchema.safeParse({
        reviewStatus: 'arbitrary_status',
      });
      expect(res.success).toBe(false);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { validateAuditUrl } from '../src/lib/url-validator';

describe('URL Validator & Anti-SSRF Protections (RF-03, RNF-02)', () => {
  it('should accept valid public HTTPS URLs', async () => {
    const res = await validateAuditUrl('https://example.com');
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('should reject non-HTTP protocols', async () => {
    const ftp = await validateAuditUrl('ftp://example.com/file');
    expect(ftp.valid).toBe(false);
    expect(ftp.error).toContain('não permitido. Use http ou https');

    const file = await validateAuditUrl('file:///etc/passwd');
    expect(file.valid).toBe(false);

    const js = await validateAuditUrl('javascript:alert(1)');
    expect(js.valid).toBe(false);
  });

  it('should block localhost and loopback addresses', async () => {
    const localhost = await validateAuditUrl('http://localhost:3000');
    expect(localhost.valid).toBe(false);
    expect(localhost.error).toContain('endereços locais ou de metadados');

    const loopback = await validateAuditUrl('http://127.0.0.1');
    expect(loopback.valid).toBe(false);

    const ipv6Loopback = await validateAuditUrl('http://[::1]');
    expect(ipv6Loopback.valid).toBe(false);
  });

  it('should block RFC 1918 private IPv4 networks', async () => {
    const classA = await validateAuditUrl('http://10.0.0.1');
    expect(classA.valid).toBe(false);

    const classB = await validateAuditUrl('http://172.16.0.50');
    expect(classB.valid).toBe(false);

    const classC = await validateAuditUrl('http://192.168.1.1');
    expect(classC.valid).toBe(false);
  });

  it('should block cloud provider metadata IP (169.254.169.254)', async () => {
    const metadata = await validateAuditUrl('http://169.254.169.254/latest/meta-data/');
    expect(metadata.valid).toBe(false);
    expect(metadata.error).toContain('privada ou reservada');
  });

  it('should block unauthorized or dangerous service ports', async () => {
    const sshPort = await validateAuditUrl('http://example.com:22');
    expect(sshPort.valid).toBe(false);
    expect(sshPort.error).toContain('Porta');

    const dbPort = await validateAuditUrl('http://example.com:5432');
    expect(dbPort.valid).toBe(false);
  });

  it('should reject malformed URLs', async () => {
    const malformed = await validateAuditUrl('not-a-url');
    expect(malformed.valid).toBe(false);
    expect(malformed.error).toBeDefined();
  });
});

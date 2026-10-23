import { lookup } from 'dns/promises';
import { AppError } from '@/lib/errors';

const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const ALLOWED_PORTS = new Set([80, 443, 8080, 8443, 3000, 5000]);

/**
 * Private/reserved IPv4 ranges that must be blocked to prevent SSRF.
 */
const BLOCKED_IPV4_RANGES = [
  { prefix: '127.', label: 'loopback' },
  { prefix: '10.', label: 'private (10.x)' },
  { prefix: '192.168.', label: 'private (192.168.x)' },
  { prefix: '169.254.', label: 'link-local' },
  { prefix: '0.', label: 'unspecified' },
  { prefix: '100.64.', label: 'shared address space' },
  { prefix: '198.18.', label: 'benchmark' },
  { prefix: '198.19.', label: 'benchmark' },
];

/**
 * Cloud metadata endpoints that must be blocked.
 */
const CLOUD_METADATA_IPS = ['169.254.169.254', 'fd00:ec2::254'];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata.google.com',
];

function is172Private(ip: string): boolean {
  const parts = ip.split('.');
  if (parts[0] !== '172') return false;
  const second = parseInt(parts[1], 10);
  return second >= 16 && second <= 31;
}

function isBlockedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === '::1' ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized === '::' ||
    CLOUD_METADATA_IPS.includes(normalized)
  );
}

function isBlockedIP(ip: string): boolean {
  if (CLOUD_METADATA_IPS.includes(ip)) return true;
  if (ip.includes(':')) return isBlockedIPv6(ip);

  for (const range of BLOCKED_IPV4_RANGES) {
    if (ip.startsWith(range.prefix)) return true;
  }
  return is172Private(ip);
}

export interface UrlValidationResult {
  valid: boolean;
  url?: URL;
  error?: string;
}

/**
 * Validates a URL for safety before allowing the audit engine to navigate to it.
 * Implements SSRF protection per section 11 of the architecture doc.
 *
 * Checks:
 * - Protocol (http/https only)
 * - No file://, ftp://, data:// etc.
 * - Port restrictions
 * - No localhost, private IPs, link-local, cloud metadata
 * - DNS resolution to verify the target IP is not private
 */
export async function validateAuditUrl(
  rawUrl: string
): Promise<UrlValidationResult> {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    return { valid: false, error: 'URL inválida.' };
  }

  // Protocol check
  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return {
      valid: false,
      error: `Protocolo "${url.protocol}" não permitido. Use http ou https.`,
    };
  }

  // Hostname check
  const hostname = url.hostname.toLowerCase();

  if (!hostname || hostname.length === 0) {
    return { valid: false, error: 'URL deve conter um hostname válido.' };
  }

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return {
      valid: false,
      error: 'Não é permitido auditar endereços locais ou de metadados.',
    };
  }

  // Direct IP check (if hostname is an IP)
  if (isBlockedIP(hostname)) {
    return {
      valid: false,
      error: 'Endereço IP pertence a uma faixa privada ou reservada.',
    };
  }

  // Port check
  if (url.port) {
    const port = parseInt(url.port, 10);
    if (!ALLOWED_PORTS.has(port)) {
      return {
        valid: false,
        error: `Porta ${port} não permitida.`,
      };
    }
  }

  // No credentials in URL
  if (url.username || url.password) {
    return {
      valid: false,
      error: 'URL não deve conter credenciais.',
    };
  }

  // DNS resolution check — resolve hostname and verify IP is not private
  try {
    const { address } = await lookup(hostname);
    if (isBlockedIP(address)) {
      return {
        valid: false,
        error:
          'O hostname resolve para um endereço privado ou reservado. Auditoria não permitida.',
      };
    }
  } catch {
    return {
      valid: false,
      error: 'Não foi possível resolver o hostname. Verifique a URL.',
    };
  }

  return { valid: true, url };
}

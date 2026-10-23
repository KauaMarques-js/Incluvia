import { chromium, Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { validateAuditUrl } from './url-validator';
import { FindingImpact } from './enums';

export interface AuditEngineConfig {
  startUrl: string;
  maxPages?: number;
  maxDepth?: number;
  timeoutMs?: number;
}

export interface RawFinding {
  ruleId: string;
  title: string;
  description: string;
  impact: FindingImpact;
  pageUrl: string;
  elementSelector?: string;
  helpUrl?: string;
}

export interface AuditEngineResult {
  toolVersion: string;
  pagesAudited: number;
  findings: RawFinding[];
  errors: string[];
}

function mapAxeImpact(impact?: string | null): FindingImpact {
  switch (impact?.toLowerCase()) {
    case 'critical':
      return FindingImpact.critical;
    case 'serious':
      return FindingImpact.serious;
    case 'moderate':
      return FindingImpact.moderate;
    case 'minor':
      return FindingImpact.minor;
    default:
      return FindingImpact.unknown;
  }
}

/**
 * Normalizes and extracts safe links from a page that belong to the same hostname.
 */
async function extractSameOriginLinks(page: Page, baseOrigin: string): Promise<string[]> {
  try {
    const hrefs = await page.$$eval('a[href]', (anchors) =>
      anchors.map((a) => (a as HTMLAnchorElement).href)
    );

    const safeUrls = new Set<string>();
    const baseHost = new URL(baseOrigin).hostname.toLowerCase();

    for (const href of hrefs) {
      try {
        const parsed = new URL(href);
        // Only http and https
        if (!['http:', 'https:'].includes(parsed.protocol)) continue;
        // Same hostname
        if (parsed.hostname.toLowerCase() !== baseHost) continue;
        // Strip hash / query duplicates
        parsed.hash = '';
        safeUrls.add(parsed.toString());
      } catch {
        // Ignore invalid URLs
      }
    }

    return Array.from(safeUrls);
  } catch {
    return [];
  }
}

/**
 * Runs the accessibility audit on the target URL up to maxPages/maxDepth using Playwright & axe-core.
 */
export async function runAuditEngine(config: AuditEngineConfig): Promise<AuditEngineResult> {
  const maxPages = config.maxPages ?? 20;
  const maxDepth = config.maxDepth ?? 3;
  const timeoutMs = config.timeoutMs ?? 120000;

  // SSRF check on startUrl
  const initialCheck = await validateAuditUrl(config.startUrl);
  if (!initialCheck.valid) {
    throw new Error(`Validação de segurança falhou: ${initialCheck.error}`);
  }

  const baseOrigin = new URL(config.startUrl).origin;
  const findings: RawFinding[] = [];
  const errors: string[] = [];

  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: config.startUrl, depth: 0 }];

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  } catch (launchErr: any) {
    throw new Error(`Falha ao iniciar navegador do motor de auditoria: ${launchErr?.message || launchErr}`);
  }

  const context = await browser.newContext({
    userAgent: 'Incluvia-Audit-Engine/1.0 (+https://Incluvia.local/bot; Security & Accessibility Audit)',
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: false,
  });

  const startTime = Date.now();

  try {
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    while (queue.length > 0 && visited.size < maxPages) {
      if (Date.now() - startTime > timeoutMs) {
        errors.push(`Tempo limite total de ${timeoutMs}ms atingido.`);
        break;
      }

      const current = queue.shift()!;
      if (visited.has(current.url)) continue;
      if (current.depth > maxDepth) continue;

      // Re-validate URL destination (prevent DNS rebinding / redirect SSRF)
      const safetyCheck = await validateAuditUrl(current.url);
      if (!safetyCheck.valid) {
        errors.push(`URL ignorada por política de segurança: ${current.url}`);
        continue;
      }

      visited.add(current.url);

      try {
        const response = await page.goto(current.url, {
          waitUntil: 'domcontentloaded',
          timeout: 25000,
        });

        if (!response) {
          errors.push(`Sem resposta da página: ${current.url}`);
          continue;
        }

        // Validate final URL after redirects
        const finalUrl = page.url();
        const redirectCheck = await validateAuditUrl(finalUrl);
        if (!redirectCheck.valid) {
          errors.push(`Redirecionamento bloqueado por segurança: ${finalUrl}`);
          continue;
        }

        // Run axe-core
        const axeResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();

        for (const violation of axeResults.violations) {
          const impact = mapAxeImpact(violation.impact);
          const helpUrl = violation.helpUrl;

          if (violation.nodes && violation.nodes.length > 0) {
            for (const node of violation.nodes) {
              const selector = Array.isArray(node.target)
                ? node.target.join(' ')
                : String(node.target ?? '');

              findings.push({
                ruleId: violation.id,
                title: violation.help,
                description: node.failureSummary || violation.description,
                impact,
                pageUrl: current.url,
                elementSelector: selector.slice(0, 500),
                helpUrl,
              });
            }
          } else {
            findings.push({
              ruleId: violation.id,
              title: violation.help,
              description: violation.description,
              impact,
              pageUrl: current.url,
              helpUrl,
            });
          }
        }

        // Extract more links if within depth limit
        if (current.depth < maxDepth && visited.size < maxPages) {
          const nextUrls = await extractSameOriginLinks(page, baseOrigin);
          for (const nextUrl of nextUrls) {
            if (!visited.has(nextUrl) && !queue.some((q) => q.url === nextUrl)) {
              queue.push({ url: nextUrl, depth: current.depth + 1 });
            }
          }
        }
      } catch (pageErr: any) {
        errors.push(`Erro ao auditar ${current.url}: ${pageErr?.message || pageErr}`);
      }
    }

    await page.close();
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  return {
    toolVersion: 'axe-core 4.10 / Playwright 1.48 (WCAG 2.2 AA)',
    pagesAudited: visited.size,
    findings,
    errors,
  };
}

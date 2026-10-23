'use client';

import Script from 'next/script';

/**
 * VLibras Widget (Governo Federal) — tradução de conteúdo para Libras.
 * Integração oficial: https://vlibras.gov.br/doc/widget/installation/webpageintegration.html
 *
 * Montado uma vez no layout raiz. `next/script` não reinjeta o mesmo `src`, e o próprio
 * plugin ignora inicializações repetidas, então não há widget duplicado na navegação.
 */
const VLIBRAS_ROOT = 'https://vlibras.gov.br/app';

interface VLibrasGlobal {
  VLibras?: { Widget: new (options: { rootPath: string; position?: 'L' | 'R' }) => unknown };
  VLibrasWidget?: { access?: HTMLElement };
}

/**
 * O botão padrão fica no meio da borda direita e, no celular, encobre controles da página.
 * Aqui ele vai para o espaço reservado no canto do cabeçalho (variáveis --vlibras-* em globals.css).
 */
function placeAccessButton(access: HTMLElement) {
  access.style.top = 'var(--vlibras-top)';
  access.style.right = 'var(--vlibras-right)';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    access.style.transition = 'none';
  }
}

function initVLibras() {
  const w = window as unknown as VLibrasGlobal;
  if (!w.VLibras) return;
  // Inicializa de imediato (o plugin só se inicializaria sozinho 50 ms depois); chamadas repetidas são ignoradas.
  new w.VLibras.Widget({ rootPath: VLIBRAS_ROOT, position: 'R' });
  if (w.VLibrasWidget?.access) placeAccessButton(w.VLibrasWidget.access);
}

export function VLibrasWidget() {
  return (
    <Script
      id="vlibras-plugin"
      src={`${VLIBRAS_ROOT}/vlibras-plugin.js`}
      strategy="afterInteractive"
      onReady={initVLibras}
    />
  );
}

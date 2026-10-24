/**
 * Grava o vídeo de pitch da Incluvia (fluxo do auditor) em MP4 1920x1080.
 *
 * Como funciona: o Edge executa o fluxo pelo Playwright; o screencast do DevTools
 * envia os quadros para uma página "gravadora" que desenha cada quadro e o cursor
 * num <canvas> e grava com MediaRecorder (H.264). Não precisa de ffmpeg.
 *
 * Uso (com o app rodando, ex.: `npx next start -p 3100`):
 *   node pitch/gravar-video.cjs http://localhost:3100
 *
 * Saídas: pitch/incluvia-pitch.mp4 e pitch/marcacoes.json (início de cada cena).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));

const BASE = process.argv[2] || 'http://localhost:3100';
const OUT_DIR = __dirname;
const VIDEO = path.join(OUT_DIR, 'incluvia-pitch.mp4');
const MARKS = path.join(OUT_DIR, 'marcacoes.json');
const VIEW = { width: 1280, height: 720 };
const SCALE = 1.5; // 1280x720 em 1,5x = quadros 1920x1080

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Página gravadora ────────────────────────────────────────────────────────

const RECORDER_HTML = `<!doctype html><html><body style="margin:0;background:#000">
<canvas id="c" width="1920" height="1080"></canvas>
<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let frame = null, cursor = { x: -50, y: -50 }, clickAt = 0;
window.__frame = async (b64) => {
  const blob = await (await fetch('data:image/jpeg;base64,' + b64)).blob();
  const bmp = await createImageBitmap(blob);
  if (frame) frame.close();
  frame = bmp;
};
window.__cursor = (x, y, click) => { cursor = { x, y }; if (click) clickAt = performance.now(); };
function drawCursor() {
  const { x, y } = cursor;
  const since = performance.now() - clickAt;
  if (since < 450) {
    const r = 18 + since / 12;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(90,176,240,' + (1 - since / 450) + ')'; ctx.lineWidth = 4; ctx.stroke();
  }
  ctx.save(); ctx.translate(x, y); ctx.scale(1.6, 1.6);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 17); ctx.lineTo(4.5, 13); ctx.lineTo(7.5, 20);
  ctx.lineTo(10, 19); ctx.lineTo(7, 12.5); ctx.lineTo(12.5, 12.5); ctx.closePath();
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
}
setInterval(() => { if (frame) ctx.drawImage(frame, 0, 0, 1920, 1080); drawCursor(); }, 1000 / 30);

window.__start = () => {
  const types = ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1.4d0028', 'video/mp4;codecs=avc1', 'video/webm;codecs=vp9'];
  const mimeType = types.find((t) => MediaRecorder.isTypeSupported(t));
  const rec = new MediaRecorder(canvas.captureStream(30), { mimeType, videoBitsPerSecond: 10_000_000 });
  let chain = Promise.resolve();
  rec.ondataavailable = (e) => {
    chain = chain.then(() => new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(window.__save(String(fr.result).split(',')[1] || ''));
      fr.readAsDataURL(e.data);
    }));
  };
  window.__stop = () => new Promise((res) => { rec.onstop = () => chain.then(res); rec.stop(); });
  rec.start(1000);
  return mimeType;
};
</script></body></html>`;

// ─── Roteiro ─────────────────────────────────────────────────────────────────

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge',
    args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  });

  const app = await browser.newContext({ viewport: VIEW, deviceScaleFactor: SCALE, locale: 'pt-BR' });
  // Em `next start` o cookie de sessão é `Secure` (correto em produção). Para gravar via http://localhost,
  // só neste navegador de gravação o atributo é removido da resposta de login. O app não é alterado.
  await app.route('**/api/v1/auth/login', async (route) => {
    const res = await route.fetch();
    const headers = { ...res.headers() };
    if (headers['set-cookie']) headers['set-cookie'] = headers['set-cookie'].replace(/;\s*Secure/gi, '');
    await route.fulfill({ response: res, headers });
  });
  const page = await app.newPage();

  // Pré-carrega o avatar do VLibras (cache do contexto) para a cena final não ficar em "carregando".
  const warm = await app.newPage();
  await warm.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await warm.waitForFunction(() => window.VLibrasWidget && window.VLibrasWidget.open);
  await warm.evaluate(() => window.VLibrasWidget.open());
  await warm.waitForTimeout(25000);
  await warm.evaluate(() => localStorage.removeItem('@vlibras-widget'));
  await warm.close();

  const recorderCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const recorder = await recorderCtx.newPage();
  if (fs.existsSync(VIDEO)) fs.unlinkSync(VIDEO);
  await recorder.exposeFunction('__save', (b64) => fs.appendFileSync(VIDEO, Buffer.from(b64, 'base64')));
  await recorder.setContent(RECORDER_HTML);

  const cdp = await app.newCDPSession(page);
  cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    await recorder.evaluate((d) => window.__frame(d), data).catch(() => {});
  });

  // Cursor desenhado na gravadora (fica visível inclusive sobre diálogos <dialog>).
  let mouse = { x: VIEW.width / 2, y: VIEW.height / 2 };
  const showCursor = (click = false) =>
    recorder.evaluate(([x, y, c]) => window.__cursor(x, y, c), [mouse.x * SCALE, mouse.y * SCALE, click]);

  async function moveTo(x, y, ms = 650) {
    const from = { ...mouse };
    const steps = Math.max(8, Math.round(ms / 25));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      mouse = { x: from.x + (x - from.x) * e, y: from.y + (y - from.y) * e };
      await page.mouse.move(mouse.x, mouse.y);
      await showCursor();
      await sleep(ms / steps);
    }
  }

  async function click(locator, { pause = 350 } = {}) {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    await moveTo(box.x + box.width / 2, box.y + box.height / 2);
    await sleep(pause);
    await showCursor(true);
    await locator.click();
    await sleep(250);
  }

  async function type(locator, text, delay = 55) {
    await click(locator, { pause: 150 });
    await locator.pressSequentially(text, { delay });
  }

  async function scroll(dy, steps = 14) {
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, dy / steps);
      await sleep(35);
    }
    await sleep(300);
  }

  const marks = [];
  let t0 = 0;
  const scene = (name) => {
    const s = ((Date.now() - t0) / 1000).toFixed(1);
    marks.push({ cena: name, inicio_s: Number(s) });
    console.log(`[${s}s] ${name}`);
  };

  // Começa deslogado no login (o middleware redireciona).
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  await sleep(600);
  await showCursor();
  const mime = await recorder.evaluate(() => window.__start());
  console.log('Formato:', mime);
  t0 = Date.now();

  // 1. Login
  scene('1. Login');
  await sleep(2000);
  await click(page.getByRole('button', { name: 'Auditor', exact: true }));
  await sleep(500);
  await click(page.getByRole('button', { name: 'Entrar', exact: true }));
  await page.waitForURL(BASE + '/');
  await page.getByRole('heading', { name: 'Auditorias recentes' }).waitFor();

  // 2. Painel
  scene('2. Painel');
  await sleep(2000);
  await moveTo(330, 225, 800);
  await sleep(1500);
  await scroll(900);
  await sleep(3000);
  await scroll(-900);

  // 3. Projeto
  scene('3. Projeto');
  await click(page.getByRole('link', { name: 'Projetos', exact: true }));
  await page.getByRole('heading', { name: 'Projetos', level: 1 }).waitFor();
  await sleep(800);
  await click(page.getByRole('link', { name: 'Auditoria Piloto — Portal Institucional' }));
  await page.getByRole('heading', { name: /Alvos web/ }).waitFor();
  await sleep(2500);

  // 4. Cadastro de alvo com bloqueio anti-SSRF
  scene('4. Cadastro de alvo (anti-SSRF)');
  await click(page.getByRole('link', { name: 'Cadastrar alvo web' }));
  await page.getByLabel(/Nome do alvo/).waitFor();
  await sleep(600);
  await type(page.getByLabel(/Nome do alvo/), 'Portal de Serviços — homologação', 40);
  await type(page.getByLabel(/URL inicial/), 'http://192.168.0.10', 45);
  await click(page.locator('.form-check input[type=checkbox]'));
  await click(page.getByRole('button', { name: 'Cadastrar alvo' }));
  await page.locator('#startUrl-error').waitFor();
  await sleep(3000);
  await page.getByLabel(/URL inicial/).fill('');
  await type(page.getByLabel(/URL inicial/), 'https://example.org', 45);
  await click(page.getByRole('button', { name: 'Cadastrar alvo' }));
  await page.getByRole('heading', { name: /Histórico de execuções/ }).waitFor();
  await sleep(1500);

  // 5. Preparar e iniciar auditoria
  scene('5. Preparar auditoria');
  await click(page.getByRole('button', { name: 'Nova auditoria' }));
  await page.getByRole('dialog').waitFor();
  await sleep(2800);
  await click(page.getByRole('button', { name: 'Iniciar auditoria' }));
  await page.getByText('Na fila.', { exact: false }).first().waitFor();
  await sleep(2500);

  // 6. Resultado de uma auditoria concluída
  scene('6. Resultados da auditoria');
  await click(page.getByRole('navigation', { name: 'Trilha de navegação' }).getByRole('link', { name: 'Auditoria Piloto — Portal Institucional' }));
  await click(page.getByRole('link', { name: 'Portal Exemplo' }));
  await click(page.getByRole('link', { name: /Ver resultados/ }).first());
  await page.getByRole('heading', { name: 'Resumo' }).waitFor();
  await sleep(1200);
  await moveTo(500, 300, 800);
  await sleep(2500);

  scene('6b. Filtro e revisão humana');
  const severity = page.getByLabel('Severidade');
  const sBox = await severity.boundingBox();
  await moveTo(sBox.x + sBox.width / 2, sBox.y + sBox.height / 2);
  await showCursor(true);
  await severity.selectOption('critical');
  await sleep(1200);
  await scroll(330);
  const finding = page.locator('article', { hasText: 'Campos de formulário devem ter rótulos' });
  await click(finding.getByRole('button', { name: /Revisar/ }));
  await page.getByRole('dialog').waitFor();
  await sleep(1500);
  await type(page.getByLabel(/Nota da revisão/), 'Confirmado com NVDA: o campo de busca é anunciado apenas como "editar".', 25);
  await sleep(400);
  await click(page.getByRole('button', { name: 'Salvar revisão' }));
  await sleep(1000);
  await scroll(-600);
  await sleep(2000);

  scene('6c. Relatório');
  await click(page.getByRole('button', { name: 'Prévia do relatório' }));
  await page.locator('dialog[open] pre').waitFor();
  await sleep(1200);
  const pre = await page.locator('dialog[open] pre').boundingBox();
  await moveTo(pre.x + pre.width / 2, pre.y + pre.height / 2);
  await scroll(700, 20);
  await sleep(1800);
  await click(page.getByRole('button', { name: /Fechar/ }));
  await sleep(600);

  // 7. Avaliação de IA: comparação pareada com o simulador de demonstração
  scene('7. Avaliação de IA — preparar');
  await click(page.getByRole('navigation', { name: 'Trilha de navegação' }).getByRole('link', { name: 'Auditoria Piloto — Portal Institucional' }));
  await click(page.getByRole('link', { name: 'Nova avaliação de IA' }));
  const scenarioSel = page.getByLabel(/Cenário de teste/);
  await scenarioSel.waitFor();
  await sleep(800);
  const scBox = await scenarioSel.boundingBox();
  await moveTo(scBox.x + scBox.width / 2, scBox.y + scBox.height / 2);
  await showCursor(true);
  await scenarioSel.selectOption('credit-wheelchair-user');
  await sleep(3000);
  await scroll(420);
  await sleep(4500);
  await scroll(430);
  await sleep(800);
  await click(page.locator('input[name=source][value=simulator]'));
  await sleep(2000);
  await click(page.getByRole('checkbox', { name: /dados pessoais/ }));
  await click(page.getByRole('button', { name: 'Executar avaliação' }));
  await page.getByRole('heading', { name: 'Comparação de desfechos' }).waitFor();

  scene('7b. Avaliação de IA — resultado');
  await sleep(1500);
  const verdict = await page.locator('.verdict').boundingBox();
  await scroll(verdict.y - 160);
  await moveTo(verdict.x + 60, verdict.y - (verdict.y - 160) + verdict.height / 2, 800);
  await sleep(4500);
  await scroll(380);
  await sleep(4000);
  await scroll(330);
  await sleep(4500);
  const firstResponse = page.locator('.response-items summary').first();
  await click(firstResponse);
  await sleep(4000);

  // 8. VLibras
  scene('8. VLibras');
  await click(page.getByRole('link', { name: 'Painel', exact: true }));
  await page.getByRole('heading', { name: 'Auditorias recentes' }).waitFor();
  await sleep(800);
  await click(page.locator('#vlibras-access-wrapper').locator('#vlibras-button'));
  await page.waitForFunction(() => document.getElementById('vlibras-app-root')?.dataset.active === 'true');
  // O avatar abre com uma saudação; "Pular" encerra e libera a tradução do texto clicado.
  const skip = page.getByRole('button', { name: /Pular/ });
  await skip.waitFor({ timeout: 20000 });
  await sleep(1000);
  await click(skip);
  await sleep(1000);
  await click(page.locator('.lead-text').first());
  await sleep(9500);

  scene('Fim');
  await sleep(1500);
  await cdp.send('Page.stopScreencast');
  await recorder.evaluate(() => window.__stop());
  fs.writeFileSync(MARKS, JSON.stringify({ duracao_s: marks.at(-1).inicio_s + 1.5, formato: mime, cenas: marks }, null, 2));
  console.log('Vídeo salvo em', VIDEO);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

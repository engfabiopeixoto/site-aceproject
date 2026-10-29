import { test, expect, type Page } from '@playwright/test';

const CDN = '**/@google/model-viewer@3.5.0/**';

/**
 * Stub do <model-viewer>: define o elemento e imita a API de materiais usada
 * pelo site (model.materials, setAlphaMode, setBaseColorFactor). O 'load' sai
 * logo depois de entrar na página.
 */
const STUB = `
class ModelViewerFalso extends HTMLElement {
  connectedCallback() {
    this.model = { materials: [
      { name: 'concreto', alphaMode: 'OPAQUE', setAlphaMode(m) { this.alphaMode = m; },
        pbrMetallicRoughness: { baseColorFactor: [0.5, 0.5, 0.48, 1], setBaseColorFactor(v) { this.baseColorFactor = v; } } },
      { name: 'casa', alphaMode: 'BLEND', setAlphaMode(m) { this.alphaMode = m; },
        pbrMetallicRoughness: { baseColorFactor: [0.7, 0.72, 0.75, 0.07], setBaseColorFactor(v) { this.baseColorFactor = v; } } },
    ] };
    setTimeout(() => this.dispatchEvent(new Event('load')), 50);
  }
}
customElements.define('model-viewer', ModelViewerFalso);`;

const visualizador = (page: Page) => page.locator('dialog.visualizador');
const modelo = (page: Page) => visualizador(page).locator('model-viewer');
const alfaDaCasa = (page: Page) => modelo(page).evaluate((m: any) =>
  m.model.materials.find((x: any) => x.name === 'casa').pbrMetallicRoughness.baseColorFactor[3]);

async function comStub(page: Page) {
  const pedidos: string[] = [];
  page.on('request', (r) => { if (/model-viewer|\.glb/.test(r.url())) pedidos.push(r.url()); });
  await page.route(CDN, (r) => r.fulfill({ contentType: 'text/javascript', body: STUB }));
  return pedidos;
}

async function abrirResidencia(page: Page) {
  const card = page.locator('#portfolio .obra', { hasText: 'Residência com piscina' });
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await page.locator('dialog.ampliacao .abrir-3d').click();
  return card;
}

test('nada de 3D no carregamento inicial', async ({ page }) => {
  const pedidos = await comStub(page);
  await page.goto('/');
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState('networkidle');
  expect(pedidos).toEqual([]);
  expect(await page.evaluate(() => customElements.get('model-viewer'))).toBeUndefined();
});

test('Demerval: "Explorar em 3D" na ficha carrega o model-viewer sob demanda com o modelo do portal', async ({ page }) => {
  const pedidos = await comStub(page);
  await page.goto('/');
  const botao = page.locator('#portfolio .caso .ficha').getByRole('button', { name: 'Explorar em 3D' });
  await botao.scrollIntoViewIfNeeded();
  await botao.click();
  await expect(visualizador(page)).toBeVisible();
  await expect(modelo(page)).toHaveAttribute('src', 'modelos/portal-demerval.glb');
  await expect(modelo(page)).toHaveAttribute('alt', 'Modelo 3D do portal: pilares de concreto e treliça metálica');
  await expect(modelo(page)).toHaveAttribute('camera-controls', '');
  await expect(modelo(page)).toHaveAttribute('touch-action', 'pan-y');
  await expect(modelo(page)).toHaveAttribute('auto-rotate', '');
  await expect(visualizador(page).locator('.dica-3d')).toHaveText('Arraste para girar · role ou pince para aproximar');
  await expect(visualizador(page).locator('.carregando')).toBeHidden();
  await expect(visualizador(page).locator('.alternar-casa')).toHaveCount(0);
  expect(pedidos.filter((u) => u.includes('model-viewer@3.5.0'))).toHaveLength(1);
  await page.keyboard.press('Escape');
  await expect(visualizador(page)).toBeHidden();
  await expect(botao).toBeFocused();
});

test('botão 3D só aparece na galeria das obras com modelo', async ({ page }) => {
  await comStub(page);
  await page.goto('/');
  const quadra = page.locator('#portfolio .obra', { hasText: 'Cobertura de quadra poliesportiva' });
  await quadra.scrollIntoViewIfNeeded();
  await quadra.click();
  await expect(page.locator('dialog.ampliacao')).toBeVisible();
  await expect(page.locator('dialog.ampliacao .abrir-3d')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await abrirResidencia(page);
  await expect(page.locator('dialog.ampliacao')).toBeHidden();
  await expect(modelo(page)).toHaveAttribute('src', 'modelos/residencia.glb');
});

test('residência: "Mostrar casa" começa ligado e alterna a transparência do material casa', async ({ page }) => {
  await comStub(page);
  await page.goto('/');
  const card = await abrirResidencia(page);
  const alternar = visualizador(page).locator('.alternar-casa');
  await expect(alternar).toHaveText('Mostrar casa');
  await expect(alternar).toHaveAttribute('aria-pressed', 'true');
  await expect(visualizador(page).locator('.carregando')).toBeHidden();
  expect(await alfaDaCasa(page)).toBeCloseTo(0.07);
  await alternar.click();
  await expect(alternar).toHaveAttribute('aria-pressed', 'false');
  expect(await alfaDaCasa(page)).toBe(0);
  await alternar.click();
  await expect(alternar).toHaveAttribute('aria-pressed', 'true');
  expect(await alfaDaCasa(page)).toBeCloseTo(0.07);
  await page.mouse.click(2, 2);
  await expect(visualizador(page)).toBeHidden();
  await expect(card).toBeFocused();
});

test.describe('movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });
  test('o modelo não gira sozinho', async ({ page }) => {
    await comStub(page);
    await page.goto('/');
    await page.locator('#portfolio .caso .ficha').getByRole('button', { name: 'Explorar em 3D' }).click();
    await expect(modelo(page)).toHaveAttribute('src', 'modelos/portal-demerval.glb');
    await expect(modelo(page)).not.toHaveAttribute('auto-rotate', /.*/);
  });
});

test('falha de rede mostra mensagem clara e não quebra a página', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.route(CDN, (r) => r.abort());
  await page.goto('/');
  await page.locator('#portfolio .caso .ficha').getByRole('button', { name: 'Explorar em 3D' }).click();
  await expect(visualizador(page).locator('.erro-3d')).toHaveText('Não foi possível carregar o modelo 3D.');
  await expect(visualizador(page).locator('.carregando')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(visualizador(page)).toBeHidden();
  // O resto da página segue funcionando: a galeria abre normalmente.
  await page.locator('#portfolio .obra').first().click();
  await expect(page.locator('dialog.ampliacao')).toBeVisible();
  expect(erros).toEqual([]);
});

test('residência abre com a câmera definida nos dados; o portal mantém o enquadramento automático', async ({ page, isMobile }) => {
  await comStub(page);
  await page.goto('/');
  await abrirResidencia(page);
  await expect(modelo(page)).toHaveAttribute('camera-target', '-8.8m 1.6m -9.5m');
  // Palco em retrato (celular) pede raio maior para a casa ocupar a mesma fração da largura.
  await expect(modelo(page)).toHaveAttribute('camera-orbit', isMobile ? '-20deg 35deg 74m' : '-20deg 35deg 51m');
  await expect(modelo(page)).toHaveAttribute('min-camera-orbit', 'auto 5deg 8m');
  await expect(modelo(page)).toHaveAttribute('max-camera-orbit', 'auto 85deg auto');
  await page.keyboard.press('Escape');

  await page.locator('#portfolio .caso .ficha').getByRole('button', { name: 'Explorar em 3D' }).click();
  await expect(modelo(page)).toHaveAttribute('src', 'modelos/portal-demerval.glb');
  for (const atributo of ['camera-target', 'camera-orbit', 'min-camera-orbit', 'max-camera-orbit', 'field-of-view'])
    await expect(modelo(page)).not.toHaveAttribute(atributo, /.*/);
});

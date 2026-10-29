import { test, expect, type Page } from '@playwright/test';

const comparador = (page: Page) => page.locator('#portfolio .caso .comparador');

async function abrir(page: Page) {
  await page.goto('/');
  await comparador(page).scrollIntoViewIfNeeded();
}

test('alça circular de 44 px fica centrada na linha e acompanha o corte', async ({ page }) => {
  await abrir(page);
  const alca = comparador(page).locator('.alca');
  await expect(alca).toBeVisible();
  await expect(alca).toHaveText('⇔');
  const centro = async () => { const c = (await alca.boundingBox())!; return { ...c, x: c.x + c.width / 2, y: c.y + c.height / 2 }; };
  const linha = async () => { const l = (await comparador(page).locator('.linha').boundingBox())!; return l.x + l.width / 2; };
  const a = await centro();
  expect(a.width).toBeGreaterThanOrEqual(44);
  expect(a.height).toBeGreaterThanOrEqual(44);
  expect(Math.abs(a.x - (await linha()))).toBeLessThanOrEqual(2);
  const caixa = (await comparador(page).boundingBox())!;
  expect(Math.abs(a.y - (caixa.y + caixa.height / 2))).toBeLessThanOrEqual(2);
  await expect(alca).not.toHaveCSS('box-shadow', 'none');

  await comparador(page).locator('input').fill('20');
  expect(Math.abs((await centro()).x - (await linha()))).toBeLessThanOrEqual(2);
  expect((await centro()).x).toBeLessThan(a.x);
});

test('teclado move a barra e anuncia as duas partes', async ({ page }) => {
  await abrir(page);
  const r = comparador(page).locator('input[type=range]');
  await expect(r).toHaveAttribute('aria-label', 'Comparar projeto e obra pronta');
  await expect(r).toHaveAttribute('aria-valuetext', 'Projeto 50% · Obra 50%');
  await r.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(r).toHaveValue('52');
  await expect(r).toHaveAttribute('aria-valuetext', 'Projeto 52% · Obra 48%');
  await expect(comparador(page).locator('.modelo')).toHaveCSS('clip-path', 'inset(0px 48% 0px 0px)');
});

test('dica sobre a imagem aparece até a primeira interação', async ({ page }) => {
  await abrir(page);
  const dica = comparador(page).locator('.dica-imagem');
  await expect(dica).toBeVisible();
  await expect(dica).toContainText('Arraste');
  await expect(page.locator('#portfolio .caso .ficha .dica')).toBeVisible();
  await comparador(page).locator('input').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(dica).toBeHidden();
});

test.describe('no toque', () => {
  test.beforeEach(({ isMobile }) => { test.skip(!isMobile, 'regras de pointer: coarse'); });

  test('tocar na imagem não move a barra nem captura a rolagem', async ({ page }) => {
    await abrir(page);
    const r = comparador(page).locator('input');
    await expect(r).toHaveCSS('pointer-events', 'none');
    const caixa = (await comparador(page).boundingBox())!;
    await page.touchscreen.tap(caixa.x + caixa.width * 0.15, caixa.y + caixa.height * 0.3);
    await expect(r).toHaveValue('50');
    await expect(comparador(page).locator('.alca')).toHaveCSS('touch-action', 'none');
  });

  test('arrastar pela alça move a barra', async ({ page }) => {
    await abrir(page);
    const caixa = (await comparador(page).boundingBox())!;
    const alca = (await comparador(page).locator('.alca').boundingBox())!;
    await page.mouse.move(alca.x + alca.width / 2, alca.y + alca.height / 2);
    await page.mouse.down();
    await page.mouse.move(caixa.x + caixa.width * 0.25, alca.y + alca.height / 2, { steps: 5 });
    await page.mouse.up();
    const valor = Number(await comparador(page).locator('input').inputValue());
    expect(valor).toBeGreaterThanOrEqual(23);
    expect(valor).toBeLessThanOrEqual(27);
    await expect(comparador(page).locator('.dica-imagem')).toBeHidden();
  });
});

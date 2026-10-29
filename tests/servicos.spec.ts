import { test, expect, type Page } from '@playwright/test';

test('mostra as 4 disciplinas principais, na ordem do topo', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#servicos .card h3')).toHaveText(['Estrutural', 'Hidrossanitário', 'Elétrico', 'Incêndio']);
  await expect(page.locator('#servicos .card').nth(1)).toContainText('Água fria, esgoto e águas pluviais.');
  await expect(page.locator('#servicos .card').nth(1).locator('.normas')).toHaveText('NBR 5626 · 8160 · 10844');
  await expect(page.locator('#servicos')).not.toContainText(/CBM aprov|aprovação no CBM|água quente/i);
});

test('lista as 3 disciplinas complementares', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#servicos .complementares li strong')).toHaveText(['SPDA', 'Gás GLP', 'Cabeamento estruturado']);
  await expect(page.locator('#servicos .complementares')).toContainText('NBR 5419:2026');
});

test('tipos de obra viram subtítulo e cartões não entram na ordem do teclado', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#servicos h2 + .tipos-obra')).toHaveText('Residenciais · Comerciais · Industriais');
  await expect(page.locator('#servicos .card[tabindex]')).toHaveCount(0);
});

/** Leva o mouse ao primeiro card de serviço, já revelado. */
async function passarSobreCard(page: Page) {
  await page.goto('/');
  const card = page.locator('#servicos .card').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveCSS('opacity', '1');
  await card.hover();
  return card;
}

test('card de serviço sob o mouse pulsa e sobe', async ({ page, isMobile }) => {
  test.skip(isMobile, 'efeito só de mouse; telas de toque não têm hover');
  const card = await passarSobreCard(page);
  await expect(card).toHaveCSS('border-color', 'rgb(109, 179, 132)');
  await expect(card).toHaveCSS('animation-name', 'pulsa');
  await expect(card).toHaveCSS('animation-duration', '2.4s');
  await expect(card).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, -4)');
});

test.describe('movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });
  test('card sob o mouse não anima', async ({ page, isMobile }) => {
    test.skip(isMobile, 'efeito só de mouse; telas de toque não têm hover');
    const card = await passarSobreCard(page);
    await expect(card).toHaveCSS('border-color', 'rgb(109, 179, 132)');
    await expect(card).toHaveCSS('animation-name', 'none');
    await expect(card).toHaveCSS('transition-duration', '0s');
    await expect(card).toHaveCSS('transform', 'none');
  });
});

test('grade com 4 colunas no desktop, 2 no tablet e 1 no celular', async ({ page }) => {
  const colunas = () => page.locator('#servicos .cards').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  await page.goto('/');
  for (const [largura, esperado] of [[1440, 4], [800, 2], [375, 1]] as const) {
    await page.setViewportSize({ width: largura, height: 900 });
    expect(await colunas()).toBe(esperado);
  }
});

test('título dos serviços destaca a compatibilização', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#servicos h2')).toHaveText(
    'Toda a engenharia da sua obra sendo projetada no mesmo lugar, compatibilidade total entre as disciplinas.');
});

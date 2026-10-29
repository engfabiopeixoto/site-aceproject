import { test, expect } from '@playwright/test';

test('botão do topo abre o WhatsApp com a mensagem', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('#topo [data-contato="whatsapp"]').getAttribute('href');
  const u = new URL(href!);
  expect(u.origin + u.pathname).toBe('https://wa.me/5586999029300');
  expect(u.searchParams.get('text')).toBe('Olá, ACE Project! Vim pelo site e gostaria de um orçamento.');
});

test('carrossel abre na quadra e troca para o Curralinhos a cada 6 s', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('.slide.ativo img')).toHaveAttribute('alt', /quadra/);
  await expect(page.locator('.legenda')).toContainText('quadra');
  await page.clock.runFor(6000);
  await expect(page.locator('.slide.ativo')).toHaveCount(1);
  await expect(page.locator('.legenda')).toContainText('Curralinhos');
});

test('cada slide usa o enquadramento de data-foco', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.slide[data-foco="center 70%"] img')).toHaveCSS('object-position', '50% 70%');
  await expect(page.locator('.slide[data-foco="center"] img')).toHaveCSS('object-position', '50% 50%');
});

test('pontos têm área de toque de 44 px e marcam o atual', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  const pontos = page.locator('#topo .pontos button');
  for (const p of await pontos.all()) {
    const caixa = await p.boundingBox();
    expect(caixa!.width).toBeGreaterThanOrEqual(44);
    expect(caixa!.height).toBeGreaterThanOrEqual(44);
  }
  await expect(pontos.nth(0)).toHaveAttribute('aria-current', 'true');
  await expect(pontos.nth(1)).not.toHaveAttribute('aria-current', /.*/);
  await pontos.nth(1).click();
  await expect(pontos.nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(pontos.nth(0)).not.toHaveAttribute('aria-current', /.*/);
  await expect(page.locator('.legenda')).toContainText('Curralinhos');
});

test('legenda do topo é legível', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a legenda some no celular');
  await page.goto('/');
  const legenda = page.locator('#topo .legenda');
  await expect(legenda).toHaveCSS('font-size', '13px');
  await expect(legenda).toHaveCSS('color', 'rgb(238, 238, 238)');
  await expect(legenda).toHaveCSS('background-color', 'rgba(0, 0, 0, 0.55)');
  await expect(page.locator('#topo h1')).toHaveCSS('text-wrap', /balance/);
});

test('números contam até o valor final', async ({ page }) => {
  await page.goto('/');
  await page.locator('.numeros').scrollIntoViewIfNeeded();
  await expect(page.locator('.numeros strong')).toHaveText(['2021', '50+', '10+', '24 h'], { timeout: 5000 });
  await expect(page.locator('.numeros span')).toHaveText(['Desde', 'Projetos entregues', 'Anos de experiência', 'Prazo de resposta']);
  await expect(page.locator('.numeros strong').first()).not.toHaveAttribute('data-contar', /.*/);
});

test.describe('movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });
  test('números já aparecem com o valor final', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-contar="50"]')).toHaveText('50+');
  });
});

test('texto do topo continua legível sem imagens', async ({ page }) => {
  await page.route('**/img/**', r => r.abort());
  await page.goto('/');
  await expect(page.locator('#topo h1')).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#topo')!).backgroundColor)).toBe('rgb(18, 18, 18)');
});

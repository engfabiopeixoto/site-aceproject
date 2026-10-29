import { test, expect } from '@playwright/test';

test('menu marca a seção visível', async ({ page, isMobile }) => {
  test.skip(isMobile, 'no celular o menu fica recolhido; coberto no desktop');
  await page.goto('/');
  await page.click('header a[href="#servicos"]');
  await expect(page.locator('header a[href="#servicos"]')).toHaveClass(/ativo/);
  await expect(page.locator('header a[href="#servicos"]')).toHaveAttribute('aria-current', 'true');
  await expect(async () => {
    const titulo = await page.locator('#servicos h2').boundingBox();
    const header = await page.locator('header').boundingBox();
    expect(titulo!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
  }).toPass();
});

test('Orçamento do menu abre o WhatsApp com a mensagem padrão, como os outros CTAs', async ({ page }) => {
  await page.goto('/');
  const cta = page.locator('header nav a.cta');
  await expect(cta).toHaveAttribute('data-contato', 'whatsapp');
  await expect(cta).toHaveAttribute('target', '_blank');
  await expect(cta).toHaveAttribute('rel', 'noopener');
  const href = new URL((await cta.getAttribute('href'))!);
  expect(href.origin + href.pathname).toBe('https://wa.me/5586999029300');
  expect(href.searchParams.get('text')).toBe('Olá, ACE Project! Vim pelo site e gostaria de um orçamento.');
  await expect(cta).toHaveCSS('background-color', 'rgb(109, 179, 132)');
});

test('com o contato na tela, nenhum item do menu fica ativo', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('#contato')).toHaveClass(/atual/);
  await expect(page.locator('header nav a.ativo')).toHaveCount(0);
  await expect(page.locator('header nav a[aria-current]')).toHaveCount(0);
});

test('item ativo pulsa', async ({ page }) => {
  await page.goto('/#servicos');
  await expect(page.locator('header a.ativo')).toHaveCSS('animation-name', 'pulsa');
  await expect(page.locator('header a.ativo')).toHaveCSS('animation-duration', '2.4s');
});

test('botão em foco ganha borda verde e pulsa', async ({ page }) => {
  await page.goto('/');
  const botao = page.locator('#contato .btn-verde');
  await botao.focus();
  await expect(botao).toHaveCSS('border-color', 'rgb(109, 179, 132)');
  await expect(botao).toHaveCSS('animation-name', 'pulsa');
  await expect(botao).toHaveCSS('animation-duration', '2.4s');
});

test('rótulo da seção atual não ganha ponto pulsante', async ({ page }) => {
  await page.goto('/#servicos');
  await expect(page.locator('#servicos')).toHaveClass(/atual/);
  const antes = await page.locator('#servicos .rotulo').evaluate((el) => getComputedStyle(el, '::before').content);
  expect(antes).toBe('none');
});

test.describe('movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });
  test('sem pulso e sem troca automática', async ({ page }) => {
    await page.clock.install();
    await page.goto('/#servicos');
    await expect(page.locator('header a.ativo')).toHaveCSS('animation-name', 'none');
    await page.clock.runFor(13000);
    await expect(page.locator('.legenda')).toContainText('Curralinhos');
  });
});

test.describe('sem JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('todo o conteúdo fica visível', async ({ page }) => {
    await page.goto('/');
    const revelaveis = await page.locator('.revelar').all();
    expect(revelaveis.length).toBeGreaterThan(0);
    for (const el of revelaveis) await expect(el).toHaveCSS('opacity', '1');
  });
});

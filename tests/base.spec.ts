import { test, expect } from '@playwright/test';

test('carrega com título, idioma e menu', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('ACE Project · Engenharia de projetos');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  for (const id of ['servicos', 'portfolio', 'sobre'])
    await expect(page.locator(`header a[href="#${id}"]`)).toHaveCount(1);
  await expect(page.locator('header nav a.cta')).toHaveText('Orçamento');
  await expect(page.locator('section#topo')).toHaveCount(1);
});

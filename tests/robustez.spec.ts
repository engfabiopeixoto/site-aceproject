import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { createHash } from 'node:crypto';

test('falha ao carregar os dados não esconde o conteúdo', async ({ page }) => {
  await page.route('**/js/obras.js', (r) => r.abort());
  await page.goto('/');
  for (const el of await page.locator('.revelar').all()) await expect(el).toHaveCSS('opacity', '1');
  await expect(page.locator('#contato a[data-contato="email"]')).toHaveAttribute('href', 'mailto:contato@aceproject.com.br');
});

test('dados sem obra em destaque não quebram a página', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.route('**/js/obras.js', (r) => r.fulfill({
    contentType: 'text/javascript',
    body: "export const OBRAS = [{ id: 'x', nome: 'X', ano: 2024, etiqueta: '', descricao: '', imagens: [{ src: 'img/curralinhos-3d', alt: 'x' }] }];",
  }));
  await page.goto('/');
  await expect(page.locator('#portfolio .caso')).toHaveCount(0);
  await expect(page.locator('#portfolio .obra')).toHaveCount(1);
  await page.locator('#sobre').scrollIntoViewIfNeeded();
  await expect(page.locator('#sobre .revelar')).toHaveCSS('opacity', '1');
  expect(erros).toEqual([]);
});

test.describe('sem JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 375, height: 800 } });
  test('contatos, menu e obra em destaque continuam funcionando', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a.whatsapp-flutuante')).toHaveAttribute('href', /^https:\/\/wa\.me\/5586999029300\?text=/);
    await expect(page.locator('#contato a[data-contato="instagram"]')).toHaveAttribute('href', 'https://instagram.com/ace.projectpi');
    await expect(page.locator('header nav a[href="#sobre"]')).toBeVisible();
    await expect(page.locator('#portfolio .caso h3')).toHaveText('Portal Demerval Lobão');
  });
});

test('carrossel do topo não anuncia legenda sozinho e pausa sob o mouse', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hover não existe no celular');
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('.legenda')).not.toHaveAttribute('aria-live', /.+/);
  await page.locator('#topo h1').hover();
  await page.clock.runFor(13000);
  await expect(page.locator('.legenda')).toContainText('Curralinhos');
});

/**
 * Palavras que não podem estar no repositório público (nomes de clientes, e-mail
 * pessoal, pastas pessoais). Ficam só como SHA-256 (16 primeiros dígitos) da
 * palavra em minúsculas e sem acento, para o teste não publicar o que protege.
 */
const PROIBIDAS = new Set([
  '60c4b69ff786dd92', 'd8fb8f834ffc2c0f', '62949d8638e97892', 'e49d97c3fd95a5a0', '4810eb165b0df359',
  '75e744c826369aed', '2733928c389f73b5', '2b237c4ddc0783f2', 'f2ec18031f5ace9d', '05cfbe283381aab8',
]);
const proibidasEm = (texto: string) => [...new Set(texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  .split(/[^a-z0-9]+/).filter((p) => PROIBIDAS.has(createHash('sha256').update(p).digest('hex').slice(0, 16))))];

test('repositório não versiona dados pessoais', () => {
  const arquivos = execSync('git ls-files', { encoding: 'utf8' }).split('\n')
    .filter((f) => f && !/\.(png|jpe?g|webp)$/.test(f) && f !== 'package-lock.json');
  const achados = arquivos.flatMap((f) => proibidasEm(fs.readFileSync(f, 'utf8')).map((p) => `${f}: ${p}`));
  expect(achados).toEqual([]);
  expect(proibidasEm(execSync('git log --format=%ae', { encoding: 'utf8' }))).toEqual([]);
});

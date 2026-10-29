import { test, expect, type Page, type Locator } from '@playwright/test';

const dialogo = (page: Page) => page.locator('dialog.ampliacao');
const imagemAtual = (page: Page) => dialogo(page).locator('.quadro img');

async function abrir(page: Page, nome: string) {
  await page.goto('/');
  const card = page.locator('#portfolio .obra', { hasText: nome });
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await expect(dialogo(page)).toBeVisible();
  return card;
}

async function carregada(img: Locator) {
  await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeGreaterThan(0);
}

const ALTS_QUADRA = [
  'Modelo 3D da cobertura metálica da quadra, com detalhe ampliado da ligação entre pilar e treliça',
  'Ligação dos perfis da treliça à placa de base, em vista explodida',
  'Ligação soldada dos perfis sobre a placa de base',
  'Placa de ancoragem com chumbadores sobre o pilar de concreto',
  'Sapata, pilar e viga baldrame com as armaduras, em corte no terreno',
];

test('mostra uma imagem por vez, com contagem, legenda e navegação por botões e teclado', async ({ page }) => {
  await abrir(page, 'Cobertura de quadra poliesportiva');
  const contagem = dialogo(page).locator('.contagem');
  const legenda = dialogo(page).locator('.legenda');
  const anterior = dialogo(page).locator('.anterior');
  const proxima = dialogo(page).locator('.proxima');
  await expect(imagemAtual(page)).toHaveCount(1);
  await expect(contagem).toHaveText('1 / 5');
  await expect(legenda).toHaveText(ALTS_QUADRA[0]);
  await expect(imagemAtual(page)).toHaveAttribute('alt', ALTS_QUADRA[0]);
  await expect(anterior).toBeDisabled();
  await proxima.click();
  await expect(contagem).toHaveText('2 / 5');
  await expect(legenda).toHaveText(ALTS_QUADRA[1]);
  await page.keyboard.press('ArrowRight');
  await expect(contagem).toHaveText('3 / 5');
  await page.keyboard.press('ArrowLeft');
  await expect(contagem).toHaveText('2 / 5');
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  await expect(contagem).toHaveText('5 / 5');
  await expect(legenda).toHaveText(ALTS_QUADRA[4]);
  await expect(proxima).toBeDisabled();
});

test('cada imagem aparece inteira e dentro da tela', async ({ page }) => {
  await abrir(page, 'Cobertura de quadra poliesportiva');
  const tela = page.viewportSize()!;
  for (let i = 0; i < 5; i++) {
    if (i) await dialogo(page).locator('.proxima').click();
    const img = imagemAtual(page);
    await expect(img).toHaveAttribute('alt', ALTS_QUADRA[i]);
    await carregada(img);
    const caixa = (await img.boundingBox())!;
    expect(caixa.height).toBeLessThanOrEqual(tela.height * 0.75 + 1);
    const proporcao = await img.evaluate((el: HTMLImageElement) => el.naturalWidth / el.naturalHeight);
    expect(caixa.width / caixa.height).toBeCloseTo(proporcao, 1);
    const janela = (await dialogo(page).boundingBox())!;
    expect(janela.y + janela.height).toBeLessThanOrEqual(tela.height);
  }
});

test('desenhos da escola ocupam a largura útil e abrem o arquivo de 1600 px em nova aba', async ({ page }) => {
  await abrir(page, 'Unidade escolar em Lagoa do Barro');
  const quadro = dialogo(page).locator('.quadro');
  await expect(dialogo(page).locator('.dica-zoom')).toBeVisible();
  for (const [i, nome] of ['mosaico', 'forma', 'sapatas', 'vigas', 'escada'].entries()) {
    if (i) await dialogo(page).locator('.proxima').click();
    const link = quadro.locator('a.original');
    await expect(link).toHaveAttribute('href', `img/escola-${nome}-1600.jpg`);
    await expect(link).toHaveAttribute('target', '_blank');
    if (i === 0) continue; // O mosaico é limitado pela altura; os desenhos, pela largura.
    await carregada(imagemAtual(page));
    const util = await quadro.evaluate((q) => q.clientWidth);
    expect((await imagemAtual(page).boundingBox())!.width).toBeGreaterThanOrEqual(util - 2);
  }
  const [aba] = await Promise.all([page.waitForEvent('popup'), imagemAtual(page).click()]);
  expect(aba.url()).toMatch(/img\/escola-escada-1600\.jpg$/);
});

test('fotos e modelos 3D não viram link de zoom', async ({ page }) => {
  await abrir(page, 'Cobertura de quadra poliesportiva');
  await expect(dialogo(page).locator('a.original')).toHaveCount(0);
  await expect(dialogo(page).locator('.dica-zoom')).toBeHidden();
});

test('botão fechar tem 44 px e fica fixo no topo enquanto as imagens mudam', async ({ page }) => {
  await abrir(page, 'Cobertura de quadra poliesportiva');
  const fechar = dialogo(page).locator('.fechar');
  const antes = (await fechar.boundingBox())!;
  expect(antes.width).toBeGreaterThanOrEqual(44);
  expect(antes.height).toBeGreaterThanOrEqual(44);
  await expect(dialogo(page).locator('.quadro .fechar')).toHaveCount(0);
  for (let i = 0; i < 4; i++) await dialogo(page).locator('.proxima').click();
  await carregada(imagemAtual(page));
  expect((await fechar.boundingBox())!.y).toBeCloseTo(antes.y, 0);
  // A janela não rola: o fechar nunca sai de vista.
  expect(await dialogo(page).evaluate((d) => d.scrollHeight - d.clientHeight)).toBeLessThanOrEqual(1);
});

test('Esc e clique fora fecham, e o foco volta ao cartão que abriu', async ({ page }) => {
  const card = await abrir(page, 'Cobertura de quadra poliesportiva');
  await page.keyboard.press('Escape');
  await expect(dialogo(page)).toBeHidden();
  await expect(card).toBeFocused();
  await card.click();
  await expect(dialogo(page)).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(dialogo(page)).toBeHidden();
  await expect(card).toBeFocused();
});

test('detalhamento do Demerval abre sozinho, sem navegação, com zoom em nova aba', async ({ page }) => {
  await page.goto('/');
  const faixa = page.locator('#portfolio .caso .detalhe button');
  await faixa.scrollIntoViewIfNeeded();
  await faixa.click();
  await expect(imagemAtual(page)).toHaveAttribute('alt', 'Detalhamento da treliça metálica do Portal Demerval Lobão');
  await expect(dialogo(page).locator('.navegacao')).toBeHidden();
  await expect(dialogo(page).locator('a.original')).toHaveAttribute('href', 'img/demerval-detalhe-1600.jpg');
  await page.keyboard.press('Escape');
  await expect(faixa).toBeFocused();
});

test('galeria da residência traz as 5 imagens e só o isométrico abre em tamanho real', async ({ page }) => {
  await abrir(page, 'Residência com piscina');
  const alts = [
    'Isométrico das instalações de água fria e esgoto da residência',
    'Visão geral das instalações sobre a casa',
    'Casa de máquinas da piscina com bombas, filtro e registros',
    "Caixas d'água e alimentação no telhado",
    'Isométrico da tubulação da piscina',
  ];
  await expect(dialogo(page).locator('.contagem')).toHaveText('1 / 5');
  for (const [i, alt] of alts.entries()) {
    if (i) await dialogo(page).locator('.proxima').click();
    await expect(imagemAtual(page)).toHaveAttribute('alt', alt);
    await carregada(imagemAtual(page));
    await expect(dialogo(page).locator('a.original')).toHaveCount(i === 0 ? 1 : 0);
  }
});

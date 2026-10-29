import { test, expect, type Page } from '@playwright/test';

type ObraTeste = Record<string, unknown>;

const obra = (id: string, extra: ObraTeste = {}): ObraTeste => ({
  id, nome: id, ano: 2022, etiqueta: '', descricao: '',
  imagens: [{ src: 'img/curralinhos-3d', alt: id }], ...extra,
});

/** Redesenha #portfolio com dados injetados. */
async function desenhar(page: Page, obras: ObraTeste[]) {
  await page.evaluate(async (lista) => {
    const { desenharPortfolio } = await import('/js/portfolio.js');
    desenharPortfolio(document.querySelector('#portfolio') as HTMLElement, lista);
  }, obras);
}

test('portfólio numa seção só: caso do Demerval e carrossel com as outras 4 obras', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#destaque')).toHaveCount(0);
  await expect(page.locator('#portfolio h2')).toHaveText('Projetos notáveis entregues');
  const caso = page.locator('#portfolio .caso');
  await expect(caso.locator('h3')).toHaveText('Portal Demerval Lobão');
  await expect(caso.locator('.comparador')).toHaveCount(1);
  await expect(caso.locator('.detalhe img')).toHaveAttribute('alt', 'Detalhamento da treliça metálica do Portal Demerval Lobão');
  await expect(page.locator('#portfolio .grade')).toHaveCount(0);
  await expect(page.locator('#portfolio .carrossel .obra')).toHaveCount(4);
  await expect(page.locator('#portfolio .seta')).toHaveCount(2);
  await expect(page.locator('#portfolio .obra .nome')).toHaveText([
    'Portal Curralinhos', 'Cobertura de quadra poliesportiva', 'Unidade escolar em Lagoa do Barro', 'Residência com piscina',
  ]);
});

test('cartão da residência mostra nome, etiqueta e o isométrico', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('#portfolio .obra', { hasText: 'Residência com piscina' });
  await expect(card.locator('.etiqueta')).toHaveText('2021 · Estrutural · hidrossanitário');
  await expect(card.locator('.descricao')).toHaveText('Estrutura, piscina e instalações hidrossanitárias modeladas em BIM, com casa de máquinas e reservatórios detalhados em 3D.');
  await expect(card.locator('img')).toHaveAttribute('alt', 'Isométrico das instalações de água fria e esgoto da residência');
});

test('cartão da escola mostra o mosaico centralizado', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('#portfolio .obra', { hasText: 'Unidade escolar em Lagoa do Barro' });
  await expect(card.locator('.etiqueta')).toHaveText('2023 · Estrutural · concreto armado');
  await expect(card.locator('img')).toHaveAttribute('alt', 'As 12 pranchas do projeto estrutural da escola');
  await expect(card.locator('img')).toHaveCSS('object-position', '50% 50%');
});

test('cartão da quadra mostra nome e etiqueta', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('#portfolio .obra', { hasText: 'Cobertura de quadra poliesportiva' });
  await expect(card.locator('.etiqueta')).toHaveText('2022 · Estrutural · metálica e concreto');
  await expect(card.locator('img')).toHaveAttribute('alt', /cobertura metálica da quadra/);
});

test('comparador do Demerval carrega modelo e obra pronta alinhados', async ({ page }) => {
  await page.goto('/');
  const comparador = page.locator('#portfolio .caso .comparador');
  await comparador.scrollIntoViewIfNeeded();
  const modelo = comparador.locator('.modelo img');
  const obra = comparador.locator(':scope > picture img');
  await expect(modelo).toHaveAttribute('alt', 'Modelo do projeto: Portal Demerval Lobão');
  await expect(modelo).toHaveAttribute('src', /demerval-modelo/);
  await expect(obra).toHaveAttribute('alt', 'Obra pronta: Portal Demerval Lobão');
  await expect(obra).toHaveAttribute('src', /demerval-obra/);
  for (const img of [modelo, obra]) {
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeGreaterThan(0);
  }
  // As duas camadas ocupam a mesma caixa com o mesmo enquadramento.
  expect(await modelo.boundingBox()).toEqual(await obra.boundingBox());
  for (const prop of ['object-fit', 'object-position'])
    await expect(modelo).toHaveCSS(prop, await obra.evaluate((i, p) => getComputedStyle(i).getPropertyValue(p), prop));
  await expect(page.locator('#portfolio .caso .detalhe')).toContainText('Do detalhamento à obra');
});

for (const largura of [390, 1440]) {
  test.describe(`caso em ${largura} px`, () => {
    test.use({ viewport: { width: largura, height: 900 } });

    test('caixa do caso segue a proporção da foto', async ({ page }) => {
      await page.goto('/');
      const caixa = await page.locator('#portfolio .caso .comparador').boundingBox();
      expect(caixa!.width / caixa!.height).toBeCloseTo(923 / 551, 2);
    });

    test('caixa do caso segue a proporção da foto também sem JavaScript', async ({ browser }) => {
      const contexto = await browser.newContext({ javaScriptEnabled: false, viewport: { width: largura, height: 900 } });
      const page = await contexto.newPage();
      await page.goto('/');
      const caixa = await page.locator('#portfolio .caso .midia').boundingBox();
      expect(caixa!.width / caixa!.height).toBeCloseTo(923 / 551, 2);
      await contexto.close();
    });
  });
}

for (const largura of [390, 1440]) {
  test(`faixa do detalhamento segue a proporção do desenho em ${largura} px`, async ({ browser }) => {
    const contexto = await browser.newContext({ viewport: { width: largura, height: 900 } });
    const page = await contexto.newPage();
    await page.goto('/');
    const faixa = page.locator('#portfolio .caso .detalhe');
    await faixa.scrollIntoViewIfNeeded();
    const img = faixa.locator('img');
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeGreaterThan(0);
    const caixa = (await img.boundingBox())!;
    expect(caixa.width / caixa.height).toBeCloseTo(3931 / 590, 1);
    // Sem sobra vertical: o botão só acrescenta a borda de 1 px em cima e embaixo.
    const botao = (await faixa.locator('button').boundingBox())!;
    expect(botao.height - caixa.height).toBeLessThanOrEqual(3);
    await expect(img).toHaveCSS('object-fit', 'contain');
    await expect(img).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await contexto.close();
  });
}

test('nome da obra no caso não fica em caixa alta', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#portfolio .caso h3')).toHaveCSS('text-transform', 'none');
});

test('grade com uma obra ocupa a linha inteira', async ({ page }) => {
  await page.goto('/');
  await desenhar(page, [obra('d', { destaque: true }), obra('a')]);
  const grade = await page.locator('#portfolio .grade.unica').boundingBox();
  const card = page.locator('#portfolio .grade.unica .obra');
  const caixa = await card.boundingBox();
  expect(caixa!.width).toBeCloseTo(grade!.width, 0);
  expect(caixa!.height).toBeCloseTo(360, 0);
  await expect(card.locator('img')).toHaveCSS('object-position', '50% 50%');
});

test('obra da grade abre e fecha a ampliação', async ({ page }) => {
  await page.goto('/');
  await page.locator('#portfolio .obra').first().click();
  await expect(page.locator('dialog.ampliacao')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.ampliacao')).toBeHidden();
});

test('duas obras na grade ficam em duas colunas', async ({ page, isMobile }) => {
  test.skip(isMobile, 'no celular a grade tem uma coluna');
  await page.goto('/');
  await desenhar(page, [obra('d', { destaque: true }), obra('a'), obra('b')]);
  await expect(page.locator('#portfolio .grade:not(.unica) .obra')).toHaveCount(2);
  const [a, b] = await Promise.all([0, 1].map((i) => page.locator('#portfolio .obra').nth(i).boundingBox()));
  expect(a!.y).toBe(b!.y);
  expect(b!.x).toBeGreaterThan(a!.x + a!.width);
});

test('três obras ou mais viram carrossel, sem repetir o caso', async ({ page }) => {
  await page.goto('/');
  await desenhar(page, [obra('d', { destaque: true }), obra('a'), obra('b'), obra('c')]);
  await expect(page.locator('#portfolio .caso h3')).toHaveText('d');
  await expect(page.locator('#portfolio .carrossel .obra')).toHaveCount(3);
  await expect(page.locator('#portfolio .seta')).toHaveCount(2);
});

test('barra deslizante aparece quando o caso tem comparação', async ({ page }) => {
  await page.goto('/');
  await desenhar(page, [obra('d', {
    destaque: true, comparacao: { modelo: 'img/curralinhos-3d', obra: 'img/demerval-obra' },
  })]);
  const r = page.locator('#portfolio .caso .comparador input[type=range]');
  await expect(r).toHaveAttribute('aria-label', 'Comparar projeto e obra pronta');
  await r.fill('20');
  await expect(page.locator('#portfolio .caso .comparador .modelo')).toHaveCSS('clip-path', 'inset(0px 80% 0px 0px)');
});

test('faixa de detalhamento aparece quando o caso tem detalhe e abre a ampliação', async ({ page }) => {
  await page.goto('/');
  await desenhar(page, [obra('d', {
    destaque: true, detalhe: { src: 'img/curralinhos-3d', alt: 'Desenho de detalhamento' },
  })]);
  const faixa = page.locator('#portfolio .caso .detalhe');
  await expect(faixa).toContainText('Do detalhamento à obra');
  const img = faixa.locator('img');
  await expect(img).toHaveAttribute('alt', 'Desenho de detalhamento');
  await expect(img).toHaveCSS('object-fit', 'contain');
  await expect(img).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  // A caixa segue a proporção da própria imagem: o contain não deixa sobra.
  await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
  const proporcao = await img.evaluate((i: HTMLImageElement) => i.naturalWidth / i.naturalHeight);
  const caixa = (await img.boundingBox())!;
  expect(caixa.width / caixa.height).toBeCloseTo(proporcao, 1);
  await faixa.locator('button').click();
  await expect(page.locator('dialog.ampliacao img')).toHaveAttribute('alt', 'Desenho de detalhamento');
});

test('cartão de obra mostra a dica de ampliar', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#portfolio .obra .ver').first()).toHaveText('Ver imagens ↗');
  await expect(page.locator('#portfolio .obra .ver').first()).toBeVisible();
});

/** Luminância relativa WCAG de uma cor sRGB 0–255. */
function luminancia([r, g, b]: number[]) {
  const canal = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

test('etiqueta de cada cartão tem contraste 4,5:1 sobre o fundo, mesmo nas pranchas claras', async ({ page }) => {
  const sharp = (await import('sharp')).default;
  await page.goto('/');
  await page.addStyleTag({ content: '.obra .info > *, .obra .ver { visibility: hidden } .obra { transition: none }' });
  const corTexto = await page.locator('#portfolio .obra .etiqueta').first().evaluate((e) =>
    getComputedStyle(e).color.match(/\d+/g)!.slice(0, 3).map(Number));
  for (const card of await page.locator('#portfolio .obra').all()) {
    await card.scrollIntoViewIfNeeded();
    await expect.poll(() => card.locator('img').evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeGreaterThan(0);
    const caixa = (await card.locator('.etiqueta').boundingBox())!;
    const { data, info } = await sharp(await page.screenshot({ clip: caixa })).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let fundoMaisClaro = 0;
    for (let i = 0; i < info.width * info.height * 3; i += 3)
      fundoMaisClaro = Math.max(fundoMaisClaro, luminancia([data[i], data[i + 1], data[i + 2]]));
    const contraste = (luminancia(corTexto) + 0.05) / (fundoMaisClaro + 0.05);
    expect(contraste, await card.locator('.nome').textContent() ?? '').toBeGreaterThanOrEqual(4.5);
  }
});

test.describe('setas do carrossel', () => {
  const setas = (page: Page) => page.locator('#portfolio .setas');
  const seta = (page: Page, nome: string) => page.getByRole('button', { name: nome, exact: true });

  test('somem quando os cartões cabem e voltam ao estreitar a tela', async ({ page, isMobile }) => {
    test.skip(isMobile, 'no celular os cartões nunca cabem');
    await page.goto('/');
    // Três cartões cabem em 1440 px; com as obras reais (4) as setas já aparecem.
    await desenhar(page, [obra('d', { destaque: true }), obra('a'), obra('b'), obra('c')]);
    await expect(page.locator('#portfolio .carrossel .obra')).toHaveCount(3);
    await expect(setas(page)).toBeHidden();
    await page.setViewportSize({ width: 600, height: 900 });
    await expect(setas(page)).toBeVisible();
  });

  test('ficam desativadas nas pontas do trilho', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'no desktop os cartões cabem e as setas somem');
    await page.goto('/');
    await expect(setas(page)).toBeVisible();
    await expect(seta(page, 'Anterior')).toBeDisabled();
    await expect(seta(page, 'Próxima')).toBeEnabled();
    await page.locator('#portfolio .carrossel').evaluate((t) => { t.scrollLeft = t.scrollWidth; });
    await expect(seta(page, 'Próxima')).toBeDisabled();
    await expect(seta(page, 'Anterior')).toBeEnabled();
  });

  test('no celular o botão do WhatsApp não cobre as setas', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'só no celular');
    await page.goto('/');
    await setas(page).scrollIntoViewIfNeeded();
    const whatsapp = (await page.locator('a.whatsapp-flutuante').boundingBox())!;
    for (const nome of ['Anterior', 'Próxima']) {
      const caixa = (await seta(page, nome).boundingBox())!;
      // Separadas na horizontal: o botão fixo não cobre a seta em nenhuma rolagem.
      expect(caixa.x + caixa.width, nome).toBeLessThan(whatsapp.x);
    }
  });
});

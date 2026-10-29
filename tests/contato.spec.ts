import { test, expect, type Page } from '@playwright/test';

test('contatos corretos e nada proibido', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#contato a[data-contato="email"]')).toHaveAttribute('href', 'mailto:contato@aceproject.com.br');
  await expect(page.locator('#contato a[data-contato="instagram"]')).toHaveAttribute('href', 'https://instagram.com/ace.projectpi');
  await expect(page.locator('a.whatsapp-flutuante')).toHaveAttribute('href', /^https:\/\/wa\.me\/5586999029300\?text=/);
  expect(await page.content()).not.toContain(['gmail', '.com'].join(''));
  const texto = await page.locator('body').innerText();
  // O CREA-PI pode ser citado (trajetória do engenheiro); o número de registro, nunca.
  const registroCrea = /\bCREA\b[^\n]{0,15}(n[º°o.]|\d{5,}|\d+\/D)/;
  expect('CREA-PI nº 1916052870').toMatch(registroCrea);
  expect(texto).not.toMatch(registroCrea);
  expect(texto).not.toMatch(/\bCPF\b|\bART\b/);
});

test('contato informa prazo de resposta', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#contato .btn-verde + .prazo')).toHaveText('Resposta em até 24 horas.');
});

test('rodapé lista os canais', async ({ page }) => {
  await page.goto('/');
  const rodape = page.locator('footer');
  await expect(rodape.locator('a[data-contato="whatsapp"]')).toHaveText('(86) 99902-9300');
  await expect(rodape.locator('a[data-contato="whatsapp"]')).toHaveAttribute('href', /^https:\/\/wa\.me\/5586999029300\?text=/);
  await expect(rodape.locator('a[data-contato="email"]')).toHaveText('contato@aceproject.com.br');
  await expect(rodape.locator('a[data-contato="email"]')).toHaveAttribute('href', 'mailto:contato@aceproject.com.br');
  await expect(rodape.locator('a[data-contato="instagram"]')).toHaveText('@ace.projectpi');
  await expect(rodape.locator('a[data-contato="instagram"]')).toHaveAttribute('href', 'https://instagram.com/ace.projectpi');
});

test('Sobre apresenta o engenheiro responsável', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#sobre h2')).toHaveText('A ACE Project tem um rosto.');
  await expect(page.locator('#sobre')).toContainText('Fábio Peixoto');
  await expect(page.locator('#sobre')).toContainText('UESPI');
});

test('Sobre mostra foto sem crédito', async ({ page }) => {
  await page.goto('/');
  const foto = page.locator('#sobre figure img');
  await expect(foto).toHaveAttribute('alt', 'Fábio Peixoto, engenheiro civil e fundador da ACE Project');
  await foto.scrollIntoViewIfNeeded();
  await expect.poll(() => foto.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  const caixa = (await foto.boundingBox())!;
  expect(caixa.height / caixa.width).toBeCloseTo(1.25, 1);
  await expect(page.locator('#sobre figcaption')).toHaveCount(0);
});

test('Sobre tem duas colunas no desktop e uma no celular', async ({ page }) => {
  await page.goto('/');
  const posicoes = async () => {
    const foto = (await page.locator('#sobre figure').boundingBox())!;
    const texto = (await page.locator('#sobre h2').boundingBox())!;
    return { foto, texto };
  };
  await page.setViewportSize({ width: 1440, height: 900 });
  let { foto, texto } = await posicoes();
  expect(texto.x).toBeGreaterThanOrEqual(foto.x + foto.width);
  await page.setViewportSize({ width: 375, height: 800 });
  ({ foto, texto } = await posicoes());
  expect(texto.y).toBeGreaterThanOrEqual(foto.y + foto.height);
});

const MARCOS = [
  ['2015', 'Começa a estudar BIM, ainda na graduação.'],
  ['2016–2017', 'Atua como autônomo, projetando reformas e edificações térreas.'],
  ['2018–2020', 'Chefe de Fiscalização do CREA-PI: conhece por dentro o conselho profissional e coordena uma equipe de 15 pessoas.'],
  ['2021', 'Funda a ACE Project.'],
  ['Hoje', 'Mais de 50 projetos entregues, com IA nas rotinas de modelagem, dimensionamento e detalhamento dos projetos complementares.'],
];

test('Sobre conta a trajetória em ordem cronológica, com o texto aprovado', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#sobre .rotulo')).toHaveText('Sobre');
  await expect(page.locator('#sobre h2')).toHaveText('A ACE Project tem um rosto.');
  await expect(page.locator('#sobre .revelar > p:not(.rotulo)')).toHaveText([
    'O de Fábio Peixoto, engenheiro civil formado pela UESPI em 2016, com ampla experiência em projetos estruturais '
    + 'de concreto armado, estruturas metálicas e instalações hidrossanitárias e elétricas.',
    'Cada projeto passa pelas mãos do mesmo engenheiro, do lançamento da estrutura à compatibilização com as instalações. '
    + 'As disciplinas nascem no mesmo modelo BIM, e os conflitos aparecem na tela, não no canteiro. Com normas e '
    + 'ferramentas sempre atualizadas, sobra mais tempo para a engenharia que chega à obra e se converte em economia para o cliente.',
    'Atendemos arquitetos, construtoras e engenheiros em obras residenciais, comerciais e industriais.',
  ]);
  await expect(page.locator('#sobre .revelar > p strong')).toHaveText('Fábio Peixoto');
  // A linha do tempo fica entre a abertura e o método.
  await expect(page.locator('#sobre .revelar > p:not(.rotulo)').first().locator('+ ol.linha-do-tempo')).toHaveCount(1);
  const itens = page.locator('#sobre ol.linha-do-tempo > li');
  await expect(itens.locator('.ano')).toHaveText(MARCOS.map(([ano]) => ano));
  await expect(itens.locator('p')).toHaveText(MARCOS.map(([, texto]) => texto));
  await expect(itens.first().locator('.ano')).toHaveCSS('color', 'rgb(109, 179, 132)');
  expect(Number(await itens.first().locator('.ano').evaluate((el) => getComputedStyle(el).fontWeight))).toBeGreaterThanOrEqual(700);
  await expect(itens.first().locator('p')).toHaveCSS('font-size', '16px');
});

test('linha do tempo: ano à esquerda no desktop, com linha vertical ligando os marcos', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('#sobre .linha-do-tempo > li')).toHaveCount(5);
  for (const item of await page.locator('#sobre .linha-do-tempo > li').all()) {
    const ano = (await item.locator('.ano').boundingBox())!;
    const texto = (await item.locator('p').boundingBox())!;
    expect(texto.x).toBeGreaterThanOrEqual(ano.x + ano.width);
    expect(Math.abs(texto.y - ano.y)).toBeLessThanOrEqual(4);
  }
  const linha = await page.locator('#sobre .linha-do-tempo').evaluate((el) => {
    const estilo = getComputedStyle(el, '::before');
    return { largura: estilo.width, cor: estilo.backgroundColor };
  });
  expect(linha).toEqual({ largura: '1px', cor: 'rgb(38, 38, 38)' });
});

test('linha do tempo: ano acima do texto no celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#sobre .linha-do-tempo > li')).toHaveCount(5);
  for (const item of await page.locator('#sobre .linha-do-tempo > li').all()) {
    const ano = (await item.locator('.ano').boundingBox())!;
    const texto = (await item.locator('p').boundingBox())!;
    expect(texto.y).toBeGreaterThanOrEqual(ano.y + ano.height - 1);
  }
});

test('parágrafos do Sobre ficam próximos e com entrelinha 1,6, sem mudar a fonte', async ({ page }) => {
  await page.goto('/');
  const paragrafo = page.locator('#sobre .revelar > p:not(.rotulo)').first();
  await expect(paragrafo).toHaveCSS('margin-bottom', '10px');
  await expect(paragrafo).toHaveCSS('font-size', '16px');
  await expect(paragrafo).toHaveCSS('line-height', '25.6px');
});

/** Caixas do retrato, do texto e da foto do CREA na largura pedida. */
async function caixasDoSobre(page: Page, largura: number) {
  await page.setViewportSize({ width: largura, height: 900 });
  await page.goto('/');
  const crea = page.locator('#sobre .foto-crea img');
  await crea.scrollIntoViewIfNeeded();
  await expect.poll(() => crea.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  return {
    retrato: (await page.locator('#sobre .retrato img').boundingBox())!,
    texto: (await page.locator('#sobre .revelar').boundingBox())!,
    crea: (await crea.boundingBox())!,
  };
}

test('foto do CREA carrega com alt e proporção 4:5', async ({ page }) => {
  const { crea } = await caixasDoSobre(page, 1440);
  await expect(page.locator('#sobre .foto-crea img')).toHaveAttribute('alt', 'Fábio Peixoto em sessão do sistema Confea/Crea, quando era Chefe de Fiscalização do CREA-PI');
  expect(crea.height / crea.width).toBeCloseTo(1.25, 1);
});

test('no desktop a foto do CREA fica à direita do texto, na faixa do retrato', async ({ page }) => {
  const { retrato, texto, crea } = await caixasDoSobre(page, 1440);
  expect(crea.x).toBeGreaterThanOrEqual(texto.x + texto.width);
  expect(Math.abs(crea.height - retrato.height)).toBeLessThanOrEqual(2);
  expect(Math.abs(crea.y - retrato.y)).toBeLessThanOrEqual(2);
});

test('entre 761 e 1100 px a foto do CREA desce para baixo do texto', async ({ page }) => {
  const { texto, crea } = await caixasDoSobre(page, 1000);
  expect(crea.y).toBeGreaterThanOrEqual(texto.y + texto.height);
});

test('com 3 colunas o texto mantém ao menos ~45 caracteres por linha', async ({ page }) => {
  const { texto, crea } = await caixasDoSobre(page, 1101);
  expect(crea.x).toBeGreaterThanOrEqual(texto.x + texto.width);
  const paragrafo = page.locator('#sobre .revelar > p:not(.rotulo)').first();
  const larguraDe45 = await paragrafo.evaluate((el) => {
    const medida = document.createElement('span');
    medida.textContent = 'engenheiro civil formado pela UESPI em 2016. ';
    el.append(medida);
    const largura = medida.getBoundingClientRect().width;
    medida.remove();
    return largura;
  });
  expect(texto.width).toBeGreaterThanOrEqual(larguraDe45);
});

test('no celular retrato, texto e foto do CREA empilham com a mesma largura', async ({ page }) => {
  const { retrato, texto, crea } = await caixasDoSobre(page, 375);
  expect(texto.y).toBeGreaterThanOrEqual(retrato.y + retrato.height);
  expect(crea.y).toBeGreaterThanOrEqual(texto.y + texto.height);
  expect(Math.abs(crea.width - retrato.width)).toBeLessThanOrEqual(1);
});

test('títulos equilibram as linhas e textos dos cards evitam palavra solta', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#servicos .titulo')).toHaveCSS('text-wrap', /balance/);
  await expect(page.locator('#sobre .titulo')).toHaveCSS('text-wrap', /balance/);
  await expect(page.locator('#servicos .card p').first()).toHaveCSS('text-wrap', /pretty/);
});

test('links de contato, do rodapé, botão do menu e pontos do topo têm foco verde próprio', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  for (const seletor of ['#contato .canais a', 'footer .canais-rodape a', 'header .abrir-menu', '#topo .pontos button']) {
    const el = page.locator(seletor).first();
    await el.focus();
    await expect(el, seletor).toHaveCSS('outline-style', 'solid');
    await expect(el, seletor).toHaveCSS('outline-width', '2px');
    await expect(el, seletor).toHaveCSS('outline-color', 'rgb(109, 179, 132)');
    expect(parseFloat(await el.evaluate((e) => getComputedStyle(e).outlineOffset)), seletor).toBeGreaterThan(0);
  }
});

test('sem rolagem horizontal e com alt em toda imagem', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await expect(page.locator('img:not([alt])')).toHaveCount(0);
});

test('menu do celular abre e fecha', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  const botao = page.locator('header button.abrir-menu');
  await expect(botao).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('header nav a[href="#sobre"]')).toBeHidden();
  await botao.click();
  await expect(botao).toHaveAttribute('aria-expanded', 'true');
  await page.locator('header nav a[href="#sobre"]').click();
  await expect(botao).toHaveAttribute('aria-expanded', 'false');
});

test.describe('menu do celular aberto', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('header button.abrir-menu').click();
    await expect(page.locator('header nav a[href="#sobre"]')).toBeVisible();
  });

  test('ícone vira X', async ({ page }) => {
    const transformacao = await page.locator('header button.abrir-menu span').evaluate((el) => getComputedStyle(el, '::before').transform);
    expect(transformacao).not.toBe('none');
  });

  test('menu fecha com Esc e devolve o foco ao botão', async ({ page }) => {
    await page.keyboard.press('Escape');
    const botao = page.locator('header button.abrir-menu');
    await expect(botao).toHaveAttribute('aria-expanded', 'false');
    await expect(botao).toBeFocused();
    await expect(page.locator('header nav a[href="#sobre"]')).toBeHidden();
  });

  test('menu fecha ao tocar fora', async ({ page }) => {
    await page.locator('#topo h1').click();
    await expect(page.locator('header button.abrir-menu')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('header nav a[href="#sobre"]')).toBeHidden();
  });
});

for (const largura of [320, 1440]) {
  test(`rodapé não fica sob o botão do WhatsApp em ${largura} px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 640 });
    await page.goto('/');
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    const botao = (await page.locator('a.whatsapp-flutuante').boundingBox())!;
    for (const item of await page.locator('footer > *').all()) {
      const caixa = (await item.boundingBox())!;
      expect(caixa.y + caixa.height).toBeLessThanOrEqual(botao.y);
    }
  });
}

test('logo do cabeçalho reserva o espaço com as dimensões reais', async ({ page }) => {
  await page.goto('/');
  const logo = page.locator('header .marca img');
  const { largura, altura, naturalL, naturalA } = await logo.evaluate((el: HTMLImageElement) => ({
    largura: el.getAttribute('width'), altura: el.getAttribute('height'),
    naturalL: el.naturalWidth, naturalA: el.naturalHeight,
  }));
  expect([Number(largura), Number(altura)]).toEqual([naturalL, naturalA]);
});

test('metadados para compartilhamento', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://aceproject.com.br/img/og.jpg');
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
});

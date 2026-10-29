import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const esperadas = ['demerval-obra', 'curralinhos-3d', 'fabio-retrato']
  .flatMap(n => [800, 1600].flatMap(w => ['webp', 'jpg'].map(e => `${n}-${w}.${e}`)))
  // O original da foto do CREA tem 1128 px de largura: o recorte só rende a versão de 800.
  .concat(['fabio-crea-800.webp', 'fabio-crea-800.jpg'])
  .concat(['logo-escuro.png', 'og.jpg']);

test('imagens geradas existem e são leves', () => {
  for (const f of esperadas) {
    const p = path.join('site/img', f);
    expect(fs.existsSync(p), f).toBe(true);
    expect(fs.statSync(p).size, f).toBeLessThan(f.includes('1600') ? 400_000 : 200_000);
  }
});

test('imagens geradas do detalhamento existem, são leves e mostram só a treliça', async () => {
  const sharp = (await import('sharp')).default;
  for (const w of [800, 1600]) for (const e of ['webp', 'jpg']) {
    const p = path.join('site/img', `demerval-detalhe-${w}.${e}`);
    expect(fs.existsSync(p), p).toBe(true);
    expect(fs.statSync(p).size, p).toBeLessThan(w === 1600 ? 400_000 : 200_000);
  }
  // Faixa larga e baixa: sem o título nem as tabelas que ficam abaixo da treliça.
  const { width, height } = await sharp('site/img/demerval-detalhe-1600.jpg').metadata();
  expect(width! / height!).toBeGreaterThan(5);
});

test('imagens geradas do modelo têm a mesma proporção da foto da obra', async () => {
  const sharp = (await import('sharp')).default;
  for (const w of [800, 1600]) for (const e of ['webp', 'jpg']) {
    const p = path.join('site/img', `demerval-modelo-${w}.${e}`);
    expect(fs.existsSync(p), p).toBe(true);
    expect(fs.statSync(p).size, p).toBeLessThan(w === 1600 ? 400_000 : 200_000);
    const { width, height } = await sharp(p).metadata();
    expect(width! / height!, p).toBeCloseTo(923 / 551, 2);
  }
});

test('imagens geradas da quadra existem, são leves e não passam do original', async () => {
  const sharp = (await import('sharp')).default;
  const nomes = ['panorama', 'ligacao-explodida', 'ligacao-montada', 'ancoragem', 'sapata'];
  for (const n of nomes) for (const w of [800, 1600]) for (const e of ['webp', 'jpg']) {
    const p = path.join('site/img', `quadra-${n}-${w}.${e}`);
    expect(fs.existsSync(p), p).toBe(true);
    expect(fs.statSync(p).size, p).toBeLessThan(w === 1600 ? 400_000 : 200_000);
    expect((await sharp(p).metadata()).width, p).toBeLessThanOrEqual(w);
  }
});

test('imagens geradas da escola existem, são leves e não passam do original', async () => {
  const sharp = (await import('sharp')).default;
  const nomes = ['mosaico', 'forma', 'sapatas', 'vigas', 'escada'];
  for (const n of nomes) for (const w of [800, 1600]) for (const e of ['webp', 'jpg']) {
    const p = path.join('site/img', `escola-${n}-${w}.${e}`);
    expect(fs.existsSync(p), p).toBe(true);
    expect(fs.statSync(p).size, p).toBeLessThan(400_000);
    expect((await sharp(p).metadata()).width, p).toBeLessThanOrEqual(w);
  }
});

test('imagens geradas da residência existem, são leves e não passam do original', async () => {
  const sharp = (await import('sharp')).default;
  const nomes = ['isometrico', 'visao-geral', 'casa-de-maquinas', 'caixas-dagua', 'piscina'];
  for (const n of nomes) for (const w of [800, 1600]) for (const e of ['webp', 'jpg']) {
    const p = path.join('site/img', `residencia-${n}-${w}.${e}`);
    expect(fs.existsSync(p), p).toBe(true);
    expect(fs.statSync(p).size, p).toBeLessThan(400_000);
    expect((await sharp(p).metadata()).width, p).toBeLessThanOrEqual(w);
  }
});

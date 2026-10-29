// Gera as imagens do site a partir do acervo da ACE Project.
// O acervo é somente leitura: este script só lê as fontes e só grava em site/img/.
// Os caminhos das fontes ficam em scripts/fontes.local.json, fora do git, porque
// revelam pastas de clientes e do computador do dono. Modelo: scripts/fontes.exemplo.json.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DESTINO = path.resolve('site/img');
const LARGURAS = [800, 1600];
const ARQUIVO_FONTES = process.env.FONTES ?? path.resolve('scripts/fontes.local.json');

if (!fs.existsSync(ARQUIVO_FONTES)) {
  console.error(`Fontes não encontradas em ${ARQUIVO_FONTES}. Copie scripts/fontes.exemplo.json para scripts/fontes.local.json e preencha os caminhos.`);
  process.exit(1);
}
const FONTES = JSON.parse(fs.readFileSync(ARQUIVO_FONTES, 'utf8'));

/** Caminho da fonte `chave` (arquivo ou pasta); `arquivo` é relativo a uma pasta. */
function fonte(chave, arquivo = '') {
  if (!FONTES[chave]) {
    console.error(`Fonte "${chave}" ausente em ${ARQUIVO_FONTES}.`);
    process.exit(1);
  }
  const p = path.join(FONTES[chave], arquivo);
  if (!fs.existsSync(p)) {
    console.error(`Fonte "${chave}" não encontrada: ${p}`);
    process.exit(1);
  }
  return p;
}

const FOTOS = [
  { nome: 'demerval-obra', origem: 'demerval-obra' },
  { nome: 'curralinhos-3d', origem: 'curralinhos-3d' },
];
// Menu: prédio verde com nome em branco, sem fundo. Compartilhamento: selo redondo.
const LOGO = 'logo';
const SELO = 'selo';


async function gerarFoto({ nome, origem }) {
  const entrada = fonte(origem);
  for (const largura of LARGURAS) {
    const base = sharp(entrada).resize({ width: largura, withoutEnlargement: true });
    await base.clone().webp({ quality: 78 }).toFile(path.join(DESTINO, `${nome}-${largura}.webp`));
    await base.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(DESTINO, `${nome}-${largura}.jpg`));
  }
}

async function gerarLogoEOg() {
  await sharp(fonte(LOGO)).trim().resize({ height: 120 }).png({ compressionLevel: 9 }).toFile(path.join(DESTINO, 'logo-escuro.png'));
  const marca = await sharp(fonte(SELO)).resize({ height: 460 }).png().toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#121212' } })
    .composite([{ input: marca, gravity: 'center' }])
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(DESTINO, 'og.jpg'));
}

// Desenho de detalhamento do Demerval: recorta só a treliça (sem o título,
// as tabelas de perfis e soldas e o carimbo, que ficam abaixo dela). Fundo branco.
const DETALHE = {
  nome: 'demerval-detalhe',
  origem: 'demerval-detalhe',
  recorte: { left: 0, top: 165, width: 3931, height: 590 },
};

async function gerarDetalhe({ nome, origem, recorte }) {
  const entrada = fonte(origem);
  for (const largura of LARGURAS) {
    const base = sharp(entrada).extract(recorte).flatten({ background: '#fff' }).resize({ width: largura, withoutEnlargement: true });
    await base.clone().webp({ quality: 82 }).toFile(path.join(DESTINO, `${nome}-${largura}.webp`));
    await base.clone().jpeg({ quality: 85, mozjpeg: true }).toFile(path.join(DESTINO, `${nome}-${largura}.jpg`));
  }
}

// Fotos do Sobre: ficam fora do acervo, também somente leitura.
// Retrato: recorte 4:5 do peito para cima, sem a marca d'água do estúdio (canto inferior).
const RETRATO = {
  nome: 'fabio-retrato',
  origem: 'fabio-retrato',
  recorte: { left: 500, top: 380, width: 2088, height: 2610 },
};
// Sessão do Confea/Crea: recorte 4:5 centrado no Fábio, sem as pessoas das laterais.
// O original tem 1128 px de largura, então só cabe a versão de 800.
const CREA = {
  nome: 'fabio-crea',
  origem: 'fabio-crea',
  recorte: { left: 136, top: 140, width: 800, height: 1000 },
};

/** Recorta e gera só as larguras que o recorte comporta, sem ampliar. */
async function gerarRecorte({ nome, origem, recorte }) {
  const entrada = fonte(origem);
  for (const largura of LARGURAS.filter((l) => l <= recorte.width)) {
    const base = sharp(entrada).extract(recorte).resize({ width: largura });
    await base.clone().webp({ quality: 78 }).toFile(path.join(DESTINO, `${nome}-${largura}.webp`));
    await base.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(DESTINO, `${nome}-${largura}.jpg`));
  }
}

// Render do Revit pela câmera da foto do Demerval, para a barra "projeto → obra
// pronta". O recorte corresponde ao enquadramento da foto (923 × 551) e as
// saídas mantêm essa proporção, para as duas camadas ficarem alinhadas.
const MODELO = {
  nome: 'demerval-modelo',
  origem: 'demerval-modelo',
  recorte: { left: 127, top: 42, width: 2666, height: 1592 },
  proporcao: 923 / 551,
};

async function gerarModelo({ nome, origem, recorte, proporcao }) {
  const entrada = fonte(origem);
  for (const largura of LARGURAS) {
    const tamanho = { width: largura, height: Math.round(largura / proporcao), fit: 'fill' };
    const base = sharp(entrada).extract(recorte).flatten({ background: '#fff' }).resize(tamanho);
    await base.clone().webp({ quality: 78 }).toFile(path.join(DESTINO, `${nome}-${largura}.webp`));
    await base.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(DESTINO, `${nome}-${largura}.jpg`));
  }
}

// Cobertura da quadra poliesportiva: panorama renderizado e detalhes exportados
// do Revit. Os detalhes vêm com sobra branca: apara e devolve uma margem
// pequena e uniforme antes de reduzir.
const QUADRA = {
  pasta: 'quadra',
  margem: 60,
  imagens: [
    { nome: 'quadra-panorama', arquivo: 'panorama.jpg' },
    { nome: 'quadra-ligacao-explodida', arquivo: 'ligacao-explodida.png', aparar: true },
    { nome: 'quadra-ligacao-montada', arquivo: 'ligacao-montada.png', aparar: true },
    { nome: 'quadra-ancoragem', arquivo: 'ancoragem.png', aparar: true },
    { nome: 'quadra-sapata', arquivo: 'sapata-armada.png', aparar: true },
  ],
};

// Unidade escolar em Lagoa do Barro: mosaico das 12 pranchas (fundo grafite,
// sem aparar) e recortes das pranchas. Desenhos técnicos: qualidade maior,
// como no detalhamento do Demerval, para as linhas finas ficarem nítidas.
const ESCOLA = {
  pasta: 'escola',
  margem: 40,
  qualidade: { webp: 82, jpeg: 85 },
  imagens: [
    { nome: 'escola-mosaico', arquivo: 'mosaico.png', fundo: '#2a2a2a' },
    { nome: 'escola-forma', arquivo: 'forma.png', aparar: true },
    { nome: 'escola-sapatas', arquivo: 'sapatas.png', aparar: true },
    { nome: 'escola-vigas', arquivo: 'vigas.png', aparar: true },
    { nome: 'escola-escada', arquivo: 'escada.png', aparar: true },
  ],
};

// Residência com piscina: exports do Revit das instalações. A visão geral tem
// fundo cinza em degradê e fica inteira; as demais têm sobra branca.
const RESIDENCIA = {
  pasta: 'residencia',
  margem: 40,
  qualidade: { webp: 82, jpeg: 85 },
  imagens: [
    { nome: 'residencia-isometrico', arquivo: 'isometrico.jpg', aparar: true },
    { nome: 'residencia-visao-geral', arquivo: 'visao-geral.png' },
    { nome: 'residencia-casa-de-maquinas', arquivo: 'casa-de-maquinas.png', aparar: true },
    { nome: 'residencia-caixas-dagua', arquivo: 'caixas-dagua.png', aparar: true },
    { nome: 'residencia-piscina', arquivo: 'piscina.png', aparar: true },
  ],
};

/** Gera um conjunto de imagens de uma obra; `aparar` tira a sobra branca e devolve a margem. */
async function gerarConjunto({ pasta, margem, imagens, qualidade = { webp: 80, jpeg: 82 } }) {
  for (const { nome, arquivo, aparar, fundo = '#fff' } of imagens) {
    let entrada = sharp(fonte(pasta, arquivo)).flatten({ background: fundo });
    if (aparar) {
      const aparada = await entrada.trim({ background: '#fff', threshold: 10 }).toBuffer();
      entrada = sharp(aparada).extend({ top: margem, bottom: margem, left: margem, right: margem, background: '#fff' });
    }
    const pronta = await entrada.toBuffer();
    for (const largura of LARGURAS) {
      const base = sharp(pronta).resize({ width: largura, withoutEnlargement: true });
      await base.clone().webp({ quality: qualidade.webp }).toFile(path.join(DESTINO, `${nome}-${largura}.webp`));
      await base.clone().jpeg({ quality: qualidade.jpeg, mozjpeg: true }).toFile(path.join(DESTINO, `${nome}-${largura}.jpg`));
    }
  }
}

fs.mkdirSync(DESTINO, { recursive: true });
for (const foto of FOTOS) await gerarFoto(foto);
await gerarLogoEOg();
await gerarDetalhe(DETALHE);
await gerarModelo(MODELO);
await gerarConjunto(QUADRA);
await gerarConjunto(ESCOLA);
await gerarConjunto(RESIDENCIA);
await gerarRecorte(RETRATO);
await gerarRecorte(CREA);
console.log(`Imagens geradas em ${DESTINO}`);

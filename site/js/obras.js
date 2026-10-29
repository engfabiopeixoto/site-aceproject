/**
 * Obras do portfólio. Para ligar a barra "projeto → obra pronta" numa obra,
 * basta gerar as imagens e preencher `comparacao`.
 *
 * @typedef {{ src: string, alt: string, prancha?: boolean }} Imagem  src sem largura nem extensão, ex. "img/demerval-obra";
 *   `prancha` marca desenho técnico: na ampliação, um clique abre o arquivo de 1600 px em nova aba
 * @typedef {{
 *   id: string, nome: string, ano: number, etiqueta: string, descricao: string,
 *   imagens: Imagem[], destaque?: boolean, comparacao?: { modelo: string, obra: string },
 *   detalhe?: Imagem, modelo3d?: Modelo3d
 * }} Obra  `detalhe` mostra no caso em destaque o desenho de detalhamento
 * @typedef {{ src: string, alt: string, casa?: boolean, camera?: Camera3d }} Modelo3d  glTF binário em site/modelos/;
 *   `casa` liga o botão "Mostrar casa", que alterna a transparência do material `casa`
 * @typedef {{
 *   alvo?: string, orbita?: string, orbitaRetrato?: string, campo?: string, minimo?: string, maximo?: string
 * }} Camera3d  enquadramento inicial, na sintaxe do <model-viewer>: alvo → camera-target,
 *   orbita → camera-orbit (orbitaRetrato vale quando o palco é mais alto que largo), campo → field-of-view,
 *   minimo/maximo → min/max-camera-orbit. Sem `camera`, o model-viewer enquadra o modelo inteiro.
 */

/** @type {Obra[]} */
export const OBRAS = [
  {
    id: 'portal-demerval',
    nome: 'Portal Demerval Lobão',
    ano: 2024,
    etiqueta: 'Estrutural · metálica e concreto',
    descricao: 'Pórtico de entrada da cidade.',
    imagens: [{ src: 'img/demerval-obra', alt: 'Portal de entrada de Demerval Lobão construído' }],
    destaque: true,
    comparacao: { modelo: 'img/demerval-modelo', obra: 'img/demerval-obra' },
    modelo3d: { src: 'modelos/portal-demerval.glb', alt: 'Modelo 3D do portal: pilares de concreto e treliça metálica' },
    detalhe: { src: 'img/demerval-detalhe', alt: 'Detalhamento da treliça metálica do Portal Demerval Lobão', prancha: true },
  },
  {
    id: 'portal-curralinhos',
    nome: 'Portal Curralinhos',
    ano: 2024,
    etiqueta: 'Estrutural',
    descricao: 'Treliça metálica sobre fundações em concreto.',
    imagens: [{ src: 'img/curralinhos-3d', alt: 'Modelo 3D da treliça metálica do Portal Curralinhos' }],
  },
  {
    id: 'quadra-poliesportiva',
    nome: 'Cobertura de quadra poliesportiva',
    ano: 2022,
    etiqueta: 'Estrutural · metálica e concreto',
    descricao: 'Cobertura metálica de 17 × 29 m, com ligações e ancoragens detalhadas em 3D.',
    imagens: [
      { src: 'img/quadra-panorama', alt: 'Modelo 3D da cobertura metálica da quadra, com detalhe ampliado da ligação entre pilar e treliça' },
      { src: 'img/quadra-ligacao-explodida', alt: 'Ligação dos perfis da treliça à placa de base, em vista explodida' },
      { src: 'img/quadra-ligacao-montada', alt: 'Ligação soldada dos perfis sobre a placa de base' },
      { src: 'img/quadra-ancoragem', alt: 'Placa de ancoragem com chumbadores sobre o pilar de concreto' },
      { src: 'img/quadra-sapata', alt: 'Sapata, pilar e viga baldrame com as armaduras, em corte no terreno' },
    ],
  },
  {
    id: 'escola-lagoa-do-barro',
    nome: 'Unidade escolar em Lagoa do Barro',
    ano: 2023,
    etiqueta: 'Estrutural · concreto armado',
    descricao: 'Projeto estrutural completo em 12 pranchas: formas, vigas, pilares, lajes, sapatas e escada.',
    imagens: [
      { src: 'img/escola-mosaico', alt: 'As 12 pranchas do projeto estrutural da escola', prancha: true },
      { src: 'img/escola-forma', alt: 'Planta de forma do pavimento superior, com lajes, vigas e pilares', prancha: true },
      { src: 'img/escola-sapatas', alt: 'Detalhamento das sapatas, com planta, corte e armaduras', prancha: true },
      { src: 'img/escola-vigas', alt: 'Detalhamento das vigas V13 a V16, com armação e estribos', prancha: true },
      { src: 'img/escola-escada', alt: 'Cortes e planta da escada, com a armação', prancha: true },
    ],
  },
  {
    id: 'residencia-piscina',
    nome: 'Residência com piscina',
    ano: 2021,
    etiqueta: 'Estrutural · hidrossanitário',
    descricao: 'Estrutura, piscina e instalações hidrossanitárias modeladas em BIM, com casa de máquinas e reservatórios detalhados em 3D.',
    imagens: [
      { src: 'img/residencia-isometrico', alt: 'Isométrico das instalações de água fria e esgoto da residência', prancha: true },
      { src: 'img/residencia-visao-geral', alt: 'Visão geral das instalações sobre a casa' },
      { src: 'img/residencia-casa-de-maquinas', alt: 'Casa de máquinas da piscina com bombas, filtro e registros' },
      { src: 'img/residencia-caixas-dagua', alt: "Caixas d'água e alimentação no telhado" },
      { src: 'img/residencia-piscina', alt: 'Isométrico da tubulação da piscina' },
    ],
    modelo3d: {
      src: 'modelos/residencia.glb',
      alt: 'Modelo 3D das instalações hidrossanitárias da residência',
      casa: true,
      // Centro da caixa das instalações (não do lote, que o muro alarga) e
      // elevação de 55° sobre o horizonte.
      camera: {
        alvo: '-8.8m 1.6m -9.5m',
        orbita: '-20deg 35deg 51m',
        orbitaRetrato: '-20deg 35deg 74m',
        minimo: 'auto 5deg 8m',
        maximo: 'auto 85deg auto',
      },
    },
  },
];

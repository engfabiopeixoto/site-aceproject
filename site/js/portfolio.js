/** @typedef {import('./obras.js').Obra} Obra */
import { el, janelaModal, topoDaJanela } from './dom.js';
import { abrirModelo3d } from './visualizador3d.js';

const LIMITE_GRADE = 2;

/** Botão que abre o visualizador 3D da obra (o <model-viewer> só baixa no clique). */
function botao3d(obra, classe, antesDeAbrir = () => {}) {
  const botao = el('button', { type: 'button', class: classe, texto: 'Explorar em 3D' });
  botao.addEventListener('click', () => {
    const quemAbriu = antesDeAbrir() ?? botao;
    abrirModelo3d(obra, quemAbriu);
  });
  return botao;
}

/** <picture> com WebP e JPG de reserva nas larguras 800 e 1600. */
function imagem(src, alt, { lazy = true, sizes = '(max-width: 900px) 100vw, 60vw' } = {}) {
  const srcset = (ext) => `${src}-800.${ext} 800w, ${src}-1600.${ext} 1600w`;
  return el('picture', {}, [
    el('source', { type: 'image/webp', srcset: srcset('webp'), sizes }),
    el('img', { src: `${src}-1600.jpg`, srcset: srcset('jpg'), sizes, alt, ...(lazy ? { loading: 'lazy' } : {}) }),
  ]);
}

/**
 * Barra "projeto → obra pronta". O range invisível cobre a imagem e cuida do
 * mouse e do teclado. No toque (pointer: coarse) o CSS desliga o range e só a
 * alça arrasta, para não roubar a rolagem nem pular com um toque na imagem.
 */
function comparador({ modelo, obra }, nome) {
  const camadaModelo = el('div', { class: 'modelo' }, [imagem(modelo, `Modelo do projeto: ${nome}`)]);
  const controle = el('input', { type: 'range', min: '0', max: '100', value: '50', 'aria-label': 'Comparar projeto e obra pronta' });
  const alca = el('span', { class: 'alca', 'aria-hidden': 'true', texto: '⇔' });
  const dica = el('span', { class: 'dica-imagem', 'aria-hidden': 'true', texto: 'Arraste para comparar' });
  const posicionar = (v) => {
    camadaModelo.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
    caixa.style.setProperty('--corte', `${v}%`);
    controle.setAttribute('aria-valuetext', `Projeto ${v}% · Obra ${100 - v}%`);
  };
  const usar = (v) => {
    controle.value = String(v);
    posicionar(v);
    dica.hidden = true;
  };
  const caixa = el('div', { class: 'comparador' }, [
    imagem(obra, `Obra pronta: ${nome}`),
    camadaModelo,
    el('span', { class: 'linha', 'aria-hidden': 'true' }),
    el('span', { class: 'marca-esq', texto: 'Projeto' }),
    el('span', { class: 'marca-dir', texto: 'Obra pronta' }),
    dica,
    controle,
    alca,
  ]);
  controle.addEventListener('input', () => usar(Number(controle.value)));

  const valorEm = (x) => {
    const r = caixa.getBoundingClientRect();
    return Math.round(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100)));
  };
  alca.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    alca.setPointerCapture(e.pointerId);
    const mover = (ev) => usar(valorEm(ev.clientX));
    const soltar = () => {
      alca.removeEventListener('pointermove', mover);
      alca.removeEventListener('pointerup', soltar);
      alca.removeEventListener('pointercancel', soltar);
    };
    alca.addEventListener('pointermove', mover);
    alca.addEventListener('pointerup', soltar);
    alca.addEventListener('pointercancel', soltar);
  });
  posicionar(50);
  return caixa;
}

/** Faixa "Do detalhamento à obra": o desenho abre na ampliação. */
function faixaDetalhe(obra) {
  const botao = el('button', { type: 'button', 'aria-label': `Ampliar: ${obra.detalhe.alt}` }, [
    imagem(obra.detalhe.src, obra.detalhe.alt, { sizes: '(max-width: 900px) 100vw, 60vw' }),
  ]);
  botao.addEventListener('click', () => abrirAmpliacao({ ...obra, imagens: [obra.detalhe] }, botao));
  return el('figure', { class: 'detalhe' }, [el('figcaption', { texto: 'Do detalhamento à obra' }), botao]);
}

/** Caso em destaque: mídia grande (ou barra de comparação) e ficha. */
function casoObra(obra) {
  const midia = obra.comparacao
    ? comparador(obra.comparacao, obra.nome)
    : el('div', { class: 'midia' }, [imagem(obra.imagens[0].src, obra.imagens[0].alt)]);
  const ficha = el('div', { class: 'ficha' }, [
    el('p', { class: 'rotulo', texto: 'Obra em destaque' }),
    el('h3', { texto: obra.nome }),
    el('p', {}, [el('strong', { texto: 'Ano: ' }), String(obra.ano)]),
    el('p', {}, [el('strong', { texto: 'Projetos ACE: ' }), obra.etiqueta]),
    el('p', { texto: obra.descricao }),
    ...(obra.comparacao ? [el('p', { class: 'dica', texto: 'Arraste a barra para comparar o modelo calculado com a obra construída.' })] : []),
    ...(obra.modelo3d ? [botao3d(obra, 'btn btn-contorno abrir-3d')] : []),
  ]);
  const colunaMidia = el('div', { class: 'caso-midia' }, [midia, ...(obra.detalhe ? [faixaDetalhe(obra)] : [])]);
  return el('article', { class: 'caso' }, [colunaMidia, ficha]);
}

function cardObra(obra) {
  const card = el('button', { type: 'button', class: 'obra', 'aria-label': `Ver imagens: ${obra.nome}` }, [
    imagem(obra.imagens[0].src, obra.imagens[0].alt, { sizes: '(max-width: 700px) 100vw, 400px' }),
    el('span', { class: 'ver', 'aria-hidden': 'true', texto: 'Ver imagens ↗' }),
    el('span', { class: 'info' }, [
      el('span', { class: 'etiqueta', texto: `${obra.ano} · ${obra.etiqueta}` }),
      el('span', { class: 'nome', texto: obra.nome }),
      el('span', { class: 'descricao', texto: obra.descricao }),
    ]),
  ]);
  card.addEventListener('click', () => abrirAmpliacao(obra, card));
  return card;
}

/** Lista das demais obras: grade com até 2 (uma só ocupa a linha), carrossel a partir de 3. */
function listaObras(obras) {
  const cards = obras.map(cardObra);
  if (obras.length <= LIMITE_GRADE) {
    return [el('div', { class: obras.length === 1 ? 'grade unica' : 'grade' }, cards)];
  }
  const trilho = el('div', { class: 'carrossel' }, cards);
  const seta = (rotulo, simbolo, sentido) => {
    const b = el('button', { type: 'button', class: 'seta', 'aria-label': rotulo, texto: simbolo });
    b.addEventListener('click', () => trilho.scrollBy({ left: sentido * trilho.clientWidth * 0.8, behavior: 'smooth' }));
    return b;
  };
  const anterior = seta('Anterior', '‹', -1);
  const proxima = seta('Próxima', '›', 1);
  const setas = el('div', { class: 'setas' }, [anterior, proxima]);

  // Some quando tudo cabe; desativa a seta da ponta em que o trilho está.
  const atualizar = () => {
    const folga = 1;
    setas.hidden = trilho.scrollWidth <= trilho.clientWidth + folga;
    anterior.disabled = trilho.scrollLeft <= folga;
    proxima.disabled = trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - folga;
  };
  trilho.addEventListener('scroll', atualizar, { passive: true });
  new ResizeObserver(atualizar).observe(trilho);
  return [setas, trilho];
}

/**
 * Desenha o portfólio inteiro: cabeçalho, caso em destaque (a obra com
 * `destaque: true`) e a lista com as demais. Sem obras, a seção some.
 */
export function desenharPortfolio(raiz, obras) {
  if (obras.length === 0) {
    raiz.replaceChildren();
    raiz.hidden = true;
    return;
  }
  const destaque = obras.find((o) => o.destaque);
  const demais = obras.filter((o) => o !== destaque);
  const cabecalho = el('div', { class: 'cabecalho' }, [
    el('p', { class: 'rotulo', texto: 'Portfólio' }), el('h2', { class: 'titulo', texto: 'Projetos notáveis entregues' }),
  ]);
  raiz.replaceChildren(
    cabecalho,
    ...(destaque ? [casoObra(destaque)] : []),
    ...(demais.length ? listaObras(demais) : []),
  );
}

let galeria = null;
let navegar = () => {};

/** Cria uma vez a janela da galeria; as setas do teclado navegam entre as imagens. */
function obterGaleria() {
  if (galeria) return galeria;
  galeria = janelaModal('ampliacao');
  galeria.dialogo.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') navegar(-1);
    if (e.key === 'ArrowRight') navegar(1);
  });
  return galeria;
}

/**
 * Galeria da obra: uma imagem por vez, com contagem, legenda (o alt) e botões
 * ‹ ›. Desenhos técnicos (`prancha`) viram link para o arquivo de 1600 px em
 * nova aba, onde o zoom nativo do navegador (pinça no celular) deixa ler as cotas.
 * Obras com `modelo3d` ganham o botão "Explorar em 3D", que troca a galeria
 * pelo visualizador.
 */
export function abrirAmpliacao(obra, quemAbriu = document.activeElement) {
  const { dialogo, abrir } = obterGaleria();
  const total = obra.imagens.length;
  let atual = 0;

  const contagem = el('span', { class: 'contagem', 'aria-live': 'polite' });
  const anterior = el('button', { type: 'button', class: 'anterior', 'aria-label': 'Imagem anterior', texto: '‹' });
  const proxima = el('button', { type: 'button', class: 'proxima', 'aria-label': 'Próxima imagem', texto: '›' });
  const navegacao = el('div', { class: 'navegacao' }, [anterior, contagem, proxima]);
  navegacao.hidden = total < 2;
  const quadro = el('figure', { class: 'quadro' });
  const dicaZoom = el('p', { class: 'dica-zoom', texto: 'Clique ou toque no desenho para abrir em tamanho real ↗' });
  const acoes = el('div', { class: 'acoes' }, [
    navegacao,
    ...(obra.modelo3d ? [botao3d(obra, 'abrir-3d', () => { dialogo.close(); return quemAbriu; })] : []),
  ]);

  const mostrar = (n) => {
    atual = Math.min(total - 1, Math.max(0, n));
    const { src, alt, prancha } = obra.imagens[atual];
    const figura = imagem(src, alt, { lazy: false, sizes: '90vw' });
    const midia = prancha
      ? el('a', { class: 'original', href: `${src}-1600.jpg`, target: '_blank', rel: 'noopener', 'aria-label': `Abrir em tamanho real: ${alt}` }, [figura])
      : figura;
    quadro.replaceChildren(midia, el('figcaption', { class: 'legenda', texto: alt }));
    contagem.textContent = `${atual + 1} / ${total}`;
    anterior.disabled = atual === 0;
    proxima.disabled = atual === total - 1;
    dicaZoom.hidden = !prancha;
  };
  navegar = (passo) => mostrar(atual + passo);
  anterior.addEventListener('click', () => navegar(-1));
  proxima.addEventListener('click', () => navegar(1));

  dialogo.replaceChildren(topoDaJanela(`${obra.nome} · ${obra.ano}`, dialogo), quadro, dicaZoom, acoes);
  mostrar(0);
  abrir(quemAbriu);
}

/** @typedef {import('./obras.js').Obra} Obra */
import { el, janelaModal, topoDaJanela } from './dom.js';

// Versão exata: só trocar depois de conferir o visualizador com a nova.
export const URL_MODEL_VIEWER = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
const MENSAGEM_ERRO = 'Não foi possível carregar o modelo 3D.';
const MATERIAL_CASA = 'casa';

let carregamento = null;
let janela = null;

/** Injeta o script do <model-viewer> no primeiro uso. Se falhar, a próxima abertura tenta de novo. */
function carregarModelViewer() {
  carregamento ??= new Promise((resolver, rejeitar) => {
    const script = el('script', { type: 'module', src: URL_MODEL_VIEWER });
    script.addEventListener('load', () => customElements.whenDefined('model-viewer').then(resolver));
    script.addEventListener('error', () => {
      script.remove();
      carregamento = null;
      rejeitar(new Error(`Falha ao carregar ${URL_MODEL_VIEWER}`));
    });
    document.head.append(script);
  });
  return carregamento;
}

/**
 * Atributos de câmera do <model-viewer> a partir de `modelo3d.camera`. O palco
 * em retrato (celular) usa `orbitaRetrato`, se houver.
 */
function atributosDeCamera(camera, palco) {
  if (!camera) return {};
  const retrato = palco.clientHeight > palco.clientWidth;
  const orbita = (retrato && camera.orbitaRetrato) || camera.orbita;
  const pares = [
    ['camera-target', camera.alvo],
    ['camera-orbit', orbita],
    ['field-of-view', camera.campo],
    ['min-camera-orbit', camera.minimo],
    ['max-camera-orbit', camera.maximo],
  ];
  return Object.fromEntries(pares.filter(([, valor]) => valor));
}

/** Botão "Mostrar casa": alterna o alfa do material da casa entre o original e zero. */
function alternadorDaCasa(visor) {
  const botao = el('button', { type: 'button', class: 'alternar-casa', 'aria-pressed': 'true', texto: 'Mostrar casa' });
  botao.disabled = true;
  let alfaOriginal = null;
  botao.addEventListener('click', () => {
    const material = visor.model?.materials.find((m) => m.name === MATERIAL_CASA);
    if (!material) return;
    const [r, g, b, a] = material.pbrMetallicRoughness.baseColorFactor;
    alfaOriginal ??= a;
    const mostrar = botao.getAttribute('aria-pressed') !== 'true';
    material.setAlphaMode('BLEND');
    material.pbrMetallicRoughness.setBaseColorFactor([r, g, b, mostrar ? alfaOriginal : 0]);
    botao.setAttribute('aria-pressed', String(mostrar));
  });
  return botao;
}

/**
 * Abre o modelo 3D da obra numa janela própria. O <model-viewer> só é baixado
 * aqui, no primeiro clique; nada de 3D entra no carregamento da página.
 *
 * @param {Obra} obra  precisa de `modelo3d`
 * @param {HTMLElement} quemAbriu  recebe o foco de volta ao fechar
 */
export async function abrirModelo3d(obra, quemAbriu) {
  janela ??= janelaModal('visualizador');
  const { src, alt, casa, camera } = obra.modelo3d;

  const status = el('p', { class: 'carregando', role: 'status', texto: 'Carregando o modelo 3D…' });
  const erro = el('p', { class: 'erro-3d', role: 'alert', texto: MENSAGEM_ERRO });
  erro.hidden = true;
  const dica = el('p', { class: 'dica-3d', texto: 'Arraste para girar · role ou pince para aproximar' });
  const palco = el('div', { class: 'palco' }, [status, erro, dica]);
  const topo = topoDaJanela(`${obra.nome} · modelo 3D`, janela.dialogo);
  janela.dialogo.replaceChildren(topo, palco);
  janela.abrir(quemAbriu);

  const falhar = (motivo) => {
    console.error('Falha no modelo 3D:', motivo);
    status.hidden = true;
    dica.hidden = true;
    erro.hidden = false;
    palco.querySelector('model-viewer')?.remove();
    topo.querySelector('.alternar-casa')?.remove();
  };

  try {
    await carregarModelViewer();
  } catch (motivo) {
    falhar(motivo);
    return;
  }
  // A janela pode ter sido fechada ou reaberta com outra obra durante o download.
  if (!palco.isConnected) return;

  const giraSozinho = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Tone mapping neutro com exposição baixa: o concreto fica cinza e o aço
  // azul-acinzentado. Acima de ~0,8 os materiais claros saturam para branco.
  const visor = el('model-viewer', {
    src,
    alt,
    'camera-controls': '',
    'touch-action': 'pan-y',
    'interaction-prompt': 'none',
    'tone-mapping': 'neutral',
    exposure: '0.6',
    'shadow-intensity': '0.6',
    ...(giraSozinho ? { 'auto-rotate': '' } : {}),
    ...atributosDeCamera(camera, palco),
  });
  visor.addEventListener('camera-change', (e) => {
    if (e.detail?.source === 'user-interaction') visor.removeAttribute('auto-rotate');
  });
  visor.addEventListener('progress', (e) => {
    status.textContent = `Carregando o modelo 3D… ${Math.round((e.detail?.totalProgress ?? 0) * 100)}%`;
  });
  visor.addEventListener('error', (e) => falhar(e.detail ?? e));

  const alternar = casa ? alternadorDaCasa(visor) : null;
  if (alternar) topo.insertBefore(alternar, topo.querySelector('.fechar'));
  visor.addEventListener('load', () => {
    status.hidden = true;
    if (alternar) alternar.disabled = false;
  });
  palco.prepend(visor);
}

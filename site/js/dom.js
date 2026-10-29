/** Cria um elemento; `texto` vira textContent, o resto vira atributo. */
export function el(tag, atributos = {}, filhos = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(atributos)) {
    if (k === 'texto') e.textContent = v;
    else e.setAttribute(k, v);
  }
  e.append(...filhos);
  return e;
}

/**
 * Janela modal (<dialog>) que fecha com Esc ou clique fora e devolve o foco a
 * quem a abriu.
 */
export function janelaModal(classe) {
  const dialogo = el('dialog', { class: classe });
  let origem = null;
  dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });
  dialogo.addEventListener('close', () => origem?.focus());
  document.body.append(dialogo);
  return {
    dialogo,
    abrir(quemAbriu) {
      origem = quemAbriu;
      dialogo.showModal();
    },
  };
}

/** Topo das janelas: título e botão de fechar com 44 px. */
export function topoDaJanela(titulo, dialogo) {
  const fechar = el('button', { type: 'button', class: 'fechar', 'aria-label': 'Fechar', texto: '×' });
  fechar.addEventListener('click', () => dialogo.close());
  return el('div', { class: 'topo' }, [el('h3', { texto: titulo }), fechar]);
}

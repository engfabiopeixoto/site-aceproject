const LIMIAR_SECAO = 0.4;

/**
 * Marca no menu a seção em que o visitante está: o link ganha `ativo` e
 * aria-current, e a seção ganha `atual`. Seções sem link próprio apontam
 * para outro item com data-menu; sem data-menu, nenhum item fica ativo.
 */
export function marcarSecaoAtiva() {
  const secoes = [...document.querySelectorAll('main > section[id]')];
  const links = [...document.querySelectorAll('header nav a:not(.cta)')];

  const atualizar = () => {
    // No fim da página a última seção é a atual, mesmo que curta demais para
    // alcançar a linha de referência (ex.: o contato).
    const noFim = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    const linha = scrollY + innerHeight * LIMIAR_SECAO;
    const passadas = secoes.filter((s) => s.offsetTop <= linha);
    const atual = noFim ? secoes[secoes.length - 1] : passadas[passadas.length - 1];
    const alvo = atual ? `#${atual.dataset.menu ?? atual.id}` : null;
    secoes.forEach((s) => s.classList.toggle('atual', s === atual));
    for (const a of links) {
      const ativo = a.getAttribute('href') === alvo;
      a.classList.toggle('ativo', ativo);
      if (ativo) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  };

  addEventListener('scroll', atualizar, { passive: true });
  addEventListener('hashchange', atualizar);
  atualizar();
}

/** Revela elementos .revelar quando entram na tela. */
export function revelarAoRolar() {
  const observador = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('visivel');
      observador.unobserve(e.target);
    }
  }, { threshold: 0.15 });
  document.querySelectorAll('.revelar').forEach((el) => observador.observe(el));
}

/**
 * Menu recolhível do celular: abre no botão e fecha ao escolher um link,
 * com Esc (devolvendo o foco ao botão) ou ao tocar fora do cabeçalho.
 */
export function ligarMenuCelular() {
  const header = document.querySelector('header');
  const botao = header.querySelector('.abrir-menu');
  const aberto = () => botao.getAttribute('aria-expanded') === 'true';
  const definir = (abrir) => {
    header.classList.toggle('menu-aberto', abrir);
    botao.setAttribute('aria-expanded', String(abrir));
    botao.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
  };
  botao.addEventListener('click', () => definir(!aberto()));
  header.querySelectorAll('nav a').forEach((a) => a.addEventListener('click', () => definir(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !aberto()) return;
    definir(false);
    botao.focus();
  });
  document.addEventListener('click', (e) => {
    if (aberto() && !header.contains(e.target)) definir(false);
  });
}

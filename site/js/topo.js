const movimentoReduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Alterna os slides do topo, atualizando pontos e legenda. O `data-foco` de
 * cada slide vira o `object-position` da imagem (ex.: "center 70%").
 */
export function iniciarCarrossel(raiz, intervaloMs = 6000) {
  const slides = [...raiz.querySelectorAll('.slide')];
  const pontos = [...raiz.querySelectorAll('.pontos button')];
  const legenda = raiz.querySelector('.legenda');
  let atual = 0;

  for (const s of slides) {
    const img = s.querySelector('img');
    if (s.dataset.foco && img) img.style.objectPosition = s.dataset.foco;
  }

  const mostrar = (n) => {
    atual = n;
    slides.forEach((s, i) => s.classList.toggle('ativo', i === n));
    pontos.forEach((p, i) => {
      p.classList.toggle('ativo', i === n);
      if (i === n) p.setAttribute('aria-current', 'true');
      else p.removeAttribute('aria-current');
    });
    legenda.textContent = slides[n].dataset.legenda;
  };

  pontos.forEach((p, i) => p.addEventListener('click', () => mostrar(i)));
  if (slides.length < 2 || movimentoReduzido()) return;

  // Pausa enquanto o visitante lê ou navega pelo topo (WCAG 2.2.2).
  let pausado = false;
  raiz.addEventListener('mouseenter', () => { pausado = true; });
  raiz.addEventListener('mouseleave', () => { pausado = false; });
  raiz.addEventListener('focusin', () => { pausado = true; });
  raiz.addEventListener('focusout', () => { pausado = false; });
  setInterval(() => { if (!pausado) mostrar((atual + 1) % slides.length); }, intervaloMs);
}

/**
 * Conta de um valor inicial até data-contar quando o número entra na tela.
 * O texto opcional de data-sufixo (ex.: "+") acompanha cada valor.
 */
export function iniciarContadores(raiz) {
  const numeros = [...raiz.querySelectorAll('[data-contar]')];
  if (movimentoReduzido()) return;

  const contar = (el) => {
    const fim = Number(el.dataset.contar);
    const sufixo = el.dataset.sufixo ?? '';
    let valor = fim > 100 ? fim - 30 : 0;
    el.textContent = `${valor}${sufixo}`;
    const passo = setInterval(() => {
      valor += 1;
      el.textContent = `${valor}${sufixo}`;
      if (valor >= fim) clearInterval(passo);
    }, 40);
  };

  const observador = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      contar(e.target);
      observador.unobserve(e.target);
    }
  }, { threshold: 0.5 });
  numeros.forEach((n) => observador.observe(n));
}

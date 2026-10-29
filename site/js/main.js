// Ponto de entrada do site: liga os módulos de cada seção.
// Cada etapa roda isolada: um erro numa seção não derruba as outras nem deixa
// conteúdo escondido. A classe `js` só entra depois que a revelação está ligada.
import { ligarLinksDeContato } from './contato.js';
import { iniciarCarrossel, iniciarContadores } from './topo.js';
import { OBRAS } from './obras.js';
import { desenharPortfolio } from './portfolio.js';
import { ligarMenuCelular, marcarSecaoAtiva, revelarAoRolar } from './navegacao.js';

function etapa(nome, fn) {
  try {
    fn();
  } catch (erro) {
    console.error(`Falha ao iniciar ${nome}:`, erro);
  }
}

etapa('revelação ao rolar', () => {
  revelarAoRolar();
  document.documentElement.classList.add('js');
});
etapa('portfólio', () => desenharPortfolio(document.querySelector('#portfolio'), OBRAS));
etapa('links de contato', () => ligarLinksDeContato(document));
etapa('carrossel do topo', () => iniciarCarrossel(document.querySelector('#topo')));
etapa('contadores', () => iniciarContadores(document));
etapa('seção ativa no menu', marcarSecaoAtiva);
etapa('menu do celular', ligarMenuCelular);

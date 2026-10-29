// Fonte única dos canais de contato da ACE Project.
const MENSAGEM_WHATSAPP = 'Olá, ACE Project! Vim pelo site e gostaria de um orçamento.';

export const WHATSAPP_URL = `https://wa.me/5586999029300?text=${encodeURIComponent(MENSAGEM_WHATSAPP)}`;
export const EMAIL = 'contato@aceproject.com.br';
export const INSTAGRAM_URL = 'https://instagram.com/ace.projectpi';

const DESTINOS = {
  whatsapp: WHATSAPP_URL,
  email: `mailto:${EMAIL}`,
  instagram: INSTAGRAM_URL,
};

/** Preenche o href de todo elemento marcado com data-contato. */
export function ligarLinksDeContato(raiz) {
  for (const link of raiz.querySelectorAll('[data-contato]')) {
    const destino = DESTINOS[link.dataset.contato];
    if (destino) link.href = destino;
    else console.error(`data-contato desconhecido: ${link.dataset.contato}`);
  }
}

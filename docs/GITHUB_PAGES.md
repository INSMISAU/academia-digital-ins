# Academia Digital do INS — GitHub Pages

## Acesso para demonstração

Endereço previsto após activar o Pages: https://insmisau.github.io/academia-digital-ins/

A entrada, o catálogo e o percurso de demonstração não pedem conta, convite ou autorização prévia. Abrir **Catálogo de cursos → Introdução à Academia Digital → Experimentar este curso**.

A interface é servida pelo GitHub Pages. O servidor já existente continua a guardar os percursos, corrigir avaliações e produzir os PDFs. Não se trata de um iframe nem de um redireccionamento da página inicial.

## Publicação no mesmo modelo das restantes plataformas INS

1. Em **Settings → Pages**, escolher **Deploy from a branch**.
2. Seleccionar **main** e **/(root)**, e guardar.
3. Aguardar o deployment do Pages e abrir o endereço apresentado pelo GitHub.

O repositório estava privado na verificação de 16/10/2026. O GitHub mostrava “Upgrade or make this repository public to enable Pages”. A alteração da visibilidade torna o código e o histórico acessíveis ao público; requer decisão da proprietária. Esta preparação não muda a visibilidade nem contrata um plano.

Os ficheiros publicados estão na raiz: `index.html`, `favicon.svg`, `assets/` e `.nojekyll`. O código-fonte permanece no repositório. Não é necessário adicionar GitHub Actions para compilar a página no servidor.

## Alterações futuras

Com as dependências instaladas na versão do ficheiro de lock:

```sh
pnpm build:pages
node tests/pages-client.mjs
```

Incluir os ficheiros gerados no mesmo commit da alteração. A compilação usa a interface existente de `app/page.tsx`; não há uma segunda interface para manter.

O servidor continua no projecto Sites existente. Alterações à API exigem a publicação desse projecto, além do commit no GitHub. Alterações apenas à interface exigem reconstruir os ficheiros estáticos e publicar o commit no Pages.

## Continuidade e administração

- Os dados existentes e as sessões no endereço anterior são preservados.
- O Pages cria automaticamente uma sessão de demonstração por navegador, guardada por 30 dias nos dados locais deste site. Não pede nome, e-mail ou palavra-passe.
- Abrir outro endereço, limpar os dados do site ou mudar de dispositivo inicia uma sessão separada. Não foi acrescentada sincronização entre dispositivos à Academia nesta alteração.
- O botão Administração abre o acesso administrativo existente. A protecção da edição e dos dados não impede os visitantes de experimentar o percurso.
- PDF e verificação por código continuam a usar os serviços existentes. A verificação abre numa nova aba.
- Não foram modificados os cursos do módulo formativo, o ebook, o manual, o CMS ou o Supabase.

## Testes

Os testes de integração utilizam exclusivamente uma base temporária. Ver o registo em `HISTORICO_PAGES_20261016.md`.

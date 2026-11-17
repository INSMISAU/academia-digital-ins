# Simplificação da navegação administrativa — 17/11/2026

## Pedido autorizado

Após a verificação das ligações repetidas, Percília autorizou a remoção de
«Administrar Academia», a manutenção de uma única ligação «Voltar à Academia»
e a preservação de «Sair». Todos os módulos e funcionalidades validados devem
permanecer disponíveis.

Base no GitHub: `1ddb8eea2b00ca7e3bd8cf4cb4aa2031f4eacbcf`.
Base do serviço: `d78929798ca7dc5f30c3ec7a40e0a872c1f6c56b`.

## Alteração

- Removida a ligação repetida «Administrar Academia» da barra de sessão.
- Preservada a entrada «Administração» do cabeçalho.
- A barra passa a apresentar «Voltar à Academia» e «Sair».
- O menu de gestão deixa de repetir o regresso à Academia quando a barra
  de sessão está presente. Mantém o regresso nos percursos por perfil que
  não apresentam essa barra.
- Preservados os 19 itens do menu administrativo e respectivas ligações,
  a identificação «Administração» e os percursos legados de validação.

Nenhuma alteração a autenticação, contas, palavras-passe, permissões, API,
base de dados, conteúdos, cursos ou imagens. Os ficheiros de compilação
anteriores e os registos de histórico são preservados.

## Verificação

- TypeScript sem erros e `git diff --check` sem problemas.
- Testes existentes `administration-screen.mjs` e `pages-client.mjs` passaram.
- Renderização dos componentes efectivos em seis situações: painel,
  cursos, área pública com sessão, gestão por perfil, visitante e validação.
  Confirmada a ausência de «Administrar Academia» e de ligações duplicadas
  de regresso; os menus de gestão permanecem nas vistas administrativas.
- Conferência visual local do cabeçalho, barra e menu, com o CSS compilado.
  Esta conferência usa apenas a navegação renderizada localmente, sem dados
  pessoais, contas criadas ou operações na plataforma publicada.
- Compilação GitHub Pages concluída. A compilação do serviço integra o
  empacotamento antes da publicação.

Alcance: simplificação das ligações de navegação. Este registo não declara
concluída a validação institucional de toda a plataforma.

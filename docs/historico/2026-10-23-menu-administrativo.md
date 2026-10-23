# Menu administrativo — 23/10/2026

## Ponto de retoma

Retomado o chat «Ver histórico sem alterar», a partir do pedido de corrigir
o menu administrativo que aparecia em todas as abas da Academia.
Base confirmada: `18d3f841d2acebac81142b763943963ad30d66a0`.

## Correcção

A barra «Gestão da Academia» dependia apenas de `data.isAdmin`. Esse valor
continua verdadeiro quando a equipa navega para uma página pública a partir
da administração. A barra passa a exigir também que a página actual seja
administrativa, usando a lista de páginas públicas já existente.

- Visível em Cursos e conteúdos, Revisão editorial, Turmas, Biblioteca de
  materiais, Relatórios e Auditoria.
- Oculta em Início, Catálogo de cursos, Áreas de formação, Biblioteca, Meus
  cursos, Certificados e Sobre a Academia.
- O botão Administração continua disponível e permite regressar à gestão.

## Preservação

Nenhuma alteração a contas, perfis, API, base de dados, conteúdos ou imagens.
Nenhum registo foi apagado. O eBook e o módulo formativo não foram alterados.
Todos os assets anteriores permanecem no repositório. O novo pacote acrescenta
um JS e actualiza a página inicial para o utilizar. A alteração ao código da
página limita-se à condição de apresentação da barra.

## Verificações

- Compilação GitHub Pages concluída.
- TypeScript sem erros.
- Testes existentes de catálogo e cliente Pages passaram.
- Navegador: seis páginas administrativas com barra e sete páginas públicas
  sem barra, incluindo navegação a partir da administração.
- Regresso à administração pelo botão do cabeçalho e regresso à página pública
  por Voltar à Academia verificados.
- Biblioteca reaberta com `?administracao=1` sem a barra de gestão.

Os testes da correcção no navegador usaram uma cópia local da compilação,
com dados fictícios e API local. A compilação entregue conserva a origem
de API existente. O erro original foi confirmado na plataforma publicada.
Não foram gravados dados nem realizados testes de edição em produção.

## Aplicação

O commit é efectuado pela utilizadora, conforme orientação do projecto.
Este registo documenta uma correcção preparada e testada, ainda não publicada.
Depois do commit, sincronizar esse mesmo commit no serviço administrativo,
preservando a versão e o histórico anteriores.

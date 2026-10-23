# Plataforma integrada — 23 de Outubro de 2026

Base: commit da utilizadora 5e58fbfbefec0a387bd961670ae77e4aa8f47fd9.
Este pacote consolida e amplia o pacote anterior de cartões. Não foi criado
um commit remoto, nem publicada esta versão. A utilizadora aplica os ficheiros
e faz um único commit; a sincronização do mesmo commit no serviço vem depois.

## Orientação e fontes

Avançar a plataforma de acordo com INS ACADEMIA DIGITAL(5).docx e
TELESAUDE PRETESTE(2).docx, incluindo as onze imagens. Só contas, autenticação,
perfis e respectivas permissões ficam deliberadamente para a etapa final.
Não inventar conteúdos, pessoas, cursos ou perguntas clínicas.

## Alterações entregues

- Portal com programas, formadores, notícias, eventos, biblioteca e anúncios.
- Painel administrativo e navegação de gestão, com estados vazios reais.
- Registos editoriais no servidor, histórico e detecção de conflitos.
- Construtor de cursos com módulos independentes, objectivos, notas, aulas,
  ordenação, materiais publicados e avaliações. Rascunhos existentes têm
  autosave após 1,5 segundos, além da gravação explícita.
- Doze blocos de aula, incluindo texto formatado e notas; PDF incorporado com
  ligação alternativa e alinhamento justificado preservado.
- Pré/pós-testes com quatro tipos de questão, prazo no servidor, tentativas,
  aleatoriedade, gravação de respostas e revisão completa/reabertura. O
  pré-teste não conta na nota final; pós-testes integram a elegibilidade.
- Inscrições individuais e CSV; associação a turmas com vagas efectivas,
  gestão de capacidade/datas e presenças por sessão.
- Relatórios filtrados por curso/programa/formador/turma/província/instituição
  e período, CSV, Excel XLSX e impressão para PDF.
- Configuração institucional de nome, apresentação, Sobre, logótipo, favicon
  e cor principal.
- Cartões do curso e eBook lado a lado em ecrãs largos. Exemplos antigos não
  pedidos deixam de ser apresentados; os dados antigos são preservados.
- O build Pages conserva os bundles anteriores, em vez de remover assets.

## Dados e publicação

A migração 0003_academy_workspace acrescenta cinco tabelas e índices, sem
remover ou alterar destrutivamente tabelas anteriores e sem semear conteúdos.
O esquema e o snapshot Drizzle acompanham a migração. A migração ainda NÃO
foi aplicada à produção. A publicação do backend deverá aplicar as migrações
pendentes pelo fluxo normal do serviço, após a sincronização do commit.

A configuração do serviço e o destino de API do Pages foram preservados.
Publicar apenas os ficheiros estáticos no GitHub Pages não actualiza a API;
por isso o mesmo commit precisa de ser sincronizado no backend. Este pacote
não inclui dados de QA, tokens, dependências ou ficheiros do ambiente local.

As ferramentas estão implementadas; as páginas só passam a ter informação
institucional quando os registos aprovados forem introduzidos na gestão.

## Verificação

- TypeScript sem erros e builds Worker/Pages concluídos.
- 180 verificações de integração existentes e 129 verificações novas.
- Conteúdo (12 blocos), catálogo, cliente Pages e utilitários CSV/correcção/XLSX.
- XLSX aberto com openpyxl: acentos, números, primeira linha congelada e
  conteúdo semelhante a fórmula mantido como texto.
- Navegador com Worker e base local: navegação dos novos módulos, gravação e
  reabertura de programa após recarregar, preservação de versão anterior,
  criação de rascunho de curso e módulo com objectivos, construtor de cursos,
  aula guardada e reaberta após gravação automática.
- Todos os dados fictícios dos testes existem apenas em bases locais isoladas.

A matriz docs/VERIFICACAO_REQUISITOS_20261023.md descreve as lacunas. Entre elas:
certificado institucional configurável, tempo real de estudo, trabalhos,
fórum/notificações, pagamentos/sazonalidade, publicação agendada, exame completo,
tradução, adaptação de perguntas e standards/integrações. A navegação completa
não deve ser apresentada como conclusão de todos os requisitos dos documentos.

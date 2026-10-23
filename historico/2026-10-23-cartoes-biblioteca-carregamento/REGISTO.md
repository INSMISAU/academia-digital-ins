# Cartões, Biblioteca e carregamento — 23/10/2026

Base: `4df1b81fa474331a31a41eaa3083b325f3279a80`.

## Âmbito autorizado
Uniformizar os cartões, acrescentar sombras laterais suaves, melhorar os espaçamentos/alinhamentos, corrigir a pesquisa e a mensagem da Biblioteca e tratar o carregamento indefinido. Preservar os outros pontos da Academia e o histórico.

## Alterações
- Cartões de curso e eBook com cabeçalho, título, descrição e zona de acção no mesmo padrão. Aplicação do mesmo acabamento aos cartões editoriais, de materiais, percursos, certificados, indicadores e atalhos.
- Sombreado lateral, bordas e cantos consistentes, foco/hover discreto e adaptação a ecrãs estreitos. As sombras não são impressas.
- eBook oficial integrado na lista pesquisável da Biblioteca. A mensagem sem resultados só aparece quando nenhum material corresponde ao filtro. A ligação mantém https://insmisau.github.io/manual-surtos/.
- Consultas de leitura com prazo de 20 segundos, incluindo leitura da resposta. Quando o servidor demora, é apresentada uma mensagem e o botão Tentar novamente já existente. A página seleccionada é preservada durante a falha.
- Não há reenvio automático de gravações. A indisponibilidade do servidor não é mascarada por dados fictícios.

## Preservação
Sem alterações nas APIs, na base de dados, nas migrações, nos acessos, nas regras de publicação, nos conteúdos dos cursos, no eBook ou no módulo formativo. Os ficheiros compilados anteriores permanecem no repositório. A cópia dos ficheiros substituídos está em HISTORICO_ANTES no pacote de entrega. Nenhum commit, push ou publicação foi efectuado por esta intervenção.

## Validação
- TypeScript sem erros; compilação Worker e GitHub Pages concluídas.
- Testes de carregamento: ligação pendente, corpo da resposta pendente, prazo, libertação de temporizadores, recuperação por nova tentativa, resposta inválida, falha de rede e preservação de gravações/sessões.
- Testes existentes de catálogo, conteúdos, cliente Pages e utilitários concluídos.
- 180 verificações de integração e 129 de workspace concluídas; teste da entrada administrativa compilada concluído.
- Conferência visual local do início, Biblioteca e painel administrativo; larguras de 390 e 768 pixels verificadas em vistas locais.
- Pesquisa do eBook por surtos, pesquisa sem correspondência e reposição após limpar o filtro verificadas no navegador.

## Aplicação
Copiar somente o conteúdo de PARA_COMMIT para a raiz de INSMISAU/academia-digital-ins, preservando os caminhos. A interface compilada está incluída; não é preciso compilar para publicar pelo GitHub Pages. Não criar outra pasta PARA_COMMIT no repositório. O endereço de serviço chatgpt.site tem publicação própria; este ZIP não o publica.

## Limite da correcção de carregamento
O prazo e a nova tentativa eliminam a espera indefinida na interface. Não constituem garantia de disponibilidade permanente do servidor. A versão publicada será confirmada depois do commit da utilizadora.

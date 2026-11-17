# Como carregar esta entrega

Esta entrega foi preparada em ficheiros; **não alterou o GitHub nem o serviço publicado**.

## Ficheiros

- **00_INS_Academia_Estado_Actual_20261117.zip**: cópia de segurança do código anterior. Guardar; não carregar como alteração.
- **01_INS_Academia_Codigo_20261117.zip**: código actualizado, interface React e serviço, dependências e migrações. Contém a pasta `CARREGAR_NA_RAIZ`.
- **02_INS_Academia_Pages_20261117.zip**: página e recursos compilados para GitHub Pages. Aplicar depois de o serviço estar actualizado.
- **03_INS_Academia_Registo_Auditoria_20261117.zip**: relatórios, testes, inventários e instruções. A pasta `CARREGAR_NA_RAIZ` contém apenas documentação/testes que podem ficar no repositório; os resultados e inventários ficam fora dessa pasta.

## Ordem de carregamento

1. Guardar o ZIP 00 num local seguro.
2. Descompactar o ZIP 01. Abrir a pasta `CARREGAR_NA_RAIZ` e copiar **o conteúdo dessa pasta**, mantendo `app`, `components`, `db`, `drizzle`, `lib`, `public`, etc., para a raiz do repositório. Não criar uma pasta chamada `CARREGAR_NA_RAIZ` no GitHub.
3. Confirmar o diff e efectuar o commit do código. Não carregar o próprio ZIP como substituto do código. Não juntar ficheiros `route.ts` de pastas diferentes numa única pasta.
4. **Actualizar também o serviço** `https://ins-academia-digital.perciliamuianga.chatgpt.site` a partir deste mesmo código. A simples alteração de ficheiros no GitHub Pages não actualiza a API, o banco D1 ou o armazenamento R2. O backend actual publicado é a versão 18. Guardar o seu identificador antes da nova publicação.
5. Antes da actualização de produção, obter uma cópia D1/R2 pelo procedimento do operador. O ZIP 00 só contém código. Aplicar as migrações incrementais no serviço pelo processo de publicação existente. Não executar os testes contra a base real.
6. Confirmar a nova versão do serviço, os resultados dos testes e o acesso da equipa. A configuração `INS_OPEN_ADMIN_REGISTRATION=1` desta fase deve permanecer como está até decisão expressa em contrário.
7. Descompactar e aplicar o conteúdo de `CARREGAR_NA_RAIZ` do ZIP 02 na raiz do GitHub. Manter os recursos antigos em `assets`; não apagar ficheiros para “limpar” a entrega.
8. Carregar a documentação/testes do ZIP 03 e guardar os inventários e resultados. Rever o relatório de estado antes de apresentar a Academia como concluída.
9. Abrir a Academia, fazer uma actualização completa da página e testar: entrada com duas contas diferentes; cursos e rascunhos; notícias; evento com vagas; entrega de trabalho; correcção; emissão/verificação de certificado; mudança de conta e privacidade.

Se o carregador web do GitHub repetir “we can’t process that file”, usar uma cópia local do repositório/GitHub Desktop e copiar as pastas preservando os caminhos. Não repetir o carregamento de ficheiros soltos com nomes iguais. Os pacotes foram separados para caberem abaixo do limite habitual de 100 ficheiros por operação, contando apenas `CARREGAR_NA_RAIZ`.

## Commits sugeridos

**Código (ZIP 01)**

Título: `feat(academia): acrescentar gestão editorial, eventos e actividades com histórico`

Mensagem:

```
Acrescenta publicações com revisão preservada, eventos com inscrições e presenças,
actividades e correcção manual, regras do percurso e certificados com dados da emissão.
Integra os editores e os novos módulos na interface existente.
Inclui migrações incrementais e adaptadores configuráveis, preservando o acesso actual.
Mantém no relatório as limitações, serviços externos e requisitos ainda pendentes.
```

**GitHub Pages (ZIP 02)**

Título: `build(academia): actualizar os recursos publicados após a API`

Mensagem:

```
Actualiza a página e os recursos compilados da Academia.
Preserva os recursos anteriores e inclui o manifesto e o serviço de consulta offline.
Aplicar em conjunto com a versão correspondente do backend.
```

**Registo (ZIP 03)**

Título: `docs(academia): registar estado, auditoria e entrega de 17-11-2026`

Mensagem:

```
Regista a base preservada, as alterações implementadas e as pendências explícitas.
Acrescenta testes locais, evidências e instruções de aplicação e recuperação.
Não declara a Academia integralmente concluída nem validada visualmente.
```

## Recuperação

- Se ainda não houve publicação, repor os ficheiros anteriores afectados usando o ZIP 00 ou reverter os commits de entrega.
- Se houve publicação, repor em conjunto a versão do serviço e a versão do GitHub Pages compatíveis. Não apagar as novas tabelas para reverter código; novos registos podem já existir.
- Dados criados depois da publicação não estão no ZIP 00. A recuperação de dados usa o backup D1/R2 e o procedimento do operador.

## Construção e testes locais

Usar Node compatível com `package.json` e `pnpm-lock.yaml`, instalar as dependências do projecto, executar TypeScript, construir o serviço e GitHub Pages. Os scripts de teste criam bases temporárias. Não substituir as variáveis de ambiente reais por exemplos de teste.

O relatório separa implementações, integrações por configurar e itens ainda por completar. Não carregar este lote como se todas essas pendências estivessem resolvidas.

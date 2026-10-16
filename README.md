# Academia Digital do INS

Primeira versão integrada de demonstração, com acesso por link, administração protegida e dados fictícios.

**Estado:** não é ainda a plataforma nacional concluída. Não utilizar dados reais nem emitir certificação institucional.

## Demonstração

Endereço Pages previsto após activação: https://insmisau.github.io/academia-digital-ins/

Endereço existente, que continua disponível: https://ins-academia-digital.perciliamuianga.chatgpt.site

Configuração e publicação: [GitHub Pages](docs/GITHUB_PAGES.md).

Abra **Introdução à Academia Digital** e seleccione **Experimentar este curso**. Não é necessário criar conta para experimentar.

## Incluído
- Catálogo, aulas, avaliações de escolha única e progresso persistente.
- Revisão editorial, versões de cursos e auditoria.
- Inscrições fictícias e registo básico de turmas.
- Biblioteca de ficheiros, relatórios CSV e impressão.
- Certificados PDF de demonstração com código, QR e revogação.

## Documentação
- [Entrega e roteiro de apresentação](docs/ENTREGA.md)
- [Configuração do GitHub Pages](docs/GITHUB_PAGES.md)
- [Histórico da adaptação de 16/10/2026](docs/HISTORICO_PAGES_20261016.md)
- [Base técnica e execução local](docs/BASE_TECNICA.md)

## Estrutura
`app/`: interface e API; `db/`: esquema e acesso a dados; `drizzle/`: migrações; `public/`: recursos; `tests/`: teste de integração; `scripts/` e `build/`: ferramentas de execução e compilação.

## Desenvolvimento
Node.js >=22.13.0 e pnpm na versão indicada em package.json.

```sh
pnpm install --frozen-lockfile
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_exotic_veda.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_soft_the_call.sql
pnpm start
```

Aplicar todas as migrações de drizzle/ por ordem, apenas uma vez cada, incluindo 0001_soft_the_call.sql para a sessão de visitante e o catálogo de demonstração. Consultar a base técnica para desenvolvimento e detalhes do ambiente.

Após a compilação, `node tests/integration.mjs` executa os testes com uma base temporária isolada. O PDF de teste é guardado na pasta temporária do sistema.

## Alojamento e segurança
A interface estática está preparada para GitHub Pages, com `main / (root)`. Os serviços de progresso, avaliações e certificados continuam no Worker, D1 e R2 existentes. O repositório guarda o código, a interface compilada e as migrações, não a base de dados activa nem os ficheiros carregados.

A administração exige a identidade da proprietária autenticada pelo alojamento Sites. Cada visitante recebe uma sessão anónima isolada; apenas os seus percursos e PDFs ficam acessíveis. Contas institucionais, perfis editoriais separados e certificação oficial continuam pendentes. Outro alojamento exige uma fronteira de autenticação equivalente, que rejeite cabeçalhos de identidade forjados.

O Manual de Surtos, o CMS e as respectivas bases de dados são independentes deste projecto.

## Origem desta entrega
Evolução da versão Sites inicial com separação entre visitantes e administração, sessões anónimas, migração de demonstração e testes de isolamento. A compilação `pnpm build:pages` prepara os ficheiros da raiz para a publicação pelo Pages. O servidor mantém publicação própria no Sites. Ver o histórico de 16/10/2026 para a adaptação e os testes.

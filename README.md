# Academia Digital do INS

Primeira versão integrada de demonstração, com acesso privado e dados fictícios.

**Estado:** não é ainda a plataforma nacional concluída. Não utilizar dados reais nem emitir certificação institucional.

## Demonstração
https://ins-academia-digital.perciliamuianga.chatgpt.site

Na primeira abertura, seleccionar **Preparar demonstração** e experimentar **Introdução à Academia Digital**.

## Incluído
- Catálogo, aulas, avaliações de escolha única e progresso persistente.
- Revisão editorial, versões de cursos e auditoria.
- Inscrições fictícias e registo básico de turmas.
- Biblioteca de ficheiros, relatórios CSV e impressão.
- Certificados PDF de demonstração com código, QR e revogação.

## Documentação
- [Entrega, roteiro de apresentação, testes e limites](docs/ENTREGA.md)
- [Base técnica e execução local](docs/BASE_TECNICA.md)

## Estrutura
`app/`: interface e API; `db/`: esquema e acesso a dados; `drizzle/`: migrações; `public/`: recursos; `tests/`: teste de integração; `scripts/` e `build/`: ferramentas de execução e compilação.

## Desenvolvimento
Node.js >=22.13.0 e pnpm na versão indicada em package.json.

```sh
pnpm install --frozen-lockfile
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_exotic_veda.sql
pnpm start
```

Aplicar a migração apenas uma vez por base local nova. Consultar a base técnica para desenvolvimento e detalhes do ambiente.

Após a compilação, `node tests/integration.mjs` executa os testes com uma base temporária isolada. O PDF de teste é guardado na pasta temporária do sistema.

## Alojamento e segurança
A aplicação requer um servidor Worker, D1 e R2. **Não é um site estático para GitHub Pages.** O repositório guarda o código e as migrações, não a base de dados activa nem os ficheiros carregados.

O acesso actual depende da protecção privada do alojamento Sites. Autenticação própria, perfis separados e certificação oficial continuam pendentes. Não publicar esta versão num alojamento aberto sem implementar controlo de acesso no servidor.

O Manual de Surtos, o CMS e as respectivas bases de dados são independentes deste projecto.

## Origem desta entrega
Código da versão Sites `1f8d2695b69654e06662395c2facd61f7d18b636`. Exportação para GitHub com documentação de entrega, caminho portátil para o PDF de teste e exclusão do ficheiro gerado TypeScript. Esta cópia não activa sincronização automática nem publicação por GitHub Actions.

# Verificação local — 17 de Novembro de 2026

**Resultado: TypeScript sem erros, duas compilações concluídas e 16 conjuntos de testes aprovados. Não houve ensaio nem alteração na produção.**

| Ensaio | Âmbito | Resultado |
|---|---|---|
| `node tests/content.mjs` | Conteúdo antigo e estruturado, blocos e ligações | Aprovado |
| `node tests/catalogue.mjs` | Catálogo, filtros, pesquisa e retoma | Aprovado |
| `node tests/workspace-utils.mjs` | CSV, exportação XLSX e classificações | Aprovado |
| `node tests/pages-client.mjs` | Sessões, rotas e recursos do GitHub Pages | Aprovado |
| `node tests/administration-screen.mjs` | Estados do ecrã de acesso | Aprovado |
| `node tests/administration-entry.mjs` | Renderização inicial; não valida navegação visual | Aprovado |
| `node tests/accounts.mjs` | Contas, recuperação, sessões e isolamento (33 verificações) | Aprovado |
| `node tests/administration-login.mjs` | Email/senha próprios e sessões independentes (33 respostas) | Aprovado |
| `node tests/open-administration.mjs` | Entrada automática nesta fase e contas separadas (35 respostas) | Aprovado |
| `node tests/registration.mjs` | Inscrição, repetição e isolamento (22 respostas) | Aprovado |
| `node tests/registration-identity.mjs` | Fornecedores de identidade simulados (19 respostas) | Aprovado |
| `node tests/team-access.mjs` | Compatibilidade dos acessos técnicos anteriores (42 respostas) | Aprovado |
| `node tests/role-permissions.mjs` | Permissões finais opcionais, escopos e auditoria (138 verificações) | Aprovado |
| `node tests/integration.mjs` | Cursos, certificados, API, CORS e isolamento (181 verificações) | Aprovado |
| `node tests/workspace-integration.mjs` | Gestão, avaliações, revisões, inscrições e recursos (126 verificações) | Aprovado |
| `node tests/completion-integration.mjs` | Novos módulos: publicações, imagens, eventos, trabalhos, calendário, pacotes e privacidade (89 verificações) | Aprovado |

## Compilação

- `node node_modules/typescript/bin/tsc --noEmit`: código 0, sem diagnósticos.
- `npm run build`: código 0.
- `node scripts/build-pages.mjs`: código 0.
- `git diff --check`: sem erros de espaços ou conflitos.

Existem avisos de tamanho dos recursos, importação dinâmica também usada estaticamente e classificação estática de rotas pelo Vinext. A compilação termina com sucesso; não foi medido o desempenho em equipamento móvel.

## O que estes resultados não provam

- O navegador de pré-visualização apresentou uma página em branco neste ambiente. Não existe confirmação de revisão visual, navegação hidratada, dispositivos móveis, instalação PWA ou acessibilidade integral.
- Email, OAuth, pagamento e LRS reais não foram activados ou exercitados. Os testes de identidade usam fornecedores simulados.
- Os 138 ensaios de permissões verificam componentes já existentes para a configuração posterior. Não introduzem MFA na entrada actual da equipa.
- Os testes antigos de integração foram adaptados ao acesso por sessões pessoais: a administração exige sessão; a entrada sem identidade devolve 401. O registo normal e a entrada aberta desta fase continuam ensaiados separadamente.
- Os registos falsos são criados em D1/R2 temporários. Os erros propositadamente provocados por testes negativos podem aparecer nos logs; o resultado final de cada processo é o código 0.
- Uma imagem PNG sintética e um pacote SCORM mínimo não substituem os ensaios com todos os formatos/conteúdos institucionais.

## Conservação

A pasta `EVIDENCIAS` do ZIP de auditoria contém os resultados, comandos e logs destes ensaios. Os inventários SHA-256 identificam cada ficheiro da base e da entrega. As migrações 0000–0008 e os 48 recursos anteriormente versionados em `assets` foram preservados. As novas migrações são 0009, 0010 e 0011.

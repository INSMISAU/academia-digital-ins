# Validação anterior à publicação — 17/11/2026

## Autorização e base

Percília solicitou que o carregamento fosse tratado directamente, aplicando as melhorias preparadas, preservando o conteúdo validado, o acesso e o histórico. Informou que não tinha carregado os ZIPs.

Confirmados antes de iniciar: GitHub `e557114b3bedf79722ede6d50a3e9867716e8c7a`, serviço versão 18, configuração de entrada aberta por email/senha próprios `INS_OPEN_ADMIN_REGISTRATION=1`, revisão de configuração 4. A audiência do serviço permanece pública. Não foi pedida nem efectuada alteração de acessos ou segredos.

## Verificação

- Reutilizados os 16 conjuntos de testes aprovados e os inventários da entrega em ZIP.
- TypeScript, compilação do serviço e compilação Pages concluídos novamente.
- Repetidos os testes de cliente Pages, entrada administrativa e os 89 ensaios dos novos módulos após os primeiros ajustes visuais.
- A pré-visualização original servia o HTML do GitHub Pages. A revisão passou a usar o Worker compilado numa cópia temporária, com D1/R2 locais e identidade administrativa simulada no servidor de QA. Essa simulação não pertence ao código nem ao pacote publicado.
- Confirmada a apresentação pública e a abertura dos 19 módulos administrativos.
- Confirmadas as oito abas de gestão de curso: dados gerais, módulos e aulas, programa e notas, avaliações, actividades e fórum, disponibilidade e certificado, revisão/publicação e resultados.
- Criados apenas na base local um rascunho de notícia e um curso fictício. Confirmadas a gravação, a gravação automática da notícia e a conservação da revisão anterior no histórico.
- Não foram criadas contas, cursos, notícias, inscrições nem outros registos de ensaio na produção.

## Correcções encontradas na revisão

1. O formulário novo de publicação deixava de poder afirmar «Registo guardado» antes da primeira gravação; passa a indicar «Novo registo por guardar».
2. O selector de idioma passa para a navegação do cabeçalho; a barra administrativa mantém a largura prevista.
3. Criar um curso na gestão activa imediatamente o editor completo de gestão após guardar, sem exigir fechar e reabrir o curso.

## Preservação

As migrações acrescentam tabelas e índices. Não contêm DELETE, DROP, UPDATE ou ALTER sobre os registos anteriores. As migrações já aplicadas e os recursos anteriormente versionados permanecem intactos. Os conteúdos do curso existente e a ligação ao manual final não foram alterados.

Antes da publicação foram lidas integralmente, sem truncagem, sete tabelas para comparação posterior: courses (5), lessons (4), questions (6), academy_entries (1), enrollments (0), certificates (0), media (1). Este registo não é um backup completo de D1/R2.

## Limites

Esta revisão verifica os percursos descritos num navegador de computador. Não constitui aceitação institucional, auditoria formal WCAG, ensaio integral em telemóveis nem teste de fornecedores externos. As pendências funcionais documentadas em `docs/ESTADO_IMPLEMENTACAO_20261117.md` permanecem explícitas. As limitações visuais anteriormente registadas pertencem ao ensaio inicial; a revisão descrita acima foi conseguida posteriormente.

A confirmação de publicação, versão e comparação de dados será registada separadamente, apenas após o resultado efectivo.

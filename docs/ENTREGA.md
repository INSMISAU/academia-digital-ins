# Academia Digital do INS — versão de demonstração

> Registo da entrega inicial. Para a adaptação ao GitHub Pages e os testes de 16/10/2026, consultar [GitHub Pages](GITHUB_PAGES.md) e [Histórico](HISTORICO_PAGES_20261016.md).

## Estado
Versão integrada para demonstração por link, com administração reservada à proprietária autenticada. Não constitui o produto nacional concluído. Apenas dados fictícios; sem certificação oficial. Independente do Manual e do CMS existentes.

## Funcionalidades implementadas
Catálogo, cursos e aulas de texto, avaliação de escolha única com correcção no servidor, inscrições fictícias, progresso persistente e retoma, certificados PDF de demonstração com código/QR e revogação, fluxo editorial e cópia de versão, registo básico de turmas, biblioteca com carregamento até 20 MB, relatórios CSV e impressão, auditoria.

## Roteiro de apresentação
1. Abrir o catálogo: os conteúdos de demonstração são preparados na migração.
2. Abrir Catálogo e Introdução à Academia Digital.
3. Seleccionar Experimentar este curso, completar três aulas e realizar avaliação (mínimo 80%). Cada navegador recebe um percurso próprio com identificador fictício.
4. Emitir PDF de demonstração e abrir a verificação do código.
5. Consultar Relatórios e Auditoria.
6. Em Cursos e conteúdos, criar rascunho com aula e questão, submeter a revisão, aprovar e publicar dentro desta demonstração.
7. Em Biblioteca, carregar material fictício e descarregá-lo.

Publicar um curso nesta base isolada não publica nada no CMS do Manual.

## Validação executada
Compilação e TypeScript. Teste de integração do Worker com D1 e R2 isolados: 67 respostas verificadas, incluindo bloqueio de certificado antes dos requisitos, duplicação de pedidos sem duplicação de progresso/tentativas/certificados, nota no servidor, imutabilidade editorial, cópia de versão, PDF, verificação e revogação, carregamento/descarregamento e renderização inicial.

Executar após compilação: `node tests/integration.mjs`. Os erros de rejeição esperada são parte dos testes negativos. Ainda falta validação visual/interactiva no navegador, telemóvel, acessibilidade e aceitação pela equipa. Não foram executados testes de carga ou auditoria de segurança para lançamento nacional.

## Limites antes de utilização real
- A demonstração abre por link. As operações administrativas exigem identidade autenticada da proprietária via Sites; visitantes usam um cookie aleatório HttpOnly, Secure e SameSite para aceder apenas aos seus percursos. Não existem contas institucionais, MFA próprio nem perfis separados de formador/revisor.
- A proprietária gere o fluxo editorial. A separação entre formadores e revisores ainda não foi implementada.
- Turmas guardam metadados; atribuição de participantes/formadores ainda pendente.
- Conteúdos clínicos e pedagógicos exigem validação do INS; propostas em rascunho não são cursos concluídos.
- Certificados são de demonstração, sem assinatura nem validade institucional; verificação por código mostra apenas curso, data e estado, sem nome do participante.
- Editor avançado, integração de multimédia nas aulas, outros tipos de avaliação, limites de tentativas/tempo e modo exame pendentes.
- Fóruns, notificações, pagamentos, SCORM/xAPI/cmi5, multilingue e offline não implementados.
- Ligação de surtos permanece externa; não foi migrada.

## Arquitectura e continuidade
React/TypeScript com Vinext, Worker, D1 separado e R2 separado. Esquema em db/schema.ts, migração em drizzle/, API em app/api/, interface em app/page.tsx. Sem ligação à base Supabase do Manual/CMS. Nenhuma credencial de utilizador deve ser guardada no código.

Próxima etapa: validar os percursos e o desenho desta versão; depois implementar identidade institucional e perfis e integração editorial com conteúdos aprovados, antes de quaisquer dados reais ou lançamento público.

## Acesso por link — Setembro de 2026
Visitantes consultam apenas cursos publicados e os seus próprios percursos e certificados. Não recebem rascunhos, decisões editoriais, auditoria, relatórios globais nem materiais privados. Escritas administrativas são bloqueadas no servidor, incluindo carregamentos, revisão, revogação e criação de cursos. PDFs exigem a posse da sessão do percurso ou administração autenticada. Não basta esconder botões.

Os percursos de visitante não pedem nome nem e-mail. O cookie dura 30 dias e é específico do navegador. Limpar cookies ou mudar de dispositivo inicia outra demonstração. Esta sessão não substitui uma conta institucional.

O servidor confia nos cabeçalhos de identidade injectados pelo alojamento Sites. Qualquer migração para outro alojamento exige autenticação equivalente que impeça cabeçalhos forjados. Não alojar o Worker directamente num serviço aberto sem essa protecção.

Testes acrescentados: dois visitantes isolados, bloqueio de acesso a inscrições e PDFs alheios, rejeição de funções administrativas, identidade não autorizada, rejeição de origem externa, ausência de chaves de sessão no JSON e percurso completo de visitante. A validação visual em navegador/telemóvel continua pendente.

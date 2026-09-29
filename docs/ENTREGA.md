# Academia Digital do INS — versão de demonstração

## Estado
Primeira versão integrada para revisão privada. Não constitui o produto nacional concluído. Apenas dados fictícios; sem certificação oficial. Independente do Manual e do CMS existentes.

## Funcionalidades implementadas
Catálogo, cursos e aulas de texto, avaliação de escolha única com correcção no servidor, inscrições fictícias, progresso persistente e retoma, certificados PDF de demonstração com código/QR e revogação, fluxo editorial e cópia de versão, registo básico de turmas, biblioteca com carregamento até 20 MB, relatórios CSV e impressão, auditoria.

## Roteiro de apresentação
1. Na primeira abertura, seleccionar Preparar demonstração.
2. Abrir Catálogo e Introdução à Academia Digital.
3. Criar inscrição fictícia, completar três aulas e realizar avaliação (mínimo 80%).
4. Emitir PDF de demonstração e abrir a verificação do código.
5. Consultar Relatórios e Auditoria.
6. Em Cursos e conteúdos, criar rascunho com aula e questão, submeter a revisão, aprovar e publicar dentro desta demonstração.
7. Em Biblioteca, carregar material fictício e descarregá-lo.

Publicar um curso nesta base isolada não publica nada no CMS do Manual.

## Validação executada
Compilação e TypeScript. Teste de integração do Worker com D1 e R2 isolados: 35 respostas verificadas, incluindo bloqueio de certificado antes dos requisitos, duplicação de pedidos sem duplicação de progresso/tentativas/certificados, nota no servidor, imutabilidade editorial, cópia de versão, PDF, verificação e revogação, carregamento/descarregamento e renderização inicial.

Executar após compilação: `node tests/integration.mjs`. Os erros de rejeição esperada são parte dos testes negativos. Ainda falta validação visual/interactiva no navegador, telemóvel, acessibilidade e aceitação pela equipa. Não foram executados testes de carga ou auditoria de segurança para lançamento nacional.

## Limites antes de utilização real
- Acesso privado do proprietário no alojamento; não existem contas individuais, RBAC, MFA ou SSO na aplicação.
- O mesmo operador de demonstração usa os vários percursos. A revisão editorial não separa identidades.
- Turmas guardam metadados; atribuição de participantes/formadores ainda pendente.
- Conteúdos clínicos e pedagógicos exigem validação do INS; propostas em rascunho não são cursos concluídos.
- Certificados são de demonstração, sem assinatura nem validade institucional; verificação depende do acesso privado ao site.
- Editor avançado, integração de multimédia nas aulas, outros tipos de avaliação, limites de tentativas/tempo e modo exame pendentes.
- Fóruns, notificações, pagamentos, SCORM/xAPI/cmi5, multilingue e offline não implementados.
- Ligação de surtos permanece externa; não foi migrada.

## Arquitectura e continuidade
React/TypeScript com Vinext, Worker, D1 separado e R2 separado. Esquema em db/schema.ts, migração em drizzle/, API em app/api/, interface em app/page.tsx. Sem ligação à base Supabase do Manual/CMS. Nenhuma credencial de utilizador deve ser guardada no código.

Próxima etapa: validar os percursos e o desenho desta versão; depois implementar identidade/permissões e integração editorial com conteúdos aprovados, antes de quaisquer dados reais ou lançamento público.

# Acesso da equipa durante o desenvolvimento — 17/11/2026

## Pedido e âmbito

Percília autorizou tornar acessíveis à equipa técnica todas as áreas de gestão existentes para desenvolvimento, testes e apresentação. A atribuição definitiva de funções será acordada com o INS na entrega. Este lote corrige a entrada e a navegação; não certifica a conclusão funcional de toda a plataforma.

## Alterações

- A entrada «Administração» fica visível no cabeçalho da Academia.
- Quando falta o acesso técnico, a página permite introduzir a ligação privada existente ou o respectivo código, com possibilidade de tentar novamente.
- O painel é a entrada principal. A navegação administrativa conserva o contexto de validação quando se está a testar.
- A barra da equipa permite abrir a administração, testar as áreas existentes, testar inscrição/aprendizagem e terminar o acesso.
- Os acessos técnicos já configurados continuam a permitir gestão integral sem exigir atribuição de perfis institucionais ou MFA. Não foram substituídas chaves nem alteradas variáveis de ambiente.

## Auditoria e verificação

- `tests/team-access.mjs`: 42 respostas HTTP verificadas, além de asserções de dados. Inclui acesso técnico global sem perfis/MFA, criação de curso com aula e questão, revisão, aprovação e publicação em validação; confirma que o curso de ensaio não entra nos dados reais.
- O mesmo teste verifica recusa de chaves ausentes, inválidas ou expiradas, origem não autorizada e operações administrativas em modo participante.
- `tests/pages-client.mjs`: sessões, expiração, armazenamento, cabeçalhos, entrada administrativa, aceitação da ligação privada completa e conservação do contexto de validação.
- `tests/role-permissions.mjs`: 138 verificações de permissões institucionais e MFA aprovadas; estas regras continuam separadas do acesso técnico.
- TypeScript sem erros; compilação do serviço e geração do cliente GitHub Pages concluídas.
- Os testes com escrita usam uma base temporária local e dados fictícios. Não foram criados utilizadores, cursos ou atribuições institucionais no serviço publicado.

## Utilização e limites

As quatro ligações privadas já entregues à equipa continuam válidas até 16/12/2026. Devem permanecer fora do repositório público. Cada pessoa deve utilizar a entrada que lhe foi destinada. O acesso é conservado na sessão do separador; a ligação privada permite voltar a entrar.

«Administrar Academia» trabalha sobre os registos reais. «Testar todas as áreas» e «Testar inscrição e aprendizagem» usam o contexto de validação. O registo público real mantém a configuração existente do aviso de privacidade, sem inventar dados institucionais.

Os testes automáticos confirmam os percursos indicados; não equivalem à revisão manual de todos os formulários com a equipa. A aceitação global das funcionalidades e as pendências documentais continuam a exigir a validação conjunta prevista para a entrega.

## Commit proposto

Título: `Tornar acessível a administração técnica da Academia`

Mensagem:

    Mostrar a entrada Administração e permitir recuperar o acesso com as ligações privadas existentes.
    Manter a navegação no contexto de validação e disponibilizar as entradas de gestão e aprendizagem da equipa.
    Auditar o acesso técnico integral sem perfis INS/MFA e preservar o isolamento dos ensaios e os dados reais.

## Correcção da apresentação — 17/11/2026

Na sequência da revisão de Percília, foram retiradas da página de entrada as explicações internas sobre equipa técnica, perfis do INS e validação. O formulário apresenta apenas o título, «Código de acesso», «Entrar» e o regresso à Academia.

Corrigiu-se o aviso indevido «A ligação privada é inválida ou expirou» na primeira visita sem credenciais. Um acesso efectivamente recusado continua a mostrar o erro; falhas do serviço continuam visíveis. O cliente conserva o estado HTTP para distinguir estes casos.

A barra administrativa usa rótulos curtos. A administração real não apresenta ligações nem instruções de ensaio. A área de validação conserva a identificação do contexto, o acesso à gestão, a vista de participante e a passagem para «Administrar Academia». As ligações privadas existentes abrem o painel.

Verificação deste ajuste: teste da apresentação inicial sem erro, acesso inválido, acesso autorizado e falha do serviço (`tests/administration-screen.mjs`); testes do cliente; TypeScript e compilações do serviço e GitHub Pages. Não houve alterações a credenciais, permissões ou dados. O ficheiro privado existente mantém as mesmas quatro entradas, sem nova atribuição de acessos.

## Entrada única por email e palavra-passe — orientação final de 17/11/2026

Percília especificou uma única entrada «Administração», com email e palavra-passe, sem entradas distintas para Ologa ou equipa técnica. Esta orientação substitui o formulário de código acima descrito. A definição dos perfis institucionais fica para depois.

O formulário publicado apresenta «Email», «Palavra-passe» e «Entrar». Não apresenta instruções internas nem exige ligação privada. Foi preparado o primeiro acesso com o email da proprietária já associado à Academia; as credenciais são entregues num ficheiro privado separado, nunca no GitHub.

O servidor valida as credenciais configuradas em `INS_ADMIN_CREDENTIALS`, que contém apenas os identificadores e hashes scrypt das palavras-passe. Reutiliza a derivação de palavra-passe e a tabela de sessões existentes. A sessão dura oito horas, é revogada ao sair e deixa de autorizar quando a credencial é alterada ou retirada. Os perfis finais, as contas dos participantes e as ligações anteriormente entregues não foram apagados. Nenhuma conta de participante ganha administração por declarar um email ou um perfil.

As contas configuradas usam o mesmo formulário e têm acesso integral às áreas de administração existentes. As credenciais incorrectas, as sessões expiradas e as origens não autorizadas são recusadas. Não há MFA neste percurso, nem atribuição automática de perfis institucionais.

Verificação: `tests/administration-login.mjs` passou 33 respostas HTTP, com duas contas independentes em base temporária, gestão completa, criação de curso de ensaio, saída, expiração, recusa de sessão de participante e limitação de tentativas. `tests/team-access.mjs` passou 42 respostas, preservando os acessos anteriores e o isolamento dos ensaios. Os testes de apresentação e do cliente e a verificação TypeScript passaram. Não foram usados dados reais nos testes de escrita.

Título do commit: `Unificar a entrada na Administração com email e palavra-passe`.

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

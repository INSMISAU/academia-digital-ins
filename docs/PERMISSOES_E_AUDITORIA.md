# Permissões e auditoria da Academia do INS

Lote de 16 de Novembro de 2026. Âmbito: autorização sobre os serviços existentes, autenticação adicional das contas com permissões de gestão, administração dos âmbitos e registos de auditoria.

## Base documental

- `INS ACADEMIA DIGITAL(6).docx`: perfis de utilizador, criação de conteúdos por formadores autorizados e fluxo de revisão/publicação.
- `ANOTACOES DO MODULO DE FORMACAO^(1).docx`: secções 3–7 de “Meus cursos / My Learning”: RBAC, protecção de dados, auditoria, interface e validação; acesso do formador aos cursos atribuídos ou criados.
- Decisão do utilizador: avançar com auditoria de cada implementação, sem inventar dados ou requisitos; aceitar 5 MB como limite de entrada das fotografias dos formadores.

## Matriz aplicada aos serviços existentes

| Perfil | Âmbito | Operações permitidas |
| --- | --- | --- |
| Formando | Próprias inscrições e sessão | Percurso, respostas, resultados e certificados próprios, de acordo com as validações existentes. |
| Formador | Curso atribuído; turma atribuída; ou cursos criados numa instituição onde recebeu permissão de criação | Consultar participantes e resultados autorizados, gerir turmas autorizadas, registar presenças; editar conteúdos e avaliações quando tem permissão sobre o curso. Submeter a revisão. Publicar cursos aprovados apenas com autorização explícita. |
| Gestor de formação | Instituição, curso ou turma explicitamente autorizados | Gerir programas dentro do âmbito institucional, inscrições, turmas, presenças e relatórios autorizados. Não editar respostas ou fabricar resultados dos formandos. |
| Revisor | Curso atribuído | Consultar conteúdos e decisões; aprovar ou devolver para correcção. Sem listagem de resultados pessoais por esse perfil. |
| Administrador institucional | Instituição explicitamente atribuída | Gerir os conteúdos, inscrições, certificados e permissões inferiores da instituição. A atribuição de permissões exige que a conta já esteja associada à instituição. Sem auto-atribuição de privilégios ou configuração global. |
| Administrador da plataforma | Atribuição explícita do perfil global | Gestão global, instituições e associações de âmbito, permissões, configurações e reposição de MFA de terceiros, com auditoria. |

Uma atribuição limitada a uma turma permite consultar apenas os participantes dessa turma. Não concede edição do conteúdo partilhado do curso. Uma permissão explícita para o curso pode abranger os participantes desse curso; uma permissão apenas institucional exige a associação institucional explícita da inscrição.

## Regras de implementação

- `/api/management/…` autentica a sessão, confirma MFA e verifica perfil, recurso e âmbito em cada pedido. Uma lista de operações permitidas recusa operações desconhecidas por defeito.
- A área de gestão é separada do percurso pessoal. O perfil privilegiado não transforma `/api/academy` numa listagem administrativa.
- Identificadores enviados pelo cliente são comparados com os registos e relações do servidor. O registo de conta não aceita privilégios.
- Leituras, detalhes, históricos, relatórios, exportações e downloads passam pela mesma autorização. As listagens devolvidas excluem os registos fora do âmbito.
- A alteração de um registo existente verifica o âmbito anterior e as referências propostas. Os novos registos recebem âmbito no mesmo lote transaccional da criação.
- Não se deduz a instituição a partir do texto livre da ficha. Os registos antigos sem associação ficam reservados à administração global; a associação é explícita.
- Os materiais restritos continuam em armazenamento privado e são obtidos por pedidos autenticados. Não foram criadas ligações públicas de ficheiros restritos neste lote.
- Não existe API para alterar ou apagar o registo de auditoria. Os novos eventos incluem actor, acção, recurso, resultado e data; não incluem códigos MFA, segredos ou tokens. Os eventos históricos sem actor continuam identificados como anteriores.
- As exportações disponibilizadas pela interface pedem autorização e registam a selecção antes de gerar CSV, Excel ou impressão/PDF. Uma revogação é verificada no pedido seguinte.
- As sessões pessoais são separadas por separador. Terminar sessão invalida a sessão do servidor e a confirmação MFA; o regresso a uma página restaurada pelo navegador provoca uma actualização.

## MFA e configuração

As contas com perfis de gestão usam aplicação autenticadora TOTP. O código é verificado no servidor, com limite de tentativas, rejeição de reutilização e confirmação vinculada à sessão. A configuração pendente expira. O segredo é cifrado com AES-GCM e chave de 256 bits exclusivamente no ambiente do servidor, `INS_MFA_ENCRYPTION_KEY`.

A reposição por um administrador global exige motivo e termina todas as sessões da conta afectada. Não permite repor a própria conta por essa operação.

Referência técnica: RFC 6238, https://www.rfc-editor.org/rfc/rfc6238.html . A suite usa os seis vectores publicados para HMAC-SHA-1. A escolha técnica TOTP concretiza o requisito de MFA; não representa uma política institucional adicional fornecida nos documentos.

Os acessos técnicos privados já existentes e a identidade de proprietário do serviço permanecem com os seus mecanismos anteriores, para preservar o acesso autorizado da equipa. Não foram convertidos em contas de gestão nem substituídos por MFA neste lote. As chaves privadas não integram o código, a documentação nem os ficheiros de entrega.

## Migração e activação

`0008_role_permissions.sql` acrescenta tabelas de instituições, permissões, âmbitos e MFA, com equivalentes separados para validação, e acrescenta os campos de auditoria. Não altera as migrações anteriores nem atribui perfis ou instituições a pessoas reais.

Na área administrativa existente, “Permissões” permite registar instituições reais, associar registos e atribuir/revogar perfis de contas existentes. Não foram preenchidas instituições nem atribuições por suposição. As contas privilegiadas entram através de “Meu perfil”, configuram ou confirmam MFA e abrem a gestão autorizada.

## Limites deste lote

- A atribuição inicial das instituições, contas e âmbitos reais continua a ser uma operação explícita da administração. Sem essa configuração, os novos perfis não recebem acesso por defeito.
- A associação de âmbito dos registos antigos só é criada quando ainda não existe. Transferir registos entre instituições não faz parte deste lote.
- As integrações OAuth e de correio mantêm a configuração externa anteriormente pendente. Os testes OAuth usam fornecedores simulados.
- A abertura pública de contas e inscrições continua dependente dos valores institucionais do aviso de privacidade. Nenhum valor foi inventado para a activar.
- Trabalhos com correcção manual, regras pedagógicas adicionais, publicação directa/agendada e outras extensões editoriais permanecem nas fases respectivas. As permissões deste lote protegem as operações actualmente existentes.
- O requisito de fotografias fica fixado em **5 MB de entrada**, JPG/JPEG, PNG e WebP, com recorte, orientação, remoção de metadados e versões WebP de 96, 240 e 480 px no lote de fotografias. Este lote não implementa o processamento de imagem. O limite geral dos materiais não é o limite das fotografias.
- A pré-visualização local expirou durante o arranque. A auditoria distingue os testes automatizados da validação visual efectivamente realizada; não declara como testada uma interacção de navegador que não tenha sido observada.

Os resultados concretos e o estado da publicação acompanham o ZIP de entrega.

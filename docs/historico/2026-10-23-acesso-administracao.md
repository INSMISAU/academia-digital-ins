# Administração da Academia — correcção de 23/10/2026

Base do pacote: `1950ec5c1a480a1cf2dc65bd26a170cd0047c027`.

A utilizadora esclareceu que a Academia é a plataforma do projecto e que a
equipa precisa de entrar na própria Administração. As orientações actuais
constam em `docs/ORIENTACOES_DO_PROJECTO.md` e prevalecem sobre a proposta
anterior de uma área separada de demonstração.

## Publicação anterior recuperada

O GitHub já continha o commit 1950ec5, mas o serviço estava na versão 5, baseada
em 6bbf9eb. Foi preservado o histórico e sincronizado o commit já efectuado
pela utilizadora. A publicação terminou com sucesso como versão 6, incluindo
as tabelas da migração anterior. Não foi criado um commit pelo assistente.

## Correcção preparada neste pacote

- Entrada Administração no mesmo endereço da Academia, sem conta ChatGPT.
- Rotas administrativas que utilizam os registos da Academia. Um curso
  publicado pela Administração aparece no catálogo público.
- Acesso durante o desenvolvimento conforme orientação expressa. Contas e
  perfis individuais ficam para a etapa final; o histórico não identifica
  individualmente o autor de cada operação nesta fase.
- Remoção da faixa Ambiente de testes e das notas internas de demonstração,
  implementação e perfis nos ecrãs da Academia.
- Formulários de participantes, turmas e revisão sem os prefixos e textos de
  demonstração. Os novos certificados usam código ACAD e texto de conclusão,
  sem acrescentar assinatura ou aprovação institucional não fornecida.
- Os exemplos e certificados DEMO antigos mantêm os registos originais. Não
  são apresentados como cursos ou certificados efectivos na interface normal.
- O parâmetro antigo validacao=1 continua a abrir a Administração, para
  preservar ligações já partilhadas. A entrada actual usa administracao=1.

Não foram apagados registos, alteradas migrações anteriores nem criados dados
de formação na base publicada durante a preparação. O módulo formativo e o
eBook ficam fora deste pacote.

## Verificação

TypeScript, compilação Worker e Pages, conteúdo estruturado, catálogo e cliente
Pages passaram. Passaram 180 verificações de integração em armazenamento
isolado, incluindo duas sessões, publicação no catálogo efectivo, aprendizagem,
certificados, materiais, origens permitidas e preservação dos registos legados.

No navegador local, foi verificada a entrada pelo menu e a gravação de um
rascunho sem autenticação e sem notas de demo. Foram usadas as rotas compiladas
da aplicação, com uma cópia local dos registos existentes e dados de verificação
locais. A imagem da pré-visualização não comprova publicação desta correcção.

O pacote ainda depende do commit da utilizadora e da sincronização desse mesmo
commit no serviço administrativo. A versão 6 publicada corresponde ao pacote
anterior; não contém ainda esta correcção.

# Entrada da administração pela Academia

Base: `61bbe93c2d64b1e94ff54e097cf52cef657cb4d2`.
Pedido: disponibilizar a entrada Administração na própria Academia, mantendo o Pages como ponto de acesso habitual.

Antes de editar, foi guardada uma cópia da revisão anterior. A entrega inclui os ficheiros anteriores substituídos e os recursos do index anterior, separados de PARA_COMMIT. O histórico completo continua identificado pelo commit de base.

Foi adicionada uma entrada Administração ao menu principal. Na sessão administrativa activa abre Cursos e conteúdos na própria interface. No Pages, ou sem sessão, inicia a autenticação administrativa já existente no serviço da Academia e pede o regresso a `/#gestao`. Usa navegação normal de topo, conforme a integração existente de autenticação. O caminho de regresso é fixo, não vem de parâmetros do visitante.

No serviço que apresenta a gestão foi adicionada uma ligação Voltar à Academia para o endereço público do Pages. A entrada principal do cliente continua a ser `https://insmisau.github.io/academia-digital-ins/`. O endereço técnico do navegador pode mudar durante a entrada na administração; esta alteração integra a navegação e não muda o alojamento ou o mecanismo de autenticação.

Não foram modificados a API, as permissões administrativas, contas, perfis, base de dados ou conteúdos pedagógicos. O acesso público aos cursos continua como antes. Módulo formativo e eBook não receberam alterações.

Verificações: compilação Pages, TypeScript e testes do cliente; navegação local com entrada no menu, regresso a gestão e ligação pública de retorno. O navegador usou um serviço de teste isolado que simula o regresso após autenticação; não é uma validação real do início de sessão com o fornecedor de identidade. A API real mantém a autorização existente, testada pela integração local do Worker.

Estado de preparação: sem commit, push ou publicação desta alteração. Após o commit feito pela utilizadora, o Pages recebe a entrada do menu. A mesma revisão deve ser sincronizada com a administração para mostrar também o novo menu e a ligação de regresso nesse serviço. A administração actual já tem o editor publicado e o ponto de entrada de autenticação existente é reutilizado.

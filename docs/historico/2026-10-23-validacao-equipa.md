# Validação administrativa da Academia — 23/10/2026

Base: `6bbf9ebfb6ad0fb13a2f281878d28cb526862d65`.

A equipa precisa de experimentar a administração antes da configuração das
contas e dos perfis definitivos. O menu Administração passa a abrir a validação
na própria Academia, sem redireccionar para autenticação ChatGPT.

As rotas de validação reutilizam as regras de cursos, aulas, avaliações,
revisão, turmas, materiais, relatórios e certificados de demonstração. Os seus
registos ficam em tabelas próprias e os ficheiros numa área separada. Publicar
um curso nesta área publica apenas no ambiente de testes.

Os dados de teste são partilhados: outra sessão ou dispositivo pode consultar
o trabalho depois de actualizar a página. Não são criadas contas nem perfis;
o histórico não atribui operações a uma identidade individual nesta etapa.
Utilizar apenas dados fictícios. A administração original mantém as condições
de acesso existentes.

A nova migração acrescenta apenas as tabelas de validação. As migrações
anteriores são preservadas. O histórico anterior dos ficheiros alterados é
entregue separadamente da pasta PARA_COMMIT.

Verificado: TypeScript; compilação Pages e Worker; testes de conteúdo e
catálogo; cliente Pages; 154 verificações de integração. Incluem duas sessões,
persistência partilhada, fluxo editorial, progressão, avaliação, certificado,
revogação, materiais, origens permitidas, pedidos concorrentes e comparação
integral dos registos originais antes e depois dos testes.

No navegador local, foram verificadas a entrada pelo menu, a ausência do pedido
de conta ChatGPT, a preparação do percurso fictício, a criação de um rascunho
e a consulta noutra janela. Os testes locais usam a API compilada e uma base
isolada. A publicação real e os testes em telemóveis dependem da aplicação
deste pacote e da posterior sincronização do mesmo commit no serviço.

O commit cabe à utilizadora. O módulo formativo, o eBook e o Supabase não
integram esta alteração.

# Ficha e acessos técnicos — 16 de Novembro de 2026

O formulário conserva os campos, opções, dependências e declarações da versão aprovada. Retirou-se o aviso de consulta. A interface apresenta apenas os fornecedores de acesso efectivamente configurados. A opção de guardar o preenchimento continua voluntária, como solicitado no documento original.

## Funcionamento

- A ficha permite submissão quando as inscrições estiverem abertas e a informação institucional de protecção de dados estiver completa. A administração dispõe desses campos em Configurações > Ficha de inscrição. Não foram definidos valores institucionais por suposição.
- As credenciais externas de Google, Apple/iCloud, Microsoft e envio de email permanecem na configuração do servidor. Nenhuma credencial entra nos ficheiros do GitHub.
- Os caminhos administrativos exigem autorização no servidor. O acesso da proprietária autenticada no alojamento mantém-se. A equipa técnica usa capacidades privadas individuais, sem recolha prévia de emails dos membros do INS.
- `INS_TEAM_ACCESS` contém apenas uma lista de `{id,label,hash,expires}`. `hash` é SHA-256 de uma chave aleatória de 32 bytes; `expires` é um instante UTC em milissegundos. Retirar uma entrada e publicar a nova configuração revoga esse acesso. As ligações privadas são entregues separadamente e nunca devem ser carregadas no repositório.
- A área `?validacao=1` usa as tabelas `validation_*`. O primeiro acesso copia apenas conteúdo dos cursos e prepara a ficha para dados fictícios. `perfil=participante` usa as mesmas regras da ficha pública e não permite acções administrativas. Não copia inscrições reais.
- O acesso `?administracao=1` permite gerir os registos efectivos. As ligações privadas devem ser utilizadas apenas pela equipa técnica autorizada.

## Publicação e verificação

Aplicar as migrações ainda não instaladas, incluindo `0004`, `0005` e `0006`, antes de utilizar a ficha. Não alterar migrações já aplicadas. O GitHub Pages publica a interface; o serviço alojado publica as rotas e a base de dados.

Verificação local: 22 respostas do formulário, 19 respostas de identidade simulada, 26 respostas de acesso e isolamento, cliente Pages e compilação TypeScript. As simulações não equivalem a autenticação nos fornecedores externos reais. Não foram enviados emails.

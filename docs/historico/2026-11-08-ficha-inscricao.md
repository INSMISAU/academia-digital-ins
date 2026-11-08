# Ficha de inscrição nos cursos da Academia

Base: 38867abd195059d2d489bbdeb3de833febf5f6b9. Referência: «Formulário de inscrição na Academia do INS» recebido em 08/11/2026. Este lote implementa o preenchimento manual. A autenticação Google, Microsoft e Apple, as contas individuais da equipa e o envio de emails não são activados por esta alteração.

## Percurso e designação do curso

Quando as inscrições estão abertas no servidor, os cartões públicos dos cursos publicados apresentam «Ficha de inscrição». O botão de acesso ao curso externo continua disponível. O formulário recolhe os campos do Word, com declarações separadas e revisão antes de submeter. No curso externo de surtos a ficha regista a inscrição na Academia sem alterar o curso de origem. Nos cursos internos o registo da ficha e a associação ao percurso são atómicos. O nome confirmado para o certificado é independente do nome do participante.

As respostas não são disponibilizadas nas listas de administração abertas à equipa. A ficha guarda o email como contacto declarado, sem o dar como verificado nem iniciar comunicações. A confirmação com referência só é emitida após uma gravação bem-sucedida. O rascunho neste separador é opcional e é eliminado após o registo. A impressão e a descarga dizem respeito à ficha do próprio participante.

## Aplicar e validar

1. Integrar o código no repositório da **Academia**. A página estática utiliza os ficheiros da raiz e de assets indicados pelo index.html. Mantêm-se a folha de estilos previamente publicada e os ficheiros anteriores.
2. Aplicar a migração aditiva drizzle/0004_academy_registration.sql à base D1 de destino segundo o processo existente; publicar nessa mesma instância a versão do servidor que inclui /api/registration. O commit no GitHub Pages não publica a API nem executa a migração.
3. Numa instância de validação isolada, criar o registo id=1 em academy_registration_settings, com enabled=1 e notice contendo o texto de privacidade aplicável ao ensaio. Usar dados fictícios. O teste automatizado fá-lo unicamente numa base temporária: executar node tests/registration.mjs a partir da raiz com as dependências do projecto instaladas.
4. Para abertura institucional, validar as condições de admissão, prazos, contacto de apoio, categorias, lista territorial e aviso de privacidade previstos no modelo. O aviso deve indicar finalidade, responsáveis, acessos, conservação e contacto para correcções. Só então activar o registo da instância pública com o aviso validado. A inexistência desse registo, enabled=0 ou aviso vazio mantêm a recolha fechada. Só o operador da base pode alterar esta configuração nesta fase. Para fechar a recolha, desactivar enabled; os registos existentes são preservados.
5. Confirmar no navegador a ficha dum curso publicado, os distritos por província, as isenções por vínculo e o limite de dois dispositivos. Rever o nome do certificado, as declarações, a impressão e a descarga. Confirmar que uma falha não emite comprovativo e que uma repetição idêntica devolve a mesma referência.

O catálogo e o acesso anterior continuam a funcionar se o novo serviço não estiver activo. Nenhuma criação de conta de fornecedor nem migração da base pública faz parte deste commit.

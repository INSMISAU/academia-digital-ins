# Registo de limpeza da interface e melhorias da Academia

As observações de desenvolvimento e as pendências ficam neste registo, fora dos
ecrãs da Academia. A ficha aprovada conserva os campos, opções, declarações,
validações e condições de submissão existentes.

## Limpeza da apresentação

Foram retiradas as notas iniciais sobre indisponibilidade de submissão, criação
de conta e configuração de autenticação adicional; as explicações sobre a
implementação bilingue e tradução em falta; e as orientações internas de
preparação de conteúdos, escolha editorial de fotografias e autorização da
imagem de assinatura. Continuam disponíveis os campos e controlos correspondentes.

A ficha deixa de apresentar “A sessão terminou” na abertura. Uma sessão
efectivamente expirada é substituída por um preenchimento manual independente,
sem apagar os dados já introduzidos no formulário. Um erro de rede não revoga
uma conta válida. Quando a recuperação da conta não é possível, a ficha permite
escolher o preenchimento manual, sem apresentar uma observação de desenvolvimento.

As mensagens de validação dos campos, os resultados efectivos das operações,
as confirmações de acções e as regras académicas aprovadas foram preservados.
Não há confirmação de inscrição antes de uma resposta bem-sucedida do servidor.

## Melhorias implementadas neste lote

- Imagens: a apresentação selecciona as variantes já geradas pelo servidor,
  com dimensões, carregamento diferido e alternativa para registos antigos.
  Não se alteram os ficheiros originais, as fotografias aprovadas ou o recorte.
- Módulos: ordenação por arrastar e por botões acessíveis. A alteração é
  persistida numa transacção, conservando conteúdo, identificadores, ordem
  interna das aulas e histórico. Só os cursos em rascunho e os perfis com
  autorização de edição podem ser alterados. Uma revisão desactualizada é recusada.
- O percurso dos cursos publicados, as inscrições, classificações, certificados,
  campos da ficha e conteúdos externos não são modificados por este lote.

## Pendências mantidas fora da interface

- Inscrição pública: a activação continua dependente das definições institucionais
  e do aviso de privacidade aprovado. Retirar a observação da ficha não activa
  a submissão nem dispensa essas condições.
- Continuam por fechar os fornecedores reais de email, identidade externa,
  pagamentos e LRS; o agendador de produção; modelos institucionais; conteúdos
  traduzidos; e a validação final com o INS.
- A geração em WebP, o versionamento semântico, recursos avançados do editor e
  restantes pendências da revisão documental continuam para lotes seguintes.
- Os perfis definitivos e o encerramento do modo de desenvolvimento continuam
  para a etapa acordada com a utilizadora.

## Verificação

Testes locais de recuperação de sessão, imagens responsivas, formatos de conteúdo,
catálogo, idiomas e sessões Pages. A ordenação foi ensaiada em D1 temporária,
incluindo conflitos, preservação de conteúdo e histórico, recusa em cursos
publicados, recusa de visitantes e separação da área de validação. A suite de
permissões verifica também a recusa de ordenação por gestor, revisor e formador
sem acesso ao curso. Não são criados dados de ensaio em produção.

A ficha foi também renderizada em português e inglês com os campos aprovados
e a indisponibilidade ligada/desligada. A ferramenta de navegação visual foi
interrompida por não conseguir confirmar o URL da janela do navegador; essa
verificação visual deste lote não foi concluída.

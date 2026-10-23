# Cartões e conteúdos da Academia em 23 de Outubro de 2026

> Registo do pacote preliminar. Este pacote foi ampliado e substituído pelo
> pacote Plataforma integrada, cujo registo está em
> 2026-10-23-plataforma-integrada.md. As declarações abaixo descrevem apenas
> o alcance do ajuste preliminar, não o conjunto de alterações actual.

Base: commit da utilizadora `5e58fbfbefec0a387bd961670ae77e4aa8f47fd9`.
Esse commit, Corrigir menu administrativo, foi sincronizado no serviço como
versão 8, preservando a versão 7 e o histórico. Publicação concluída.

## Pedido e conferência

A utilizadora pediu cartões na horizontal, questionou a origem dos dois outros
cursos e solicitou a comparação com os documentos INS ACADEMIA DIGITAL(5).docx
e TELESAUDE PRETESTE(2).docx. Foram lidos o texto dos dois documentos e as onze
imagens incluídas em Telesaúde. Os títulos Biossegurança e prevenção de infecções
e Qualidade de dados em saúde não constam dos anexos como cursos a criar.
São exemplos da preparação inicial. Não foram substituídos por outros cursos.

## Correcções preparadas

- O cartão do curso e o do eBook ficam lado a lado em ecrãs com mais de 900 px.
  Em ecrãs menores ficam empilhados. O ajuste está limitado à página inicial.
- Os dois exemplos anteriores deixam de aparecer no catálogo e na gestão.
  Mantém-se a exclusão do antigo percurso Introdução à Academia Digital.
  Os registos ficam guardados; não foi executado DELETE, migração ou SQL.
- A ligação da Biblioteca continua a abrir o eBook final.
- O eBook, o módulo formativo, os perfis e as contas não foram alterados.
- O histórico e os assets anteriores permanecem preservados.

A conferência detalhada está em docs/VERIFICACAO_REQUISITOS_20261023.md.
Identifica o que existe, o que está parcial e o que falta, conservando as fases
dos documentos e a orientação de tratar contas e perfis no fim.

## Verificações

Compilação Pages, TypeScript e testes existentes de catálogo e cliente Pages
passaram. No navegador local, com respostas fictícias que incluíam todos os
exemplos antigos, estes não apareceram no início nem na gestão. Os cartões do
curso e do eBook ficaram na mesma linha e com larguras iguais. O botão
Administração e a ocultação do menu de gestão nas páginas públicas mantiveram-se.
O comportamento em ecrãs menores está definido por CSS; não houve teste em
telemóvel físico. A API de produção não foi editada ou usada para gravar dados.

Estas correcções são posteriores à versão 8 e ainda não estão publicadas.
O próximo commit é efectuado pela utilizadora. Depois deve ser sincronizado
o mesmo commit no serviço, sem misturar este ajuste com alterações às outras
plataformas do projecto.

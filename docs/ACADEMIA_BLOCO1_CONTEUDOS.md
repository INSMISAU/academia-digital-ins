# Primeiro bloco — ficha do curso e conteúdos

Base: `9e05827e5d4cf81a2b7b172d141c48093522e48f`, repositório `INSMISAU/academia-digital-ins`.
Data de trabalho: 23/10/2026, Moçambique.

## Implementado neste bloco

- Ficha com resumo, objectivos de aprendizagem, destinatários, requisitos e modalidade separados. Campos opcionais vazios não aparecem na consulta. Carga horária nova começa em 0 (por definir); nenhum valor pedagógico foi atribuído a cursos existentes.
- Programa apresentado por módulos, mantendo a sequência de aulas recebida do servidor. É possível escolher um módulo existente ou escrever outro ao adicionar uma aula.
- Editor de aulas com dez tipos de bloco: texto, título, lista, imagem, vídeo, áudio, PDF, apresentação, documento e ligação.
- Ordem dos blocos pelas setas ou pela pega de arrastar. Pré-visualização com o mesmo componente usado na leitura da aula. Alinhamento à esquerda ou justificado.
- Materiais por endereço HTTPS público. PDF, apresentações e documentos abrem pela ligação; vídeo/áudio usam os controlos do navegador. Ligações reconhecidas do YouTube e Vimeo têm leitor incorporado e mantêm a ligação original como alternativa.
- Imagens exigem descrição para acessibilidade e fonte/autoria. A orientação editorial continua a exigir imagens reais, dando preferência a Moçambique e à representação de pessoas negras. A aplicação não verifica automaticamente a origem nem direitos de utilização de um ficheiro externo.
- Pesquisa também nos objectivos, destinatários, requisitos e modalidade. Cartões mostram o resumo legível e a modalidade quando definida.
- Gravação explícita no servidor, erro apresentado no editor e campos desactivados enquanto se guarda. O editor fecha após confirmação da escrita; uma falha posterior ao actualizar a lista não é apresentada como falha da gravação.

## Compatibilidade dos dados

Este bloco não altera tabelas, migrações, permissões nem a API. Aproveita os campos existentes `courses.summary` e `lessons.body`, com formatos identificados e versionados:

- Ficha: prefixo `INS_ACADEMY_COURSE_V1` seguido de quebra de linha e JSON.
- Aula: prefixo `INS_ACADEMY_LESSON_V1` seguido de quebra de linha e JSON.

Os textos antigos são lidos sem migração e só são convertidos quando alguém guarda deliberadamente a respectiva ficha ou aula. A API existente guarda esses campos integralmente; publicação, snapshots e cópia para nova versão preservam os dados. Foram testados estes percursos numa base local isolada.

As validações do editor respeitam os tamanhos já aceites pela API: ficha com até 3000 caracteres serializados e aula com até 20000. O limite do servidor mantém-se como protecção adicional. Conteúdo é apresentado por elementos React; não é executado HTML arbitrário. Ligações `javascript:`, `data:`, credenciais no endereço e endereços privados da actual biblioteca administrativa são recusados na leitura/validação de materiais.

A cópia de código anterior não é uma cópia da base de dados. Depois de guardar conteúdos no novo formato, qualquer reversão da interface tem de manter o leitor desse formato ou converter os registos afectados. Uma interface antiga mostraria o texto serializado.

## Publicação e administração

O GitHub Pages apresenta a interface pública em `https://insmisau.github.io/academia-digital-ins/`. A administração é servida no Site existente `https://ins-academia-digital.perciliamuianga.chatgpt.site` (projecto `appgprj_6abc35e2cfa88191926cdccbcfc1e67c`).

O commit no GitHub actualiza os ficheiros do Pages; não publica automaticamente a interface administrativa desse Site. Para começar a editar blocos na administração é necessário publicar também a mesma versão de código no Site existente, preservando a sua identidade, dados, armazenamento e acesso. Não se deve declarar o editor activo apenas por o Pages estar publicado. Este pacote prepara o código e os testes para ambas as interfaces; não executa commits, pushes nem publicação.

Não há SQL a executar neste bloco e não há alteração no Supabase.

## Pedidos que continuam para os blocos seguintes

O documento INS ACADEMIA DIGITAL é a especificação principal; TELESAUDE PRETESTE fornece referências funcionais. Este primeiro bloco corresponde a parte da ficha/gestão de cursos, editor de conteúdo e alinhamento. Não conclui os dois documentos.

Continuam por implementar/validar: entidades de programas; reordenação e gestão própria de módulos/aulas; gravação automática de rascunhos; carregamento de materiais directamente para aulas com acesso adequado aos participantes; SCORM/H5P e restantes formatos interoperáveis; avaliações alargadas, retoma de respostas por submeter, tempo e tentativas; inscrições/turmas/presenças completas; certificados oficiais; biblioteca e relatórios avançados. O planeamento anterior mantém os perfis e contas para o fim, conforme orientação da utilizadora.

Não foram copiados cursos, cargas horárias, fotografias ou afirmações de aprovação do protótipo Hercules. Módulo formativo e eBook mantêm os endereços finais existentes.

## Verificação

- TypeScript sem erros; compilação do Pages e do Worker concluídas.
- Testes de formato antigo/novo, dez tipos de bloco, validações de ligações, ordem e sequência de módulos.
- Regressões de catálogo, sessões do Pages e caminhos dos ficheiros compilados.
- Integração local: persistência da ficha/aula, snapshot, duplicação, fluxo editorial e protecção de cursos publicados; percurso de estudo/avaliação, certificados, isolamento de sessões e controlo de administração.
- Navegador, em ambiente local com dados explicitamente fictícios: edição/gravação da ficha, pré-visualização, criação e reordenação de bloco PDF, gravação/reabertura e leitura da aula.
- Arrastar com rato, reprodução efectiva de cada tipo de media e testes em dispositivos físicos ainda não foram executados. A pré-visualização usa dados de teste isolados e não comprova publicação nem alteração de registos reais.

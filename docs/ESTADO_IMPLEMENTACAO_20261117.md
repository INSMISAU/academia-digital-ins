# Registo de implementação — 17 de Novembro de 2026

**Estado desta entrega: implementação local preparada para validação. Não foi publicada. Não representa o fecho integral de todos os requisitos da Academia.**

Pedido de Percília: implementar os pendentes, entregar ZIPs para carregamento pela própria, manter o registo do estado anterior, auditar e não inventar dados ou requisitos.

## Estado preservado

| Elemento | Referência |
|---|---|
| Repositório público | INSMISAU/academia-digital-ins, main |
| Commit GitHub usado como referência | e557114b3bedf79722ede6d50a3e9867716e8c7a |
| Código do serviço usado como base | d8e3801ebaf5acf3f0f0cdd40b510b8433dab8c8 |
| Serviço publicado | Versão 18 |
| Cópia inicial | 00_INS_Academia_Estado_Actual_20261117.zip |
| Conteúdo da cópia | 326 ficheiros de código, inventário SHA-256 e identificação das versões |

A cópia inicial é de código. **Não é uma cópia da base de dados D1, dos ficheiros R2, das contas nem dos segredos.** Não foram executadas migrações nem criados registos na produção. As contas e as senhas de teste usadas nos ensaios são fictícias e ficam em bases temporárias.

## Alterações implementadas neste lote

| Área | Comportamento acrescentado | Limite da verificação |
|---|---|---|
| Cursos | Editores de página inteira; gravação de rascunho sem resumo/área obrigatórios; validação desses campos na revisão; regras de disponibilidade, pré-requisitos sem ciclos, tempo de estudo, presenças e aprovação do formador; lixeira e reposição de rascunhos nunca publicados e sem inscrições | Testes de API e compilação; revisão visual pendente |
| Notícias e anúncios | Editor de blocos; autor, endereço, categoria, SEO e imagem; rascunho/revisão/publicação/agendamento/arquivo/lixeira; a revisão em preparação preserva a versão pública anterior; comparação, restauração como nova revisão e duplicação | Publicação, privacidade, restauração e agendamento testados em D1 temporária |
| Imagens | JPG/PNG/WebP até 5 MB; verificação de cabeçalhos e dimensões; recorte com posição ajustável; orientação EXIF e recodificação no servidor; variantes sem ampliar o original; descrição e crédito | Imagem sintética testada; todos os tipos/orientações e recorte visual ainda exigem ensaio com imagens reais autorizadas |
| Biblioteca | Visibilidade pública ou por inscrição num curso; selecção de descarga/consulta | O navegador pode guardar o conteúdo que consegue apresentar. Não há promessa de impedir captura ou cópia |
| Actividades | Criação de trabalhos, prazo, entrega de texto/PDF, revisões, correcção manual, feedback, nota mínima e obrigatoriedade; ficheiros individuais protegidos | Entrega, correcção e isolamento entre contas testados |
| Avaliações | Banco de questões por curso; resposta longa com correcção manual; ordenação e associação; exame opcional com registo de perda de foco, cópia/colagem e saída de ecrã inteiro | Não é vigilância absoluta nem bloqueio de capturas; ensaio completo de todos os tipos no navegador pendente |
| Percurso pessoal | Actividades pendentes, imagem, formadores, modalidade, tempo de estudo e critérios por concluir; registo de tempo por intervalos confirmados no servidor | O tempo mede actividade do navegador e não prova atenção humana |
| Eventos | Modalidade, horários de Maputo, sessões, organização, programa, inscrições, aprovação, vagas, espera, cancelamento, promoção de vagas, presenças, exportação e calendário | Vagas, espera, promoção e protecção dos dados de acesso testadas |
| Comunicação | Fórum do curso, comentários de aula, moderação, notificações individuais e fila de email com tentativas e chave de idempotência | O serviço real de email continua por configurar e validar |
| Certificados | Dados da emissão preservados, classificação, instituição, modelo PDF, imagem de assinatura autorizada, validade e estado público de expiração | Não é assinatura digital criptográfica; o INS deve fornecer e aprovar modelo e assinatura |
| Pagamentos | Interface para adaptador de pagamentos, pedido idempotente, confirmação por webhook autenticado e ligação à inscrição | Nenhum fornecedor contratado/configurado, nenhum pagamento real realizado; requer adaptador que cumpra o contrato documentado |
| Agendamento | Execução no servidor por evento scheduled ou endpoint autenticado, fila de email e envio xAPI | A agenda de produção ainda precisa de ser ligada ao serviço; não depende de alguém abrir uma página |
| SCORM | Importação de manifesto SCORM 1.2/2004, unidades seleccionáveis, conteúdo isolado, API de leitura/gravação de estado, controlo de concorrência e sessões limitadas | Suporte de execução básico; não é conformidade completa SCORM 2004, não implementa a sua sequenciação completa nem certificação ADL |
| xAPI | Fila de eventos de conclusão pseudonimizados e envio ao LRS configurado, com identificadores idempotentes | LRS real e política institucional de transmissão por definir |
| Consulta sem ligação | Texto de cursos seleccionados guardado na sessão, limpeza ao mudar de participante, manifesto PWA e cache de recursos públicos | Não guarda vídeos/ficheiros externos; avaliação e gravação de progresso exigem rede; navegador/PWA ainda não validado |
| Idioma | Selecção PT/EN para navegação e rótulos principais | Tradução parcial da interface; não traduz conteúdos institucionais nem todos os formulários e mensagens |

## Pendências que NÃO devem ser declaradas concluídas

1. Revisão visual, testes gerais da equipa e aceitação com o INS. O navegador de pré-visualização deste ambiente mostrou uma página em branco; não foi possível confirmar os fluxos visuais. A compilação e os testes de servidor não substituem esse ensaio.
2. Tradução integral dos formulários, mensagens e restante interface para inglês.
3. Conformidade integral SCORM 2004 e cmi5. cmi5 não foi implementado neste lote. A integração completa exige os conteúdos de referência, LRS e critérios de interoperabilidade a aceitar.
4. Assinatura digital criptográfica: identidade, fornecedor e política de assinatura por definir. Uma imagem de assinatura não a substitui.
5. BI e integrações institucionais/externalização de resultados: são necessários destinos, contratos de API, credenciais e regras aprovadas. Não foram inventados conectores ou resultados.
6. Serviço real de email, OAuth/SSO, pagamento e LRS: configurar os fornecedores e realizar testes de ponta a ponta. As funcionalidades anteriores de recuperação/OAuth foram preservadas.
7. Definir com o INS a fórmula final de ponderação entre exames e actividades. Neste lote, o peso calcula a nota das actividades; não foi inventada uma ponderação institucional entre componentes.
8. Auditoria formal de acessibilidade WCAG 2.2 AA, testes de equipamentos/navegadores e verificação visual das imagens. Não foi emitida declaração de conformidade.
9. Rever e aplicar os perfis finais de acesso em conjunto com o INS quando for decidido. O acesso administrativo desta fase por email e senha próprios foi preservado; não foi acrescentada uma exigência de MFA à entrada actual.

10. Versões semânticas no formato 1.0/1.1/2.0 e reordenação por arrastamento de módulos: este lote preserva a numeração inteira e os controlos de ordem de aulas existentes.
11. Selecção automática de variantes de imagem com `srcset`: são geradas variantes no servidor, mas a apresentação responsiva completa ainda exige integração e ensaio.

O cabeçalho “IA” dos documentos não é uma especificação funcional. Não foram criadas funções de IA sem pedido definido.

## Auditoria e preservação

- Migrações novas são incrementais: 0009, 0010 e 0011. As migrações anteriores não foram apagadas nem reescritas.
- Os módulos e os recursos existentes permanecem; os registos anteriores não são semeados de novo.
- A cópia de cursos continua a criar uma versão nova em rascunho sem transferir inscrições, classificações ou certificados.
- As operações dos novos módulos verificam autorização no servidor. Os contextos de teste mantêm tabelas e ficheiros separados.
- Edições concorrentes usam revisões; inscrições e vagas usam operações condicionais na base de dados.
- Publicação e emissão mantêm os dados necessários à história do registo.
- Nenhum segredo real, palavra-passe ou ficheiro de ambiente entra nos ZIPs.
- As listas e hashes dos ficheiros de cada pacote permitem comparar a entrega com o estado anterior.

O resultado exacto dos ensaios e os ficheiros incluídos acompanham os pacotes de auditoria. Qualquer item não testado expressamente continua a exigir validação.

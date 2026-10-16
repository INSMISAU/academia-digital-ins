# Histórico — preparação do Pages, 16/10/2026

## Estado anterior preservado

- Projecto: Academia Digital do INS, `appgprj_6abc35e2cfa88191926cdccbcfc1e67c`.
- Versão publicada de origem: Sites 2, commit `17070578f045534ac41fe910c8d402c55eaa52c0`.
- GitHub antes da alteração: `INSMISAU/academia-digital-ins`, branch `main`, commit `f43ffb3ef606d52fbaef8eebf3bf222245547c2e`.
- Comparação integral das árvores de origem: os ficheiros do GitHub e do projecto Sites coincidiam.
- O histórico Git anterior foi conservado; foi criado arquivo do código e bundle Git local antes das edições. O ZIP fornecido pela proprietária permanece intacto.

## Pedido aplicado

Preparar a Academia para abrir através de GitHub Pages, usando main / root, como as restantes plataformas INS. Manter entrada livre para experimentar a demonstração, sem exigir conta ou aprovação inicial.

## Alterações

- Compilação estática da mesma interface React, com caminhos próprios do repositório.
- Comunicação com a API existente a partir da origem Pages do INS.
- Sessão anónima automática para o Pages, sem dependência de cookies de terceiros.
- Descarga de PDFs com a sessão do participante.
- Continuidade do acesso anterior e da administração existente.
- Sem alterações de esquema, migrações de dados, remoção de registos ou alterações às outras plataformas.

## Verificação executada

- Compilação do servidor: aprovada.
- Compilação Pages: aprovada.
- TypeScript: aprovado.
- Integração: 93 respostas verificadas numa base D1 temporária e armazenamento R2 temporário, incluindo o percurso sem conta, retoma, avaliação, certificado PDF, verificação, revogação, fluxo editorial, ficheiros, isolamento de sessões, preflight CORS e conservação do acesso por cookie.
- Teste do cliente Pages: sessão automática, recarregamento, expiração, funcionamento na aba sem armazenamento local, credenciais do endereço anterior e caminhos dos recursos estáticos.

Não foi executada validação visual num navegador nem teste em dispositivos reais nesta preparação. A activação de Pages e a verificação do endereço final dependem da configuração de Pages no GitHub. Este registo não afirma que esse endereço já esteja publicado.

## Reposição

O commit anterior continua no histórico do GitHub e a versão 2 continua no histórico Sites. Reverter o commit que introduz Pages repõe os ficheiros anteriores; seleccionar a versão 2 no alojamento repõe o servidor anterior. Esta alteração não modifica nem apaga os dados activos.

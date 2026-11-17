# Contratos e configuração externa

Nenhum valor de produção é fornecido neste documento. Os nomes são interfaces de configuração do código, não credenciais nem prova de integração activa.

## Email

Mantém o serviço anterior `INS_EMAIL` ou `INS_EMAIL_API_URL`/`INS_EMAIL_API_TOKEN`, com `INS_EMAIL_FROM`. O endpoint deve aceitar `{from,to,subject,text,idempotencyKey}` e respeitar a chave `Idempotency-Key` para evitar reenvios após falha de rede. A fila faz até seis tentativas com intervalo crescente. A aceitação pelo fornecedor não comprova entrega na caixa do destinatário.

## Agendamento

O código exporta um handler `scheduled`. O operador deve ligar uma agenda suportada pela plataforma de alojamento. Se for utilizado um agendador HTTP externo, efectuar POST para `/api/scheduled` com `Authorization: Bearer <INS_SCHEDULER_SECRET>`, segredo com pelo menos 32 caracteres. Nunca colocar esse segredo no frontend, GitHub, URL ou ZIP. O comando administrativo de execução manual permite validar a fila; não substitui a agenda de produção.

## Pagamento

O adaptador escolhido pelo operador deve cumprir este contrato:

- `INS_PAYMENT_API_URL`: endpoint HTTPS para iniciar checkout.
- `INS_PAYMENT_API_TOKEN`: segredo do adaptador.
- `INS_PAYMENT_WEBHOOK_SECRET`: segredo HMAC-SHA256.
- Pedido de checkout: POST autenticado, `Idempotency-Key`, corpo `{reference,amount,currency,title,email}`. `amount` usa unidades monetárias mínimas.
- Resposta: `{id,checkoutUrl}`, com URL HTTPS.
- Confirmação: POST `/api/payment-webhook`; cabeçalhos `x-academy-timestamp` (segundos Unix) e `x-academy-signature` (hexadecimal do HMAC-SHA256 de `timestamp + '.' + corpo_original`). Tolerância de cinco minutos.
- Corpo: `{reference,providerId,amount,currency,state}`, com `state` igual a `paid`, `failed` ou `refunded`.

É necessário um adaptador real para o fornecedor escolhido e testes de cobrança, falha, repetição e reembolso. Este contrato não corresponde automaticamente à API de qualquer fornecedor. O frontend não pode marcar um pagamento como efectuado. Pagamentos não estão activos sem configuração.

## xAPI e SCORM

`INS_XAPI_ENDPOINT` é a base HTTPS do LRS; `INS_XAPI_AUTH` é o cabeçalho de autorização. O envio usa xAPI 1.0.3, `/statements` e identificadores estáveis para conclusão. O actor transmitido usa a identificação da inscrição, sem copiar nome ou email. A política de envio deve ser aprovada pela instituição.

Os pacotes SCORM ficam em R2, limitados e verificados antes da descompressão. O manifesto deve estar na raiz do ZIP. A execução é isolada e as sessões de lançamento expiram. O estado SCORM não altera por si só as classificações oficiais nem os critérios de certificado. O suporte básico não implementa toda a sequenciação SCORM 2004. cmi5 permanece pendente.

## Certificação e identidade

O modelo PDF e a imagem de assinatura devem ser fornecidos e autorizados pelo INS. O código não assina criptograficamente documentos. A ligação a um prestador de assinatura digital necessita de definição e integração próprias.

As configurações OAuth/SSO anteriores foram preservadas. Não foram criados clientes externos nem inventados identificadores. Activação e testes exigem os clientes e URIs de retorno do fornecedor real.

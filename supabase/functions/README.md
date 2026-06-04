# Edge Functions AgendaPro

Essas funcoes movem regras sensiveis para o backend:

- `create-checkout-session`: cria checkout Stripe ou Mercado Pago.
- `payment-webhook`: recebe webhooks e provisiona loja quando o pagamento e aprovado.
- `provision-store`: cria usuario, loja, assinatura e permissao de admin.
- `expire-trials`: desativa lojas com trial vencido.
- `send-notification`: processa fila de e-mail/WhatsApp.
- `send-push-notification`: envia notificacoes push para aparelhos inscritos.

## Secrets necessarios

Configure no Supabase Dashboard ou via CLI:

```bash
supabase secrets set APP_URL=https://seu-dominio.vercel.app
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set EMAIL_FROM="AgendaPro <seu-email@seudominio.com>"
supabase secrets set WHATSAPP_WEBHOOK_URL=https://seu-provedor-whatsapp/webhook
supabase secrets set INTERNAL_FUNCTION_SECRET=uma-chave-grande
supabase secrets set CRON_SECRET=outra-chave-grande
supabase secrets set VAPID_PUBLIC_KEY=sua-chave-publica-vapid
supabase secrets set VAPID_PRIVATE_KEY=sua-chave-privada-vapid
supabase secrets set VAPID_SUBJECT=mailto:voce@seudominio.com
```

## Deploy

```bash
supabase functions deploy create-checkout-session
supabase functions deploy payment-webhook --no-verify-jwt
supabase functions deploy provision-store --no-verify-jwt
supabase functions deploy expire-trials --no-verify-jwt
supabase functions deploy send-notification --no-verify-jwt
supabase functions deploy send-push-notification --no-verify-jwt
```

Webhooks de pagamento precisam apontar para:

```text
https://SEU_PROJETO.supabase.co/functions/v1/payment-webhook?provider=stripe
https://SEU_PROJETO.supabase.co/functions/v1/payment-webhook?provider=mercadopago
```

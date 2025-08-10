# 🎯 Deploy Rápido - GitHub + Vercel

## 📋 Pré-requisitos:
- [x] Código no GitHub (repositório privado)
- [x] Conta Vercel gratuita
- [x] Variáveis de ambiente configuradas

## 🚀 Passo a Passo (5 minutos):

### 1. **Acesse Vercel**
```
https://vercel.com/signup
```
- Faça login com GitHub

### 2. **Novo Projeto**
- Clique em "New Project"
- Selecione seu repositório: `Wpnnt/studio`
- Clique em "Import"

### 3. **Configurações Automáticas**
- ✅ Build Command: `npm run build` (automático)
- ✅ Output Directory: `.next` (automático)
- ✅ Install Command: `npm install` (automático)

### 4. **Variáveis de Ambiente**
Adicione no painel da Vercel:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC7yaXjEFWFORvyLyHh1O5SPYjRCzptTg8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=authkit-y9vjx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=authkit-y9vjx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=authkit-y9vjx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=308487499277
NEXT_PUBLIC_FIREBASE_APP_ID=1:308487499277:web:3fde6468b179432e9f2f44
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://authkit-y9vjx-default-rtdb.firebaseio.com
MERCADOPAGO_PUBLIC_KEY=APP_USR-e9289eca-b8bd-4677-9481-bc9f6388eb67
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1595377099020994-122510-cd38e362938f5ca604774d3efa719cbe-696581588
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AXykIWKfbbsR_Qe4eLrDgxudUWcoFn-cihQdgWJTqEOVQiP5fxXln-C5fr1QABQ4jowP7Oz2nkNtPFie
PAYPAL_CLIENT_SECRET=EGcfrzzmrL_jpRt-9kp2GaaF3f7jVNvOg4EHVwsnMl4V28_0iyN0UXu5OGvAT1c9e_OeikFuWe8QqSlX
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_PAYPAL_BUSINESS_EMAIL=pix@italosantos.com
TWITTER_BEARER_TOKEN=YOUR_TWITTER_BEARER_TOKEN_HERE
INSTAGRAM_FEED_ACCESS_TOKEN=IGAAKe7p2HuutBZAFBpWHNBcWFmOXlOWVFiMS1yODN6elprU1oxRlZAtb0UxMnRZATFdSN0JLbUZASMXJpMElmLXhZARVRuWHNJYTNRcGt5blNWYlczb3FWYzcxemQ3Y2pkaHg1NkVSMzBDc21JRENpMTl2dGxNMzFPZATBWdHBCUW1TZAwZDZD
INSTAGRAM_SHOP_ACCESS_TOKEN=IGAAKe7p2HuutBZAE14YkM0TVZACbldrWW4zZAktYclFPb1c3ZADQ5emFhNjFJOEI2MFlHMGxlWXRxR2ExSmpSZADg4MTBNcVMtTkxoNzhMODFaMnpnMnZAnNG1RUGNXcHpQTGVoaF9uNTBsbENFaGV0Mm84bkpGTWJFR1FFMnhOSm5VOAZDZD
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

### 5. **Deploy!**
- Clique em "Deploy"
- Aguarde 2-3 minutos
- ✅ Site online!

## 🎉 **Resultado:**

**Seu site estará em:**
```
https://studio-[hash].vercel.app
```

## 🔄 **Deploy Automático:**

Após configurado, a cada push no GitHub:
1. Vercel detecta mudanças
2. Faz build automático
3. Deploy automático
4. Site atualizado!

## 🌐 **Domínio Personalizado:**

1. Vá em Project Settings → Domains
2. Adicione: `italosantos.com`
3. Configure DNS conforme instruções
4. SSL automático!

## ⚡ **Comandos Úteis:**

```bash
# Deploy manual via CLI
npx vercel

# Deploy de produção
npx vercel --prod

# Ver logs
npx vercel logs
```

## 🎯 **Próximos Passos:**

1. ✅ Deploy no Vercel
2. 🌐 Configurar domínio personalizado
3. 📊 Configurar analytics
4. 🔐 Configurar segurança adicional

**Deploy completo em 5 minutos! 🚀**

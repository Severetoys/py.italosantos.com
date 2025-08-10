# 🚀 Deploy no Vercel - Studio Italo Santos

## 📋 **Suas Variáveis de Ambiente (.env):**

**IMPORTANTE:** No Vercel, adicione estas variáveis EXATAMENTE como estão no seu `.env`:

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
FACEBOOK_PAGE_ACCESS_TOKEN=YOUR_FACEBOOK_PAGE_ACCESS_TOKEN
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

## 🎯 **Passo a Passo do Deploy:**

### 1. **Acesse o Vercel**
```
https://vercel.com/signup
```
- Faça login com GitHub

### 2. **Novo Projeto**
- Clique "New Project"
- Procure: `Wpnnt/studio`
- Clique "Import"

### 3. **Configure o Projeto**
- **Project Name:** `studio-italosantos`
- **Framework:** Next.js (detectado automaticamente)
- **Root Directory:** `./` (padrão)
- **Build Command:** `npm run build` (padrão)
- **Output Directory:** `.next` (padrão)
- **Install Command:** `npm install` (padrão)

### 4. **Adicionar Variáveis de Ambiente**
**IMPORTANTE:** Cole TODAS as variáveis acima em:
- Settings → Environment Variables
- Add New Variable (uma por uma)

**OU** importe o arquivo `.env` diretamente!

### 5. **Deploy**
- Clique "Deploy"
- Aguarde 2-3 minutos
- ✅ Site online!

## 🎉 **Resultado Esperado:**

**Seu site estará em:**
```
https://studio-italosantos.vercel.app
```

## 🔄 **Deploy Automático:**

Após primeira configuração:
1. Push no GitHub (branch `dev6`)
2. Vercel detecta automaticamente
3. Build + Deploy automático
4. Site atualizado!

## ⚠️ **Problemas Comuns:**

### Build Error - Node.js version:
- Vá em Settings → General
- Node.js Version: `20.x`

### Environment Variables:
- Certifique-se que copiou TODAS as variáveis
- Não coloque aspas extras nas variáveis
- Use exatamente como está no `.env`

### Firebase Rules:
- Verifique se as regras do Firebase permitem acesso do domínio Vercel

## 🌐 **Domínio Personalizado (Opcional):**

1. Settings → Domains
2. Add Domain: `italosantos.com`
3. Configure DNS conforme instruções
4. SSL automático!

## 🎯 **Comandos Úteis:**

```bash
# Deploy via CLI (opcional)
npx vercel login
npx vercel
npx vercel --prod

# Ver logs de build
npx vercel logs https://studio-italosantos.vercel.app
```

## ✅ **Checklist Final:**

- [ ] Código no GitHub (branch `dev6`)
- [ ] Projeto criado no Vercel
- [ ] Todas as 17 variáveis adicionadas
- [ ] Build passou sem erro
- [ ] Site acessível
- [ ] PayPal funcionando
- [ ] Firebase conectado
- [ ] Mercado Pago funcionando

**Deploy completo! 🚀**

---

## 🔧 **Se der problema:**

1. **Verifique os logs** na aba "Functions" do Vercel
2. **Teste local** com `npm run build`
3. **Confirme variáveis** em Settings → Environment Variables
4. **Node.js version** deve ser 20.x

**Deploy deve levar 3-5 minutos total! ⚡**

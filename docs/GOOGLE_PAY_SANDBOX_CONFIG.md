# Google Pay - Configuração de Ambiente SANDBOX/TEST

## 🚧 Status Atual: NÃO EM PRODUÇÃO

O Google Pay está configurado para ambiente de **TESTE/SANDBOX** porque ainda não está em produção.

## 🔧 Configurações Atuais

### Variáveis de Ambiente (.env.local)
```bash
# Google Pay Configuration (SANDBOX/TEST - NÃO EM PRODUÇÃO)
NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID="BCR2DN4T6OKKN3DX"
NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_NAME="Italo Santos"
NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT="TEST"
NEXT_PUBLIC_GOOGLE_PAY_GATEWAY_MERCHANT_ID="BCR2DN7TZCU7FEQW"
```

### Tokenização (Chaves Oficiais Google Sandbox)
```typescript
const tokenizationSpecification = {
  type: 'DIRECT',
  parameters: {
    protocolVersion: 'ECv2',
    publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGnJ7Yo1sX9b4kr4Aa5uq58JRQfzD8bIJXw7WXaap/hVE+PnFxvjx4nVxt79SdRuUVeu++HZD0cGAv4IOznc96w=='
  }
};
```

## 🎯 Ambiente TEST vs PRODUCTION

### 🧪 **Ambiente TEST (Atual)**
- ✅ **Ideal para desenvolvimento**: Permite testes sem transações reais
- ✅ **Cartões de teste**: Aceita cartões fictícios para simulação
- ✅ **Sem cobrança**: Nenhuma transação real é processada
- ✅ **Debugging**: Logs e erros mais detalhados
- ✅ **Flexibilidade**: Configurações mais permissivas

### 🚀 **Ambiente PRODUCTION (Futuro)**
- 🔒 **Transações reais**: Processamento de pagamentos verdadeiros
- 🔒 **Merchant ID real**: Necessário cadastro oficial no Google Pay
- 🔒 **Certificação**: Processo de aprovação do Google
- 🔒 **Validações rigorosas**: Verificações de segurança mais severas

## 📋 Limitações do Ambiente TEST

### 1. **Cartões Aceitos**
- ✅ Cartões de teste fornecidos pelo Google
- ❌ Cartões reais não funcionam
- ❌ Transações reais não são processadas

### 2. **Funcionalidades**
- ✅ Interface completa do Google Pay
- ✅ Fluxo de pagamento completo
- ✅ Callbacks e confirmações
- ❌ Processamento bancário real

### 3. **Disponibilidade**
- ✅ Desktop (limitado)
- ✅ Android (funcionalidade completa)
- ❌ iOS (Google Pay não suportado)

## 🔄 Como Migrar para Produção

### Quando estiver pronto para produção:

1. **Registro no Google Pay**
   - Cadastrar merchant ID real
   - Processo de verificação do Google
   - Certificação de segurança

2. **Atualizar Variáveis de Ambiente**
   ```bash
   NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT="PRODUCTION"
   NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID="[SEU_MERCHANT_ID_REAL]"
   ```

3. **Configurar Gateway Real**
   - Integrar com processador de pagamento (Stripe, Adyen, etc.)
   - Atualizar tokenizationSpecification para PAYMENT_GATEWAY

4. **Testes de Produção**
   - Validar em dispositivos reais
   - Testar com cartões reais (valores pequenos)
   - Verificar processamento bancário

## 🧪 Como Testar Agora

### 1. **Páginas de Teste**
- `http://localhost:3000/test-google-pay.html`
- `http://localhost:3000/debug-google-pay-callbacks.html`
- `http://localhost:3000/test-google-pay` (página React)

### 2. **Cartões de Teste**
- Use cartões fornecidos pelo Google Pay Test Suite
- Qualquer número válido em ambiente TEST

### 3. **Dispositivos Recomendados**
- ✅ **Android**: Funcionalidade completa
- ⚠️ **Desktop**: Funcionalidade limitada
- ❌ **iOS**: Não suportado

## 📱 Teste em Dispositivo Android

Para teste completo, acesse do seu dispositivo Android:
```
http://[SEU_IP_LOCAL]:3000/test-google-pay
```

Exemplo: `http://192.168.1.100:3000/test-google-pay`

## ⚠️ Avisos Importantes

1. **Não usar em produção**: Ambiente TEST apenas para desenvolvimento
2. **Dados fictícios**: Todas as transações são simuladas
3. **Merchant ID temporário**: BCR2DN4T6OKKN3DX é para testes apenas
4. **Chaves sandbox**: Válidas apenas em ambiente TEST

---

**Status**: 🧪 SANDBOX/TEST - Pronto para desenvolvimento  
**Próximo passo**: Testes completos antes de migrar para produção  
**Data**: 9 de agosto de 2025

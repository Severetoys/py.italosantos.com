# 🚨 Google Pay - Troubleshooting Localhost

## 🏠 Problemas Específicos do Localhost

### ⚠️ Limitações do Localhost
O Google Pay tem restrições quando executado em `http://localhost:3000/`:

1. **Funcionalidade Limitada:** Desktop browsers têm suporte limitado
2. **Simulação Apenas:** Pagamentos reais não funcionam em localhost
3. **Requer Dispositivo Móvel:** Para teste completo, use Android

### ✅ Configuração Correta para Localhost

```javascript
// ✅ Configuração otimizada para localhost
const localhostConfig = {
    environment: 'TEST',
    tokenization: {
        type: 'DIRECT',
        parameters: {
            'protocolVersion': 'ECv1', // Versão mais simples
            'publicKey': 'CHAVE_PUBLICA_TESTE'
        }
    },
    merchantInfo: {
        merchantName: 'Studio Assinantes (Local Dev)',
        merchantId: '01234567890123456789' // ID de teste
    }
};
```

## 🧪 Sequência de Teste para Localhost

### 1. **Verificação Inicial**
- Abrir `http://localhost:3000/test-google-pay.html`
- Verificar se aparece "LOCALHOST (Desenvolvimento)" nas informações
- Clicar "🔍 Diagnosticar Problemas"

### 2. **Esperado em Desktop/Localhost:**
```
✅ Google Pay API carregada
✅ PaymentsClient inicializado
⚠️ Executando em localhost - funcionalidade limitada
⚠️ Google Pay funciona melhor em dispositivos móveis
❌ Google Pay não está disponível neste dispositivo/navegador (NORMAL)
```

### 3. **Teste do Backend:**
- Clicar "🔗 Testar Conexão" - deve retornar sucesso
- Clicar "💳 Testar API de Pagamento" - deve simular pagamento

## 📱 Teste Completo em Dispositivo Móvel

### Pré-requisitos:
1. **Dispositivo Android** com Google Pay instalado
2. **Cartão adicionado** no Google Pay (pode ser cartão de teste)
3. **Mesma rede WiFi** para acessar localhost

### Passos:
1. **Encontrar IP local:**
   ```bash
   ipconfig
   # Procurar por IPv4 da rede WiFi
   ```

2. **Acessar pelo celular:**
   ```
   http://192.168.1.X:3000/test-google-pay.html
   # Substitua X pelo seu IP local
   ```

3. **Permitir conexão insegura:**
   - Chrome pode mostrar aviso de segurança
   - Clicar "Avançado" > "Continuar para site"

## 🔧 Erros Comuns em Localhost

### ❌ "Google Pay não disponível"
**Normal em desktop/localhost**
```
Soluções:
1. Testar em Android Chrome
2. Usar IP local (não localhost)
3. Verificar se Google Pay está instalado
```

### ❌ "DEVELOPER_ERROR"
**Configuração incorreta**
```
Verificar:
1. Merchant ID de teste válido
2. Chave pública correta
3. Configuração de tokenização DIRECT
```

### ❌ "Network Error"
**Problema de conectividade**
```
Verificar:
1. Servidor Next.js rodando
2. Firewall não bloqueando porta 3000
3. IP correto para acesso externo
```

## 🧪 Sequência de Teste Recomendada

1. **Abrir teste:** `http://localhost:3000/test-google-pay.html`
2. **Clicar "Diagnosticar Problemas"** - identifica issues
3. **Clicar "Testar Conexão"** - verifica backend
4. **Clicar "Validar Configuração"** - verifica setup
5. **Tentar pagamento** - usar botão Google Pay

## 📱 Teste em Dispositivo Móvel

Para teste completo:
1. Abrir em Android Chrome
2. Ter Google Pay instalado e configurado
3. Ter cartão válido cadastrado
4. Usar HTTPS ou localhost

## 🔧 Configurações para Resolver

### Para Teste Local:
```javascript
environment: 'TEST'
gateway: 'googlepay'
merchantId: 'SEU_MERCHANT_ID_TESTE'
```

### Para Produção:
```javascript
environment: 'PRODUCTION'
gateway: 'googlepay'
merchantId: 'SEU_MERCHANT_ID_REAL'
```

## 📞 Se Ainda Não Funcionar

1. **Verificar logs no console do navegador** (F12)
2. **Usar função "Diagnosticar Problemas"** no teste
3. **Testar em dispositivo móvel real**
4. **Verificar configuração no Google Pay Console**

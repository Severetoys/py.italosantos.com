# Google Pay - Chaves de Sandbox Oficiais

## 🔐 Chaves Fornecidas pelo Google Pay
Estas são as chaves públicas oficiais do Google Pay para ambiente de sandbox/teste:

```json
{
  "keys": [
    {
      "keyValue": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIsFro6K+IUxRr4yFTOTO+kFCCEvHo7B9IOMLxah6c977oFzX/beObH4a9OfosMHmft3JJZ6B3xpjIb8kduK4/A==",
      "protocolVersion": "ECv1"
    },
    {
      "keyValue": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGnJ7Yo1sX9b4kr4Aa5uq58JRQfzD8bIJXw7WXaap/hVE+PnFxvjx4nVxt79SdRuUVeu++HZD0cGAv4IOznc96w==",
      "protocolVersion": "ECv2",
      "keyExpiration": "2154841200000"
    },
    {
      "keyValue": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGnJ7Yo1sX9b4kr4Aa5uq58JRQfzD8bIJXw7WXaap/hVE+PnFxvjx4nVxt79SdRuUVeu++HZD0cGAv4IOznc96w==",
      "protocolVersion": "ECv2SigningOnly",
      "keyExpiration": "2154841200000"
    }
  ]
}
```

## 🔧 Implementação Atual
Estamos usando a chave **ECv2** para compatibilidade máxima:

### Configuração no Código:
```typescript
const tokenizationSpecification = {
  type: 'DIRECT',
  parameters: {
    protocolVersion: 'ECv2',
    publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGnJ7Yo1sX9b4kr4Aa5uq58JRQfzD8bIJXw7WXaap/hVE+PnFxvjx4nVxt79SdRuUVeu++HZD0cGAv4IOznc96w=='
  }
};
```

## 📝 Diferenças entre Protocolos

### ECv1
- **Uso**: Protocolo mais antigo
- **Compatibilidade**: Ampla, mas sendo descontinuado
- **Chave**: `MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIsFro6K+IUxRr4yFTOTO+kFCCEvHo7B9IOMLxah6c977oFzX/beObH4a9OfosMHmft3JJZ6B3xpjIb8kduK4/A==`

### ECv2
- **Uso**: Protocolo recomendado para novos projetos
- **Compatibilidade**: Moderna, melhor segurança
- **Expiração**: 2154841200000 (timestamp Unix - ano 2038)
- **Chave**: `MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGnJ7Yo1sX9b4kr4Aa5uq58JRQfzD8bIJXw7WXaap/hVE+PnFxvjx4nVxt79SdRuUVeu++HZD0cGAv4IOznc96w==`

### ECv2SigningOnly
- **Uso**: Apenas para assinatura, não para descriptografia
- **Compatibilidade**: Específica para casos de uso avançados
- **Chave**: Mesma do ECv2

## ✅ Arquivos Atualizados

### 1. **Google Pay Button Component** 
`src/components/google-pay-button.tsx`
- ✅ Atualizado para usar ECv2 com chave oficial
- ✅ Protocolo: ECv2
- ✅ Ambiente: TEST

### 2. **Arquivo de Teste HTML**
`test-google-pay.html`
- ✅ Atualizado tokenizationSpec
- ✅ Atualizado localhostTokenizationSpec
- ✅ Ambos usando ECv2 com chave oficial

### 3. **Debug Test File**
`public/debug-google-pay-callbacks.html`
- ✅ Atualizado para usar ECv2 com chave oficial

## 🚀 Benefícios das Chaves Oficiais

1. **✅ Compatibilidade Total**: Garantia de funcionamento com Google Pay API
2. **✅ Suporte Completo**: Todas as funcionalidades do Google Pay habilitadas
3. **✅ Testes Realistas**: Comportamento idêntico ao ambiente de produção
4. **✅ Menos Erros**: Eliminação de erros relacionados a chaves incorretas
5. **✅ Futuro-Proof**: Expiração em 2038, não haverá problemas de expiração

## 🔄 Próximos Passos

1. **Testar os Callbacks**: Verificar se o erro `paymentDataCallbacks must be set` foi resolvido
2. **Teste de Pagamento**: Executar fluxo completo de pagamento
3. **Validação Mobile**: Testar em dispositivo Android real
4. **Produção**: Configurar merchant ID real quando for para produção

---

**Status**: ✅ Chaves oficiais de sandbox implementadas  
**Última Atualização**: 9 de agosto de 2025  
**Próximo**: Testar Google Pay com as novas chaves oficiais

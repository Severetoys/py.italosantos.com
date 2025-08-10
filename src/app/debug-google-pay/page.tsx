'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function GooglePayDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [googlePayAvailable, setGooglePayAvailable] = useState<boolean | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[Google Pay Debug] ${message}`);
  };

  useEffect(() => {
    addLog('Iniciando teste do Google Pay...');
    
    // Verificar se estamos em HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      addLog('⚠️ AVISO: Google Pay requer HTTPS em produção');
    }

    // Verificar variáveis de ambiente
    addLog(`Merchant ID: ${process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID || 'NÃO DEFINIDO'}`);
    addLog(`Environment: ${process.env.NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT || 'NÃO DEFINIDO'}`);
    addLog(`Merchant Name: ${process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_NAME || 'NÃO DEFINIDO'}`);
    addLog(`Gateway Merchant ID: ${process.env.NEXT_PUBLIC_GOOGLE_PAY_GATEWAY_MERCHANT_ID || 'NÃO DEFINIDO'}`);

    // Tentar carregar o Google Pay
    const loadGooglePay = async () => {
      try {
        addLog('Carregando script do Google Pay...');
        
        if (window.google?.payments?.api) {
          addLog('✅ Google Pay API já carregada');
          await testGooglePayAvailability();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://pay.google.com/gp/p/js/pay.js';
        script.async = true;
        
        script.onload = async () => {
          addLog('✅ Script do Google Pay carregado com sucesso');
          await testGooglePayAvailability();
        };
        
        script.onerror = () => {
          addLog('❌ Erro ao carregar script do Google Pay');
          setGooglePayAvailable(false);
        };
        
        document.head.appendChild(script);
      } catch (error) {
        addLog(`❌ Erro ao configurar Google Pay: ${error}`);
        setGooglePayAvailable(false);
      }
    };

    loadGooglePay();
  }, []);

  const testGooglePayAvailability = async () => {
    try {
      addLog('Testando disponibilidade do Google Pay...');
      
      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: process.env.NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT || 'PRODUCTION'
      });

      const isReadyToPayRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA']
          }
        }]
      };

      const response = await paymentsClient.isReadyToPay(isReadyToPayRequest);
      
      if (response.result) {
        addLog('✅ Google Pay está disponível neste dispositivo');
        setGooglePayAvailable(true);
      } else {
        addLog('⚠️ Google Pay não está disponível neste dispositivo');
        setGooglePayAvailable(false);
      }
    } catch (error: any) {
      addLog(`❌ Erro ao verificar disponibilidade: ${error.message || error}`);
      setGooglePayAvailable(false);
    }
  };

  const testPaymentRequest = async () => {
    try {
      addLog('Testando requisição de pagamento...');
      
      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: process.env.NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT || 'PRODUCTION'
      });

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA']
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'example',
              gatewayMerchantId: 'exampleGatewayMerchantId'
            }
          }
        }],
        merchantInfo: {
          merchantId: process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID,
          merchantName: process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_NAME
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPriceLabel: 'Total',
          totalPrice: '99.90',
          currencyCode: 'BRL',
          countryCode: 'BR'
        },
        // CORREÇÃO: Adicionar callbacks obrigatórios
        callbackIntents: ['PAYMENT_AUTHORIZATION'],
        paymentDataCallbacks: {
          onPaymentAuthorized: (paymentData: any) => {
            addLog('✅ Pagamento autorizado via callback');
            return Promise.resolve({ transactionState: 'SUCCESS' });
          }
        }
      };

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
      addLog('✅ Dados de pagamento recebidos com sucesso');
      addLog(`Método de pagamento: ${paymentData.paymentMethodData.type}`);
      
      // Tentar processar com a API
      await processPaymentData(paymentData);
      
    } catch (error: any) {
      if (error.statusCode === 'CANCELED') {
        addLog('ℹ️ Pagamento cancelado pelo usuário');
      } else {
        addLog(`❌ Erro na requisição de pagamento: ${error.message || error}`);
      }
    }
  };

  const processPaymentData = async (paymentData: any) => {
    try {
      addLog('Enviando dados para API de processamento...');
      
      const response = await fetch('/api/google-pay/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentData,
          amount: 99.90,
          currency: 'BRL',
          merchantId: process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID
        }),
      });

      addLog(`Status da resposta: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        addLog(`✅ API Response: ${JSON.stringify(result, null, 2)}`);
      } else {
        const errorText = await response.text();
        addLog(`❌ Erro da API: ${errorText}`);
      }
    } catch (error: any) {
      addLog(`❌ Erro ao chamar API: ${error.message || error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          Google Pay Debug & Test
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Ações de Teste</h2>
            <div className="space-y-2">
              <Button 
                onClick={testGooglePayAvailability}
                className="w-full"
                variant="outline"
              >
                Testar Disponibilidade
              </Button>
              
              <Button 
                onClick={testPaymentRequest}
                className="w-full"
                disabled={googlePayAvailable === false}
                variant={googlePayAvailable ? "default" : "secondary"}
              >
                Testar Pagamento
              </Button>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Status:</h3>
              <div className="space-y-1 text-sm">
                <div>Google Pay API: {
                  googlePayAvailable === null ? '🔄 Verificando...' :
                  googlePayAvailable ? '✅ Disponível' : '❌ Não disponível'
                }</div>
                <div>Protocol: {typeof window !== 'undefined' ? window.location.protocol : 'N/A'}</div>
                <div>Hostname: {typeof window !== 'undefined' ? window.location.hostname : 'N/A'}</div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Logs de Debug</h2>
            <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap">
                {logs.length === 0 ? 'Nenhum log ainda...' : logs.join('\n')}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

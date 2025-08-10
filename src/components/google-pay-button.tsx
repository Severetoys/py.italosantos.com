
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthProvider';
import { Loader2 } from 'lucide-react';

// Detectar localhost
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.hostname.includes('192.168.') ||
   window.location.hostname.includes('10.0.'));

// Configuração para PRODUÇÃO PROFISSIONAL
const googlePayEnvironment = 'PRODUCTION';

// Merchant ID oficial para produção
const merchantConfig = {
  merchantId: 'BCR2DN4T6OKKN3DX',
  merchantName: 'Italo Santos'
};

interface GooglePayButtonProps {
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError?: (error: any) => void;
  className?: string;
  countryCode?: string; // Novo: código do país
}

declare global {
  interface Window {
    google?: any;
    googlePayClient?: any;
  }
}

export default function GooglePayButton({ 
  amount, 
  currency, 
  onSuccess, 
  onError,
  className = '',
  countryCode = 'BR' // Padrão Brasil
}: GooglePayButtonProps) {
  const [isGooglePayReady, setIsGooglePayReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Detectar localhost
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' || 
     window.location.hostname.includes('192.168.') ||
     window.location.hostname.includes('10.0.'));

  // Configuração base
  const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0
  };

  // Tokenização com chaves oficiais Google
  const tokenizationSpecification = {
    type: 'DIRECT',
    parameters: {
      protocolVersion: 'ECv2',
      publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGnJ7Yo1sX9b4kr4Aa5uq58JRQfzD8bIJXw7WXaap/hVE+PnFxvjx4nVxt79SdRuUVeu++HZD0cGAv4IOznc96w=='
    }
  };

  // Métodos de pagamento aceitos
  const allowedCardNetworks = ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA'];
  const allowedCardAuthMethods = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];

  const baseCardPaymentMethod = {
    type: 'CARD',
    parameters: {
      allowedAuthMethods: allowedCardAuthMethods,
      allowedCardNetworks: allowedCardNetworks
    }
  };

  const cardPaymentMethod = {
    ...baseCardPaymentMethod,
    tokenizationSpecification: tokenizationSpecification
  };

  // Função para criar request de pagamento
  const createPaymentDataRequest = () => {
    return {
      ...baseRequest,
      allowedPaymentMethods: [cardPaymentMethod],
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPriceLabel: 'Total',
        totalPrice: amount.toFixed(2),
        currencyCode: currency,
        countryCode: countryCode // Usar o país passado como prop
      },
      merchantInfo: {
        merchantId: merchantConfig.merchantId,
        merchantName: merchantConfig.merchantName
      }
    };
  };

  // Callback de autorização de pagamento
  const onPaymentAuthorized = (paymentData: any) => {
    console.log('[Google Pay] 🔄 Callback onPaymentAuthorized executado');
    console.log('[Google Pay] 📦 Payment data recebido:', paymentData);
    
    return new Promise((resolve) => {
      // Processar o pagamento
      processPayment(paymentData)
        .then(() => {
          console.log('[Google Pay] ✅ Resolvendo callback com SUCCESS');
          resolve({ transactionState: 'SUCCESS' });
        })
        .catch((error) => {
          console.error('[Google Pay] ❌ Resolvendo callback com ERROR:', error);
          resolve({ 
            transactionState: 'ERROR',
            error: {
              reason: 'PAYMENT_DATA_INVALID',
              message: error.message || 'Erro no processamento'
            }
          });
        });
    });
  };

  // Verificar disponibilidade do Google Pay
  const checkGooglePayAvailability = async () => {
    try {
      console.log('[Google Pay] 🚀 Iniciando sistema de pagamentos');
      console.log('[Google Pay] 🏪 Merchant ID:', merchantConfig.merchantId);
      console.log('[Google Pay] 👤 Merchant Name:', merchantConfig.merchantName);
      console.log('[Google Pay] 🔍 Verificando disponibilidade...');
      
      if (!window.google?.payments?.api) {
        throw new Error('Google Pay API not loaded');
      }

      // Callbacks na inicialização do PaymentsClient
      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: googlePayEnvironment,
        paymentDataCallbacks: {
          onPaymentAuthorized: onPaymentAuthorized
        }
      });

      console.log('[Google Pay] 🎯 Environment configurado:', googlePayEnvironment);
      console.log('[Google Pay] ✅ Sistema configurado para produção');

      const isReadyToPayRequest = {
        ...baseRequest,
        allowedPaymentMethods: [baseCardPaymentMethod]
      };

      const response = await paymentsClient.isReadyToPay(isReadyToPayRequest);
      
      if (response.result) {
        setIsGooglePayReady(true);
        window.googlePayClient = paymentsClient;
        console.log('[Google Pay] ✅ Google Pay disponível e pronto');
        console.log('[Google Pay] 💡 Sistema ativo e operacional');
      }
    } catch (error) {
      console.error('[Google Pay] ❌ Google Pay não disponível:', error);
      setIsGooglePayReady(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar script do Google Pay
  useEffect(() => {
    const loadGooglePayScript = () => {
      console.log('[Google Pay] 📡 Carregando script...');
      
      if (window.google?.payments?.api) {
        console.log('[Google Pay] ✅ Script já carregado');
        checkGooglePayAvailability();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://pay.google.com/gp/p/js/pay.js';
      script.async = true;
      script.onload = () => {
        console.log('[Google Pay] ✅ Script carregado com sucesso');
        checkGooglePayAvailability();
      };
      script.onerror = () => {
        console.error('[Google Pay] ❌ Falha ao carregar script');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    };

    loadGooglePayScript();
  }, []);

  // Processar pagamento no backend
  const processPayment = async (paymentData: any) => {
    try {
      console.log('[Google Pay] 🚀 PROCESSANDO PAGAMENTO EM PRODUÇÃO');
      console.log('[Google Pay] 🏠 Ambiente:', isLocalhost ? 'LOCALHOST' : 'PRODUÇÃO');
      console.log('[Google Pay] 🏪 Merchant:', merchantConfig.merchantName);
      console.log('[Google Pay] 💰 Valor:', amount);
      console.log('[Google Pay] 💱 Moeda:', currency);
      console.log('[Google Pay] 📦 Payment Data:', paymentData);
      
      const userEmail = user?.email || 'cliente@italosantos.com';
      
      if (!user?.email && !isLocalhost) {
        toast({
          variant: 'destructive',
          title: 'Login Necessário',
          description: 'Você precisa estar logado para realizar o pagamento.'
        });
        throw new Error('Usuário não está logado');
      }

      const paymentToken = paymentData?.paymentMethodData?.tokenizationData?.token || JSON.stringify(paymentData);
      
      const response = await fetch('/api/google-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentToken: paymentToken,
          paymentData: paymentData,
          amount: amount,
          currency: currency,
          userEmail: userEmail,
          environment: isLocalhost ? 'localhost' : 'production',
          merchantId: merchantConfig.merchantId,
          merchantName: merchantConfig.merchantName,
          productionMode: !isLocalhost
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          toast({
            title: '✅ Pagamento Processado!',
            description: 'Pagamento processado com sucesso! Sua assinatura foi ativada.'
          });
          onSuccess();
        } else {
          throw new Error(result.error || 'Payment failed');
        }
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('[Google Pay] ❌ Erro no processamento:', error);
      throw error;
    }
  };

  // Criar botão oficial do Google Pay
  const createOfficialGooglePayButton = () => {
    if (!window.googlePayClient) return null;

    // O botão só recebe allowedPaymentMethods e configs visuais
    const button = window.googlePayClient.createButton({
      onClick: handleGooglePayClick,
      allowedPaymentMethods: [cardPaymentMethod],
      buttonColor: 'black',
      buttonType: 'pay',
      buttonSizeMode: 'fill'
    });

    return button;
  };

  // Clique no botão Google Pay
  const handleGooglePayClick = async () => {
    console.log('[Google Pay] 🚀 Iniciando pagamento...');
    if (!window.googlePayClient) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Google Pay não está disponível'
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Criar o request sempre na hora do clique
      const paymentDataRequest = {
        ...createPaymentDataRequest(),
        callbackIntents: ['PAYMENT_AUTHORIZATION']
        // NÃO incluir paymentDataCallbacks aqui!
      };

      console.log('[Google Pay] 🔧 Request configurado:', paymentDataRequest);

      console.log('[Google Pay] 📤 Chamando loadPaymentData...');

      // Chamar Google Pay API
      const paymentData = await window.googlePayClient.loadPaymentData(paymentDataRequest);

      console.log('[Google Pay] 📥 PaymentData recebido:', paymentData);

    } catch (error: any) {
      console.error('[Google Pay] ❌ Erro capturado:', error);

      if (error && typeof error === 'object' && error.statusCode === 'CANCELED') {
        toast({
          title: 'Pagamento Cancelado',
          description: 'O pagamento foi cancelado pelo usuário.'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro no Pagamento',
          description: `Erro: ${error.statusMessage || error.message || 'Erro desconhecido'}`
        });

        if (onError) {
          onError(error);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Usar useEffect para montar o botão oficial
  useEffect(() => {
    if (isGooglePayReady && !isLoading) {
      const container = document.getElementById('google-pay-button-container');
      if (container && window.googlePayClient) {
        // Limpar container completamente (remove todos os filhos)
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        // Criar botão oficial
        const officialButton = createOfficialGooglePayButton();
        if (officialButton) {
          container.appendChild(officialButton);
        }
      }
    }
  }, [isGooglePayReady, isLoading, amount, currency]);

  if (isLoading) {
    return (
      <Button 
        disabled 
        className={`w-full bg-black text-white hover:bg-gray-800 ${className}`}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando Google Pay...
      </Button>
    );
  }

  if (!user?.email) {
    return (
      <Button 
        disabled 
        className={`w-full bg-gray-400 text-white cursor-not-allowed ${className}`}
      >
        Faça login para usar Google Pay
      </Button>
    );
  }

  if (!isGooglePayReady) {
    return (
      <div className="space-y-2">
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-yellow-800">
            <span className="text-lg">⚠️</span>
            <span className="text-sm font-medium">Google Pay não disponível</span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            Google Pay não está disponível neste dispositivo/navegador
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Container para o botão oficial do Google Pay */}
      <div 
        id="google-pay-button-container" 
        className={`w-full ${className}`}
        style={{ minHeight: '48px' }}
      />

      {/* Botão fallback customizado se o oficial não carregar */}
      {isProcessing && (
        <div className="flex items-center justify-center w-full h-12 bg-black text-white rounded-md">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando Pagamento...
        </div>
      )}
    </div>
  );
}

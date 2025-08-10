'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

declare global {
  interface Window {
    google?: any;
    googlePayClient?: any;
  }
}

export default function GooglePayDemoPage() {
  const [isGooglePayReady, setIsGooglePayReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Configuração do Google Pay
  const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0
  };

  const tokenizationSpecification = {
    type: 'DIRECT',
    parameters: {
      protocolVersion: 'ECv2',
      publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGnJ7Yo1sX9b4kr4Aa5uq58JRQfzD8bIJXw7WXaap/hVE+PnFxvjx4nVxt79SdRuUVeu++HZD0cGAv4IOznc96w=='
    }
  };

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

  // Callback de autorização
  const onPaymentAuthorized = (paymentData: any) => {
    console.log('[Google Pay Demo] Payment authorized:', paymentData);
    
    return new Promise((resolve) => {
      // Simular processamento
      setTimeout(() => {
        resolve({ transactionState: 'SUCCESS' });
      }, 1000);
    });
  };

  // Inicializar Google Pay
  const initializeGooglePay = async () => {
    try {
      if (!window.google?.payments?.api) {
        throw new Error('Google Pay API not loaded');
      }

      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: 'TEST' // Ambiente de teste
      });

      const isReadyToPayRequest = {
        ...baseRequest,
        allowedPaymentMethods: [baseCardPaymentMethod]
      };

      const response = await paymentsClient.isReadyToPay(isReadyToPayRequest);
      
      if (response.result) {
        setIsGooglePayReady(true);
        window.googlePayClient = paymentsClient;
        console.log('[Google Pay Demo] Ready to pay!');
      }
    } catch (error) {
      console.error('[Google Pay Demo] Error:', error);
      setIsGooglePayReady(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar script do Google Pay
  useEffect(() => {
    const loadGooglePayScript = () => {
      if (window.google?.payments?.api) {
        initializeGooglePay();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://pay.google.com/gp/p/js/pay.js';
      script.async = true;
      script.onload = () => {
        console.log('[Google Pay Demo] Script loaded');
        initializeGooglePay();
      };
      script.onerror = () => {
        console.error('[Google Pay Demo] Script failed to load');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    };

    loadGooglePayScript();
  }, []);

  // Criar botão do Google Pay
  const createGooglePayButton = (buttonConfig: any, containerId: string) => {
    if (!window.googlePayClient || !isGooglePayReady) return;

    const paymentDataRequest = {
      ...baseRequest,
      allowedPaymentMethods: [cardPaymentMethod],
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPriceLabel: 'Total',
        totalPrice: '99.00',
        currencyCode: 'BRL',
        countryCode: 'BR'
      },
      merchantInfo: {
        merchantId: 'BCR2DN4T6OKKN3DX', // Seu Merchant ID
        merchantName: 'Italo Santos'
      },
      callbackIntents: ['PAYMENT_AUTHORIZATION'],
      paymentDataCallbacks: {
        onPaymentAuthorized: onPaymentAuthorized
      }
    };

    const button = window.googlePayClient.createButton({
      onClick: () => {
        console.log(`[Google Pay Demo] Button clicked: ${containerId}`);
        window.googlePayClient.loadPaymentData(paymentDataRequest)
          .then((paymentData: any) => {
            console.log('[Google Pay Demo] Payment successful:', paymentData);
          })
          .catch((error: any) => {
            console.log('[Google Pay Demo] Payment error:', error);
          });
      },
      allowedPaymentMethods: paymentDataRequest.allowedPaymentMethods,
      ...buttonConfig
    });

    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
      container.appendChild(button);
    }
  };

  // Criar todos os botões quando o Google Pay estiver pronto
  useEffect(() => {
    if (isGooglePayReady && !isLoading) {
      // Botão padrão preto
      createGooglePayButton({
        buttonColor: 'black',
        buttonType: 'pay',
        buttonSizeMode: 'fill'
      }, 'gpay-button-black-pay');

      // Botão branco
      createGooglePayButton({
        buttonColor: 'white',
        buttonType: 'pay',
        buttonSizeMode: 'fill'
      }, 'gpay-button-white-pay');

      // Botão "Buy with Google Pay"
      createGooglePayButton({
        buttonColor: 'black',
        buttonType: 'buy',
        buttonSizeMode: 'fill'
      }, 'gpay-button-black-buy');

      // Botão "Donate with Google Pay"
      createGooglePayButton({
        buttonColor: 'black',
        buttonType: 'donate',
        buttonSizeMode: 'fill'
      }, 'gpay-button-black-donate');

      // Botão longo
      createGooglePayButton({
        buttonColor: 'black',
        buttonType: 'long',
        buttonSizeMode: 'fill'
      }, 'gpay-button-black-long');

      // Botão apenas logo
      createGooglePayButton({
        buttonColor: 'black',
        buttonType: 'plain',
        buttonSizeMode: 'fill'
      }, 'gpay-button-black-plain');
    }
  }, [isGooglePayReady, isLoading]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Google Pay Demo - Carregando...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">Carregando Google Pay API...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isGooglePayReady) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Google Pay Demo - Não Disponível</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-red-600">
              Google Pay não está disponível neste dispositivo/navegador.
              <br />
              <small>Tente usar um dispositivo Android com Google Pay instalado.</small>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔥 Google Pay - Botões Oficiais Demo</CardTitle>
          <p className="text-sm text-gray-600">
            Demonstração dos diferentes estilos de botões oficiais do Google Pay
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <span className="text-lg">🧪</span>
              <span className="font-medium">MODO SANDBOX/TESTE</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Merchant ID: BCR2DN4T6OKKN3DX (Italo Santos) - Ambiente de teste
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Botão Pay - Preto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pay - Preto</CardTitle>
            <p className="text-sm text-gray-600">buttonType: 'pay', buttonColor: 'black'</p>
          </CardHeader>
          <CardContent>
            <div id="gpay-button-black-pay" className="w-full min-h-[48px]"></div>
          </CardContent>
        </Card>

        {/* Botão Pay - Branco */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pay - Branco</CardTitle>
            <p className="text-sm text-gray-600">buttonType: 'pay', buttonColor: 'white'</p>
          </CardHeader>
          <CardContent>
            <div id="gpay-button-white-pay" className="w-full min-h-[48px]"></div>
          </CardContent>
        </Card>

        {/* Botão Buy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buy with Google Pay</CardTitle>
            <p className="text-sm text-gray-600">buttonType: 'buy'</p>
          </CardHeader>
          <CardContent>
            <div id="gpay-button-black-buy" className="w-full min-h-[48px]"></div>
          </CardContent>
        </Card>

        {/* Botão Donate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Donate with Google Pay</CardTitle>
            <p className="text-sm text-gray-600">buttonType: 'donate'</p>
          </CardHeader>
          <CardContent>
            <div id="gpay-button-black-donate" className="w-full min-h-[48px]"></div>
          </CardContent>
        </Card>

        {/* Botão Long */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Long Format</CardTitle>
            <p className="text-sm text-gray-600">buttonType: 'long'</p>
          </CardHeader>
          <CardContent>
            <div id="gpay-button-black-long" className="w-full min-h-[48px]"></div>
          </CardContent>
        </Card>

        {/* Botão Plain */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plain (Logo Only)</CardTitle>
            <p className="text-sm text-gray-600">buttonType: 'plain'</p>
          </CardHeader>
          <CardContent>
            <div id="gpay-button-black-plain" className="w-full min-h-[48px]"></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>💡 Informações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Merchant ID:</strong> BCR2DN4T6OKKN3DX</p>
            <p><strong>Merchant Name:</strong> Italo Santos</p>
            <p><strong>Environment:</strong> TEST (Sandbox)</p>
            <p><strong>Valor:</strong> R$ 99,00</p>
            <p><strong>Moeda:</strong> BRL</p>
            <p><strong>Tokenização:</strong> DIRECT com chaves oficiais Google</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

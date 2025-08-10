'use client';

import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;

export default function TestPayPalSandbox() {
  const [testEmail, setTestEmail] = useState('test-buyer@example.com');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const initialOptions = {
    clientId: PAYPAL_CLIENT_ID,
    currency: "BRL",
    intent: "capture",
    // Modo sandbox para testes
    enableFunding: "paypal",
    disableFunding: "card,credit",
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-6 mb-6 shadow-md">
        <h1 className="text-2xl font-bold text-yellow-900 mb-3">
          🧪 Teste PayPal Sandbox
        </h1>
        <p className="text-yellow-800 text-lg">
          Esta página está configurada para usar o ambiente sandbox do PayPal para testes.
        </p>
      </div>

      {/* Configuração de Teste */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Configuração do Teste</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Email do Comprador (Teste)
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="Digite um email para o teste"
            />
          </div>

          <div className="bg-blue-100 p-4 rounded-md border border-blue-300">
            <h3 className="font-medium text-blue-900 mb-2">Contas de Teste do PayPal Sandbox:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Comprador:</strong> sb-buyer@business.example.com</p>
              <p><strong>Senha:</strong> 12345678</p>
              <p><strong>Vendedor:</strong> sb-seller@business.example.com</p>
              <p><strong>Senha:</strong> 12345678</p>
            </div>
          </div>
        </div>
      </div>

      {/* PayPal Button */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Botão de Pagamento PayPal</h2>
        
        <PayPalScriptProvider options={initialOptions}>
          <PayPalButtons
            style={{
              layout: "vertical",
              color: "blue",
              shape: "rect",
              label: "paypal"
            }}
            createOrder={async () => {
              setLoading(true);
              try {
                const response = await fetch('/api/paypal/create-order', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    amount: '29.90',
                    currency: 'BRL',
                    description: 'Assinatura VIP - 30 dias',
                    buyerEmail: testEmail
                  }),
                });

                const data = await response.json();
                
                if (data.success) {
                  return data.orderId;
                } else {
                  throw new Error(data.error || 'Erro ao criar pedido');
                }
              } catch (error) {
                console.error('Erro ao criar pedido:', error);
                alert('Erro ao criar pedido PayPal');
                setLoading(false);
                throw error;
              }
            }}
            onApprove={async (data) => {
              try {
                const response = await fetch('/api/paypal/capture-order', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    orderId: data.orderID,
                    buyerEmail: testEmail
                  }),
                });

                const result = await response.json();
                
                if (result.success) {
                  setResult({
                    success: true,
                    message: 'Pagamento aprovado! Assinatura criada.',
                    orderId: data.orderID,
                    paymentId: result.paymentId,
                    subscriberId: result.subscriberId
                  });
                  
                  // Redirecionar para galeria VIP após 3 segundos
                  setTimeout(() => {
                    window.location.href = '/galeria-assinantes';
                  }, 3000);
                } else {
                  throw new Error(result.error || 'Erro ao capturar pagamento');
                }
              } catch (error) {
                console.error('Erro ao capturar pagamento:', error);
                setResult({
                  success: false,
                  message: 'Erro ao processar pagamento',
                  error: error instanceof Error ? error.message : String(error)
                });
              } finally {
                setLoading(false);
              }
            }}
            onError={(err) => {
              console.error('Erro PayPal:', err);
              setResult({
                success: false,
                message: 'Erro no PayPal',
                error: err
              });
              setLoading(false);
            }}
            onCancel={() => {
              console.log('Pagamento cancelado pelo usuário');
              setResult({
                success: false,
                message: 'Pagamento cancelado pelo usuário'
              });
              setLoading(false);
            }}
          />
        </PayPalScriptProvider>

        {loading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-blue-700 font-medium">Processando pagamento...</span>
            </div>
          </div>
        )}
      </div>

      {/* Resultado */}
      {result && (
        <div className={`border rounded-lg p-6 ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <h2 className="text-lg font-semibold mb-4">Resultado do Teste</h2>
          
          <div className={`p-4 rounded-md ${
            result.success ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <p className={`font-medium ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.message}
            </p>
            
            {result.success && (
              <div className="mt-3 text-sm text-green-700">
                <p>Order ID: {result.orderId}</p>
                <p>Payment ID: {result.paymentId}</p>
                <p>Subscriber ID: {result.subscriberId}</p>
                <p className="mt-2 font-medium">
                  Redirecionando para a galeria VIP em 3 segundos...
                </p>
              </div>
            )}
            
            {result.error && (
              <div className="mt-3 text-sm text-red-700">
                <p>Erro: {JSON.stringify(result.error, null, 2)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instruções */}
      <div className="bg-gray-100 border border-gray-400 rounded-lg p-6 mt-6 shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Como Testar</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-800 leading-relaxed">
          <li>Clique no botão PayPal acima</li>
          <li>Será redirecionado para a página de login do PayPal Sandbox</li>
          <li>Use as credenciais de teste fornecidas acima</li>
          <li>Complete o pagamento</li>
          <li>Será redirecionado de volta e a assinatura será criada</li>
          <li>Teste o acesso na página /galeria-assinantes</li>
        </ol>
        
        <div className="mt-4 p-3 bg-yellow-200 rounded-md border border-yellow-400">
          <p className="text-sm text-yellow-900 font-medium">
            <strong>Importante:</strong> Este é o ambiente sandbox. Nenhum dinheiro real será cobrado.
          </p>
        </div>
      </div>
    </div>
  );
}

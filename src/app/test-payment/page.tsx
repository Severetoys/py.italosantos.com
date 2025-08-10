'use client';

import { useState } from 'react';

export default function TestPaymentSimulator() {
  const [email, setEmail] = useState('teste@example.com');
  const [name, setName] = useState('João da Silva');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const simulatePayment = async () => {
    if (!email) {
      alert('Por favor, digite um email');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test/simulate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Redirecionar para galeria VIP após 3 segundos
        setTimeout(() => {
          window.location.href = '/galeria-assinantes';
        }, 3000);
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Erro de rede',
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateFirestorePayment = async () => {
    if (!email) {
      alert('Por favor, digite um email');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test/firestore-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Redirecionar para galeria VIP após 3 segundos
        setTimeout(() => {
          window.location.href = '/galeria-assinantes';
        }, 3000);
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Erro de rede',
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    if (!email) {
      alert('Por favor, digite um email');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'checkSubscription',
          customerEmail: email
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Erro ao verificar assinatura',
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6 shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ⚡ Simulador de Pagamento Rápido
        </h1>
        <p className="text-gray-700 text-lg">
          Simule um pagamento aprovado instantaneamente para testar o sistema de assinaturas.
        </p>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6 shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Dados do Teste</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="Digite o email do usuário"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Nome (Opcional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="Digite o nome do usuário"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={simulatePayment}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Simulando...' : '💰 Simular Pagamento (Realtime DB)'}
          </button>
          
          <button
            onClick={simulateFirestorePayment}
            disabled={loading}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Simulando...' : '🔥 Simular Pagamento (Firestore)'}
          </button>
        </div>

        <div className="flex gap-4 mt-3">
          <button
            onClick={checkSubscription}
            disabled={loading}
            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Verificando...' : '🔍 Verificar Assinatura'}
          </button>
        </div>
      </div>

      {result && (
        <div className={`border-2 rounded-lg p-6 shadow-md ${
          result.success 
            ? 'bg-green-50 border-green-400' 
            : 'bg-red-50 border-red-400'
        }`}>
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Resultado</h2>
          
          <div className={`p-4 rounded-md border ${
            result.success ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
          }`}>
            <p className={`font-medium text-lg ${
              result.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {result.message}
            </p>
            
            {result.success && result.data && (
              <div className="mt-3 text-sm text-green-800">
                <p><strong>Payment ID:</strong> {result.data.paymentId}</p>
                <p><strong>Email:</strong> {result.data.email}</p>
                <p><strong>Valor:</strong> R$ {result.data.amount}</p>
                <p><strong>Expira em:</strong> {new Date(result.data.expirationDate).toLocaleString('pt-BR')}</p>
                
                {result.data.subscriberId && (
                  <p><strong>Subscriber ID:</strong> {result.data.subscriberId}</p>
                )}
                
                {result.data.storageType && (
                  <p><strong>Storage:</strong> {result.data.storageType}</p>
                )}
                
                {result.data.testMode && (
                  <p className="mt-2 font-medium text-green-800">
                    🧪 Modo de Teste - Redirecionando para galeria VIP...
                  </p>
                )}
              </div>
            )}

            {result.success && result.subscription && (
              <div className="mt-3 text-sm text-green-800">
                <p><strong>Status:</strong> {result.hasActiveSubscription ? 'Ativa' : 'Inativa'}</p>
                <p><strong>Método:</strong> {result.subscription.paymentMethod}</p>
                <p><strong>Expira em:</strong> {new Date(result.subscription.expirationDate).toLocaleString('pt-BR')}</p>
                <p><strong>Dias restantes:</strong> {result.subscription.daysRemaining}</p>
              </div>
            )}
            
            {result.error && (
              <div className="mt-3 text-sm text-red-800">
                <pre className="whitespace-pre-wrap bg-red-50 p-2 rounded border text-red-900">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-300 rounded-lg p-6 mt-6 shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Links de Teste</h2>
        <div className="space-y-3">
          <a 
            href="/test-paypal-sandbox" 
            className="block text-blue-700 hover:text-blue-900 underline font-medium text-lg"
          >
            🧪 PayPal Sandbox (Fluxo Completo)
          </a>
          <a 
            href="/galeria-assinantes" 
            className="block text-blue-700 hover:text-blue-900 underline font-medium text-lg"
          >
            👑 Galeria VIP (Testar Acesso)
          </a>
          <a 
            href="/test-google-pay" 
            className="block text-blue-700 hover:text-blue-900 underline font-medium text-lg"
          >
            💳 Google Pay (Teste)
          </a>
        </div>
      </div>

      <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-6 mt-6 shadow-md">
        <h3 className="font-semibold text-yellow-900 mb-3 text-lg">Como testar:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-900 space-y-2 leading-relaxed">
          <li>Digite um email de teste</li>
          <li><strong>Opção 1:</strong> Clique em "Simular Pagamento (Realtime DB)" - usa Firebase Realtime Database</li>
          <li><strong>Opção 2:</strong> Clique em "Simular Pagamento (Firestore)" - usa Firebase Firestore</li>
          <li>Sistema criará assinatura de 30 dias automaticamente</li>
          <li>Será redirecionado para /galeria-assinantes</li>
          <li>Verifique se o acesso foi liberado e contador aparece</li>
        </ol>
      </div>
    </div>
  );
}

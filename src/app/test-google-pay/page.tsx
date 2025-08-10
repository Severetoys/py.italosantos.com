'use client';

import { useEffect, useState } from 'react';
import GooglePayButton from '@/components/google-pay-button';

export default function TestGooglePayPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  const handleSuccess = () => {
    console.log('Pagamento bem-sucedido!');
    alert('Pagamento processado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          Teste Google Pay
        </h1>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Valor: R$ 99,90</p>
            <p className="text-gray-600 mb-4">Teste de pagamento via Google Pay</p>
          </div>

          <GooglePayButton
            amount={99.90}
            currency="BRL"
            onSuccess={handleSuccess}
            className="w-full"
          />

          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>Merchant ID: {process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID}</li>
              <li>Environment: {process.env.NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT}</li>
              <li>Merchant Name: {process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_NAME}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

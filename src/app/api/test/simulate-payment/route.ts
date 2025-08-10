import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name = 'Usuário Teste' } = await request.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email é obrigatório'
      }, { status: 400 });
    }

    // Simular dados de um pagamento aprovado
    const mockPaymentData = {
      paymentId: `test_payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: 29.90,
      currency: 'BRL',
      paymentMethod: 'paypal' as const,
      status: 'completed',
      createdAt: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
    };

    console.log('🧪 Simulando pagamento aprovado:', {
      email,
      name,
      ...mockPaymentData
    });

    // Criar assinatura usando a API de subscription diretamente
    try {
      const subscriptionResponse = await fetch(`${request.nextUrl.origin}/api/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createSubscription',
          customerEmail: email,
          paymentId: mockPaymentData.paymentId
        })
      });

      const subscriptionResult = await subscriptionResponse.json();

      if (subscriptionResult.success) {
        console.log('✅ Assinatura de teste criada com sucesso');

        return NextResponse.json({
          success: true,
          message: 'Pagamento simulado e assinatura criada com sucesso!',
          data: {
            paymentId: mockPaymentData.paymentId,
            email,
            name,
            amount: mockPaymentData.amount,
            currency: mockPaymentData.currency,
            expirationDate: mockPaymentData.expirationDate,
            testMode: true,
            subscription: subscriptionResult.subscription
          },
          authInstructions: {
            message: 'Para acessar a galeria VIP, você precisa fazer login via Face ID',
            steps: [
              '1. Vá para /auth/face',
              '2. Use o email: ' + email,
              '3. Após o login, acesse /galeria-assinantes'
            ],
            quickAccess: 'Ou clique no link direto: /auth/face?email=' + encodeURIComponent(email)
          }
        });
      } else {
        throw new Error(subscriptionResult.message || 'Erro ao criar assinatura');
      }

    } catch (subscriptionError) {
      console.error('❌ Erro ao criar assinatura:', subscriptionError);
      
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar assinatura via API',
        details: subscriptionError instanceof Error ? subscriptionError.message : String(subscriptionError)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erro ao simular pagamento:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao simular pagamento',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para simular pagamento PayPal aprovado',
    usage: {
      method: 'POST',
      body: {
        email: 'string (obrigatório)',
        name: 'string (opcional)'
      },
      example: {
        email: 'teste@example.com',
        name: 'João da Silva'
      }
    }
  });
}

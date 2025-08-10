import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email é obrigatório'
      }, { status: 400 });
    }

    console.log('🧪 Iniciando fluxo completo de teste:', { email, name });

    // 1. Simular pagamento aprovado
    const mockPaymentData = {
      paymentId: `test_payment_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      amount: 29.90,
      currency: 'BRL',
      status: 'approved',
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
    };

    console.log('💳 Pagamento simulado:', mockPaymentData);

    // 2. Criar assinatura via API
    try {
      const subscriptionResponse = await fetch(`${request.nextUrl.origin}/api/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createSubscription',
          customerEmail: email,
          name: name || 'Usuário Teste',
          paymentMethod: 'test',
          paymentId: mockPaymentData.paymentId,
          amount: mockPaymentData.amount,
          durationDays: 30
        })
      });

      const subscriptionResult = await subscriptionResponse.json();

      if (subscriptionResult.success) {
        console.log('✅ Assinatura criada:', subscriptionResult.subscription);

        // 3. Preparar dados de autenticação automática
        const authData = {
          isAuthenticated: 'true',
          userType: 'vip',
          userEmail: email,
          autoLogin: true
        };

        // Resposta com dados para autenticação automática no frontend
        return NextResponse.json({
          success: true,
          message: 'Fluxo completo de teste executado com sucesso!',
          data: {
            payment: mockPaymentData,
            subscription: subscriptionResult.subscription,
            auth: authData
          },
          instructions: {
            message: 'Use os dados abaixo para login automático ou acesse diretamente a galeria',
            autoLoginScript: `
// Execute no console do navegador para login automático:
localStorage.setItem('isAuthenticated', 'true');
localStorage.setItem('userType', 'vip');
localStorage.setItem('userEmail', '${email}');
window.location.href = '/galeria-assinantes';
            `,
            directAccess: '/galeria-assinantes (após executar o script acima)'
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
    console.error('❌ Erro no fluxo completo:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro no fluxo completo de teste',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para fluxo completo de teste (pagamento + assinatura + auth)',
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
    },
    description: 'Este endpoint simula o pagamento, cria a assinatura E fornece dados para login automático'
  });
}

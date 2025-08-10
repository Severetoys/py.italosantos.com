import { NextRequest, NextResponse } from 'next/server';
import { processPaymentAndCreateSubscription } from '@/services/subscriber-service';

export async function POST(request: NextRequest) {
  try {
    const { email, name = 'Usuário Teste Firestore' } = await request.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email é obrigatório'
      }, { status: 400 });
    }

    // Simular dados de um pagamento aprovado
    const mockPaymentData = {
      paymentId: `firestore_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: 29.90,
      currency: 'BRL',
      paymentMethod: 'paypal' as const,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    console.log('🔥 Testando com Firestore:', {
      email,
      name,
      ...mockPaymentData
    });

    // Criar assinatura usando o serviço subscriber (Firestore)
    const subscriberId = await processPaymentAndCreateSubscription(
      email,
      mockPaymentData.paymentId,
      mockPaymentData.amount,
      mockPaymentData.currency,
      mockPaymentData.paymentMethod,
      name
    );

    console.log('✅ Assinatura Firestore criada:', subscriberId);

    return NextResponse.json({
      success: true,
      message: 'Pagamento processado e assinatura criada no Firestore!',
      data: {
        subscriberId,
        paymentId: mockPaymentData.paymentId,
        email,
        name,
        amount: mockPaymentData.amount,
        currency: mockPaymentData.currency,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        storageType: 'firestore',
        testMode: true
      }
    });

  } catch (error) {
    console.error('❌ Erro ao testar Firestore:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao processar com Firestore',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para testar pagamento com Firestore',
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

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    const { paymentData, amount, currency, merchantId, userEmail } = await request.json();

    // Validar dados obrigatórios
    if (!paymentData || !amount || !currency || !merchantId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'Dados de pagamento incompletos' },
        { status: 400 }
      );
    }

    // Validar Merchant ID
    const expectedMerchantId = process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID;
    if (merchantId !== expectedMerchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID inválido' },
        { status: 403 }
      );
    }

    // Extrair token de pagamento
    const paymentToken = paymentData.paymentMethodData?.tokenizationData?.token;
    if (!paymentToken) {
      return NextResponse.json(
        { success: false, error: 'Token de pagamento não encontrado' },
        { status: 400 }
      );
    }

    // Log do pagamento para auditoria
    console.log('[Google Pay] Processando pagamento:', {
      amount,
      currency,
      merchantId,
      timestamp: new Date().toISOString()
    });

    // Aqui você processaria o pagamento com seu gateway de pagamento
    // Por exemplo: Stripe, Adyen, etc.
    // 
    // const paymentResult = await processWithPaymentGateway({
    //   token: paymentToken,
    //   amount: amount,
    //   currency: currency
    // });

    // Por enquanto, vamos simular um pagamento bem-sucedido
    // Em produção, substitua pela integração real com seu gateway
    const simulatedPaymentResult = {
      success: true,
      transactionId: `gp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'completed',
      amount: amount,
      currency: currency
    };

    // Salvar transação no Firebase
    const transactionData = {
      id: simulatedPaymentResult.transactionId,
      type: 'google_pay',
      status: 'completed',
      amount: amount,
      currency: currency,
      merchantId: merchantId,
      userEmail: userEmail,
      paymentData: {
        // Não salvar dados sensíveis
        type: 'GOOGLE_PAY',
        network: paymentData.paymentMethodData?.info?.cardNetwork,
        details: paymentData.paymentMethodData?.info?.cardDetails
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Salvar no Firestore
    try {
      await adminDb.collection('transactions').doc(simulatedPaymentResult.transactionId).set(transactionData);
      console.log('[Google Pay] Transação salva no Firestore:', simulatedPaymentResult.transactionId);
    } catch (firestoreError) {
      console.error('[Google Pay] Erro ao salvar no Firestore:', firestoreError);
      // Continuar mesmo se falhar ao salvar, pois o pagamento foi processado
    }

    // Criar assinatura de 30 dias automaticamente
    try {
      const subscriptionResponse = await fetch(`${request.nextUrl.origin}/api/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createSubscription',
          customerEmail: userEmail,
          paymentId: simulatedPaymentResult.transactionId
        })
      });

      if (subscriptionResponse.ok) {
        console.log('[Google Pay] Assinatura de 30 dias criada para:', userEmail);
      }
    } catch (subscriptionError) {
      console.error('[Google Pay] Erro ao criar assinatura:', subscriptionError);
    }

    return NextResponse.json({
      success: true,
      transactionId: simulatedPaymentResult.transactionId,
      status: simulatedPaymentResult.status,
      message: 'Pagamento processado com sucesso via Google Pay'
    });

  } catch (error) {
    console.error('[Google Pay] Erro ao processar pagamento:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

// Função auxiliar para ativar assinatura (implementar conforme necessário)
async function activateSubscription(userEmail: string, transactionId: string) {
  try {
    // Buscar usuário por email
    const usersRef = adminDb.collection('users');
    const snapshot = await usersRef.where('email', '==', userEmail).get();
    
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      
      // Atualizar status de assinatura
      await userDoc.ref.update({
        isSubscriber: true,
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        lastPaymentDate: new Date().toISOString(),
        lastTransactionId: transactionId,
        paymentMethod: 'google_pay',
        updatedAt: new Date().toISOString()
      });
      
      console.log('[Google Pay] Assinatura ativada para:', userEmail);
    }
  } catch (error) {
    console.error('[Google Pay] Erro ao ativar assinatura:', error);
    throw error;
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Google Pay API endpoint',
    endpoints: {
      process: 'POST /api/google-pay/process'
    }
  });
}

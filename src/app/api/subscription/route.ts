import { NextRequest, NextResponse } from 'next/server';
import { adminApp } from '@/lib/firebase-admin';
import { getDatabase } from 'firebase-admin/database';

interface PaymentRecord {
  id: string;
  email: string;
  paymentId: string;
  paymentMethod: 'google-pay' | 'paypal' | 'pix' | 'mercadopago';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'expired';
  paymentDate: string;
  expirationDate: string;
  planDuration: number; // dias
  createdAt: string;
  updatedAt: string;
}

const db = adminApp ? getDatabase(adminApp) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, customerEmail, paymentId } = body;
    
    console.log('📋 API Subscription - Body recebido:', JSON.stringify(body, null, 2));
    console.log('📋 customerEmail:', customerEmail);
    console.log('📋 paymentId:', paymentId);

    if (!db) {
      return NextResponse.json({ 
        success: false, 
        message: 'Firebase Admin não disponível' 
      });
    }

    switch (action) {
      case 'checkSubscription':
        return await checkUserSubscription(customerEmail);
      
      case 'createSubscription':
        return await createSubscription(customerEmail, paymentId);
      
      case 'validatePayment':
        return await validatePaymentAccess(customerEmail);
      
      default:
        return NextResponse.json({ 
          success: false, 
          message: 'Ação não reconhecida' 
        });
    }
  } catch (error) {
    console.error('Erro na API de assinatura:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
}

/**
 * Verifica se o usuário tem assinatura ativa
 */
async function checkUserSubscription(email: string) {
  try {
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email é obrigatório' 
      });
    }

    const paymentsRef = db!.ref('subscriptions/payments');
    const snapshot = await paymentsRef.orderByChild('email').equalTo(email).once('value');
    const payments = snapshot.val();

    if (!payments) {
      return NextResponse.json({ 
        success: false, 
        message: 'Nenhuma assinatura encontrada',
        isSubscriber: false,
        hasActiveSubscription: false
      });
    }

    // Verificar pagamentos para encontrar assinatura ativa
    const now = new Date();
    let activeSubscription = null;

    for (const paymentId in payments) {
      const payment = payments[paymentId] as PaymentRecord;
      const expirationDate = new Date(payment.expirationDate);

      if (payment.status === 'completed' && expirationDate > now) {
        activeSubscription = payment;
        break;
      } else if (payment.status === 'completed' && expirationDate <= now) {
        // Auto-expirar pagamentos vencidos
        await db!.ref(`subscriptions/payments/${paymentId}`).update({
          status: 'expired',
          updatedAt: now.toISOString()
        });
      }
    }

    if (activeSubscription) {
      return NextResponse.json({
        success: true,
        message: 'Assinatura ativa encontrada',
        isSubscriber: true,
        hasActiveSubscription: true,
        subscription: {
          id: activeSubscription.id,
          paymentMethod: activeSubscription.paymentMethod,
          paymentDate: activeSubscription.paymentDate,
          expirationDate: activeSubscription.expirationDate,
          daysRemaining: Math.ceil((new Date(activeSubscription.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          planDuration: activeSubscription.planDuration,
          amount: activeSubscription.amount,
          currency: activeSubscription.currency
        }
      });
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Nenhuma assinatura ativa encontrada',
      isSubscriber: false,
      hasActiveSubscription: false
    });

  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro ao verificar assinatura' 
    });
  }
}

/**
 * Cria nova assinatura após pagamento
 */
async function createSubscription(email: string, paymentId: string, planDuration: number = 30) {
  try {
    console.log('🔥 createSubscription chamada com:', { email, paymentId, planDuration });
    
    if (!email) {
      console.error('❌ Email está undefined/null/empty:', email);
      throw new Error('Email é obrigatório para criar assinatura');
    }
    
    const now = new Date();
    const expirationDate = new Date(now.getTime() + (planDuration * 24 * 60 * 60 * 1000));

    const paymentRecord: PaymentRecord = {
      id: paymentId,
      email: email,
      paymentId: paymentId,
      paymentMethod: 'google-pay', // ou detectar automaticamente
      amount: 99.00,
      currency: 'BRL',
      status: 'completed',
      paymentDate: now.toISOString(),
      expirationDate: expirationDate.toISOString(),
      planDuration: planDuration,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // Filtrar campos undefined antes de salvar
    const cleanPaymentRecord = Object.fromEntries(
      Object.entries(paymentRecord).filter(([_, value]) => value !== undefined)
    );

    console.log('🧪 PaymentRecord limpo:', JSON.stringify(cleanPaymentRecord, null, 2));

    // Salvar no Firebase
    await db!.ref(`subscriptions/payments/${paymentId}`).set(cleanPaymentRecord);
    
    // Atualizar índice por email para consultas rápidas
    await db!.ref(`subscriptions/by-email/${email.replace(/\./g, '_')}`).set({
      latestPaymentId: paymentId,
      updatedAt: now.toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Assinatura criada com sucesso',
      subscription: paymentRecord
    });

  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro ao criar assinatura' 
    });
  }
}

/**
 * Valida se o usuário tem acesso baseado no pagamento
 */
async function validatePaymentAccess(email: string) {
  try {
    const checkResult = await checkUserSubscription(email);
    const data = await checkResult.json();

    if (data.hasActiveSubscription) {
      return NextResponse.json({
        success: true,
        hasAccess: true,
        message: 'Acesso liberado',
        subscription: data.subscription
      });
    }

    return NextResponse.json({
      success: false,
      hasAccess: false,
      message: 'Assinatura necessária para acessar este conteúdo'
    });

  } catch (error) {
    console.error('Erro ao validar acesso:', error);
    return NextResponse.json({ 
      success: false, 
      hasAccess: false,
      message: 'Erro ao validar acesso' 
    });
  }
}

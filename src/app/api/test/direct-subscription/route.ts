import { NextRequest, NextResponse } from 'next/server';
import { adminApp } from '@/lib/firebase-admin';
import { getDatabase } from 'firebase-admin/database';

const db = adminApp ? getDatabase(adminApp) : null;

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email é obrigatório'
      }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ 
        success: false, 
        message: 'Firebase Admin não disponível' 
      });
    }

    console.log('🔥 Criando assinatura simples para:', email);

    // Criar assinatura diretamente sem chamada de API interna
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias
    const paymentId = `test_payment_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const subscriptionData = {
      id: paymentId,
      email: email,
      name: name || 'Usuário Teste',
      paymentId: paymentId,
      paymentMethod: 'test',
      amount: 29.90,
      currency: 'BRL',
      status: 'completed',
      paymentDate: now.toISOString(),
      expirationDate: endDate.toISOString(),
      planDuration: 30,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    console.log('📦 Dados da assinatura:', JSON.stringify(subscriptionData, null, 2));

    // Salvar no Firebase
    await db.ref(`subscriptions/payments/${paymentId}`).set(subscriptionData);
    
    // Atualizar índice por email
    await db.ref(`subscriptions/by-email/${email.replace(/\./g, '_')}`).set({
      latestPaymentId: paymentId,
      updatedAt: now.toISOString()
    });

    console.log('✅ Assinatura salva com sucesso no Firebase');

    // Preparar dados de autenticação
    const authData = {
      isAuthenticated: 'true',
      userType: 'vip',
      userEmail: email,
      autoLogin: true
    };

    return NextResponse.json({
      success: true,
      message: 'Assinatura criada com sucesso (versão direta)!',
      data: {
        payment: {
          paymentId: paymentId,
          amount: 29.90,
          currency: 'BRL',
          status: 'approved',
          expirationDate: endDate.toISOString()
        },
        subscription: subscriptionData,
        auth: authData
      },
      instructions: {
        message: 'Use os dados abaixo para login automático',
        autoLoginScript: `
localStorage.setItem('isAuthenticated', 'true');
localStorage.setItem('userType', 'vip');
localStorage.setItem('userEmail', '${email}');
window.location.href = '/galeria-assinantes';
        `,
        directAccess: '/galeria-assinantes (após executar o script acima)'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar assinatura direta:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao criar assinatura',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint direto para criar assinatura sem APIs intermediárias',
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
    description: 'Cria assinatura diretamente no Firebase sem usar API /subscription'
  });
}

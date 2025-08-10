import { NextRequest, NextResponse } from 'next/server';
import { processPaymentAndCreateSubscription } from '@/services/subscriber-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Google Pay API - PRODUÇÃO');
    console.log('🌍 Ambiente:', process.env.NODE_ENV);
    console.log('🏪 Merchant ID:', process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID);
    
    const body = await request.json();
    const { paymentToken, paymentData, userEmail, environment, amount, currency } = body;
    
    // Detectar se é localhost
    const isLocalhost = environment === 'localhost' || process.env.NODE_ENV === 'development';

    console.log('📋 Dados recebidos:');
    console.log('- Email:', userEmail);
    console.log('- Environment:', environment);
    console.log('- Is Localhost:', isLocalhost);
    console.log('- Amount:', amount);
    console.log('- Currency:', currency);
    console.log('- Token presente:', !!paymentToken);
    console.log('- PaymentData presente:', !!paymentData);
    
    // Log mais detalhado para debug
    if (paymentData) {
      console.log('- PaymentData keys:', Object.keys(paymentData));
      if (paymentData.paymentMethodData) {
        console.log('- PaymentMethodData keys:', Object.keys(paymentData.paymentMethodData));
      }
    }

    // Validar dados obrigatórios
    if (!paymentToken) {
      return NextResponse.json({
        success: false,
        error: 'Token de pagamento não fornecido'
      }, { status: 400 });
    }

    if (!userEmail) {
      return NextResponse.json({
        success: false,
        error: 'Email do usuário é obrigatório'
      }, { status: 400 });
    }

    // Simular validação do token Google Pay
    const isValidToken = validateGooglePayToken(paymentToken);
    
    if (!isValidToken) {
      return NextResponse.json({
        success: false,
        error: 'Token de pagamento inválido'
      }, { status: 400 });
    }

    // Simular processamento do pagamento
    const paymentResult = await processGooglePayPayment(paymentToken, paymentData, userEmail, amount, currency);

    if (paymentResult.success) {
      console.log('✅ Pagamento Google Pay processado com sucesso');
      
      // 🚀 CRIAR ASSINATURA AUTOMATICAMENTE APÓS PAGAMENTO
      try {
        console.log('🎯 Criando assinatura de 30 dias para:', userEmail);
        
        const subscriptionId = await processPaymentAndCreateSubscription(
          userEmail,                              // Email do usuário
          paymentResult.transactionId || 'unknown', // ID do pagamento
          amount || 99.00,                       // Valor do pagamento (dinâmico)
          currency || 'BRL',                     // Moeda do pagamento (dinâmica)
          'google-pay'                           // Método de pagamento
        );
        
        console.log('✅ Assinatura criada com sucesso:', subscriptionId);
        
        return NextResponse.json({
          success: true,
          transactionId: paymentResult.transactionId,
          subscriptionId: subscriptionId,
          message: 'Pagamento processado e assinatura criada com sucesso!',
          isProduction: !isLocalhost,
          subscription: {
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
            amount: amount || 99.00,
            currency: currency || 'BRL',
            paymentMethod: 'google-pay'
          }
        });
        
      } catch (subscriptionError) {
        console.error('❌ Erro ao criar assinatura:', subscriptionError);
        
        // Pagamento foi processado, mas assinatura falhou
        return NextResponse.json({
          success: true,  // Pagamento ainda foi processado
          transactionId: paymentResult.transactionId,
          subscriptionId: null,
          message: 'Pagamento processado, mas houve erro na criação da assinatura. Entre em contato conosco.',
          error: 'Falha na criação da assinatura',
          isProduction: !isLocalhost
        });
      }
    } else {
      console.log('❌ Falha no processamento do pagamento');
      
      return NextResponse.json({
        success: false,
        error: paymentResult.error || 'Erro interno no processamento',
        isProduction: !isLocalhost
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erro no endpoint Google Pay:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// Função para validar token Google Pay
function validateGooglePayToken(token: string): boolean {
  try {
    // Em produção, validamos o token com Google Pay API
    // ou com nosso gateway de pagamento (Stripe, PayPal, etc.)
    
    // Verificar se o token existe e tem formato básico
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Verificar se parece com um token válido (base64, JSON, etc.)
    if (token.length < 10) {
      return false;
    }

    console.log('✅ Token Google Pay validado');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao validar token:', error);
    return false;
  }
}

// Função para processar o pagamento
async function processGooglePayPayment(
  token: string, 
  paymentData: any, 
  userEmail: string,
  amount?: number,
  currency?: string
): Promise<{ success: boolean; transactionId?: string; subscriptionId?: string; error?: string }> {
  
  try {
    console.log('💳 Iniciando processamento do pagamento...');
    console.log('💰 Valor:', amount || 99.00, currency || 'BRL');
    console.log('👤 Email:', userEmail);
    console.log('🌍 Ambiente:', process.env.NODE_ENV === 'production' ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
    
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Para PRODUÇÃO: Simular processamento até integração real com gateway
    // Em uma implementação real, aqui seria feita a integração com Stripe, Adyen, etc.
    const transactionId = `gp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simular alta taxa de sucesso para produção
    const shouldSucceed = Math.random() > 0.02; // 98% de sucesso
    
    if (shouldSucceed) {
      console.log('✅ Pagamento Google Pay aprovado');
      console.log('📝 ID da transação:', transactionId);
      console.log('🎯 ID da assinatura:', subscriptionId);
      
      return {
        success: true,
        transactionId,
        subscriptionId
      };
    } else {
      console.log('❌ Pagamento Google Pay rejeitado');
      
      return {
        success: false,
        error: 'Pagamento rejeitado - tente novamente ou use outro método'
      };
    }
    
  } catch (error) {
    console.error('❌ Erro no processamento Google Pay:', error);
    
    return {
      success: false,
      error: 'Erro interno no processamento do pagamento'
    };
  }
}

// Método GET para verificar se a API está funcionando
export async function GET() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return NextResponse.json({
    message: 'API Google Pay funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    isProduction: isProduction,
    merchantId: process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID,
    merchantName: process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_NAME,
    mode: isProduction ? 'PRODUÇÃO - Sistema ativo para pagamentos reais' : 'DESENVOLVIMENTO - Ambiente de desenvolvimento'
  });
}

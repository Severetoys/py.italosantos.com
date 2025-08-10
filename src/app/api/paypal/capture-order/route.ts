import { NextRequest, NextResponse } from 'next/server';
import { processPaymentAndCreateSubscription } from '@/services/subscriber-service';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox';

// URLs do PayPal
const PAYPAL_BASE_URL = PAYPAL_ENVIRONMENT === 'production' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, buyerEmail } = await request.json();

    if (!orderId || !buyerEmail) {
      return NextResponse.json({
        success: false,
        error: 'OrderId e buyerEmail são obrigatórios'
      }, { status: 400 });
    }

    // Obter token de acesso
    const accessToken = await getPayPalAccessToken();

    // Capturar pagamento
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await response.json();

    if (response.ok && captureData.status === 'COMPLETED') {
      // Extrair dados do pagamento
      const payment = captureData.purchase_units[0].payments.captures[0];
      const paymentId = payment.id;
      const amount = parseFloat(payment.amount.value);
      const currency = payment.amount.currency_code;

      console.log('PayPal Payment capturado:', {
        orderId,
        paymentId,
        amount,
        currency,
        buyerEmail
      });

      // Criar assinatura usando o serviço existente
      try {
        const subscriberId = await processPaymentAndCreateSubscription(
          buyerEmail,
          paymentId,
          amount,
          currency,
          'paypal',
          'Comprador Teste' // nome padrão para testes
        );

        console.log('Assinatura criada com sucesso:', subscriberId);

        return NextResponse.json({
          success: true,
          message: 'Pagamento capturado e assinatura criada',
          paymentId: paymentId,
          subscriberId: subscriberId,
          orderId: orderId,
          captureData: captureData
        });

      } catch (subscriptionError) {
        console.error('Erro ao criar assinatura:', subscriptionError);
        
        // Pagamento foi capturado, mas assinatura falhou
        return NextResponse.json({
          success: false,
          error: 'Pagamento processado, mas erro ao criar assinatura',
          paymentId: paymentId,
          details: subscriptionError instanceof Error ? subscriptionError.message : String(subscriptionError)
        }, { status: 500 });
      }

    } else {
      console.error('Erro ao capturar PayPal Payment:', captureData);
      return NextResponse.json({
        success: false,
        error: 'Erro ao capturar pagamento PayPal',
        details: captureData
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro na API capture-order:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

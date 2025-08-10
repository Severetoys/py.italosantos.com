import { NextRequest, NextResponse } from 'next/server';

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
    const { amount, currency = 'BRL', description, buyerEmail } = await request.json();

    if (!amount || !buyerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Amount e buyerEmail são obrigatórios'
      }, { status: 400 });
    }

    // Obter token de acesso
    const accessToken = await getPayPalAccessToken();

    // Criar pedido PayPal
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount
        },
        description: description || 'Assinatura VIP - 30 dias'
      }],
      payer: {
        email_address: buyerEmail
      },
      application_context: {
        return_url: `${request.nextUrl.origin}/assinante?payment=success&method=paypal`,
        cancel_url: `${request.nextUrl.origin}/assinante?payment=cancelled&method=paypal`,
        brand_name: 'Studio VIP',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW'
      }
    };

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const order = await response.json();

    if (response.ok) {
      console.log('PayPal Order criado:', order.id);
      return NextResponse.json({
        success: true,
        orderId: order.id,
        order: order
      });
    } else {
      console.error('Erro ao criar PayPal Order:', order);
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar pedido PayPal',
        details: order
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro na API create-order:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

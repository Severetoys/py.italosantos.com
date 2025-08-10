import { NextRequest, NextResponse } from 'next/server';
import { processPaymentAndCreateSubscription } from '@/services/subscriber-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('Webhook PayPal recebido:', body);

        // Verificar se é um evento de pagamento aprovado
        if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
            const payment = body.resource;
            
            // Extrair informações do pagamento
            const paymentId = payment.id;
            const customerEmail = payment.payer?.email_address;
            const customerName = `${payment.payer?.name?.given_name || ''} ${payment.payer?.name?.surname || ''}`.trim();
            const amount = parseFloat(payment.amount?.value || '0');
            const currency = payment.amount?.currency_code || 'USD';

            if (customerEmail && paymentId) {
                try {
                    // Criar assinatura usando o novo sistema
                    const subscriberId = await processPaymentAndCreateSubscription(
                        customerEmail,
                        paymentId,
                        amount,
                        currency,
                        'paypal',
                        customerName
                    );

                    console.log(`[PayPal Webhook] Assinante criado com sucesso: ${subscriberId}`);
                    
                    return NextResponse.json({ 
                        success: true, 
                        message: 'Pagamento PayPal processado e assinante criado',
                        subscriberId
                    });
                } catch (error) {
                    console.error('[PayPal Webhook] Erro ao criar assinante:', error);
                    return NextResponse.json({ 
                        success: false, 
                        message: 'Erro ao processar assinante PayPal' 
                    }, { status: 500 });
                }
            } else {
                console.error('[PayPal Webhook] Dados do pagamento incompletos');
                return NextResponse.json({ 
                    success: false, 
                    message: 'Dados do pagamento incompletos' 
                }, { status: 400 });
            }
        }

        // Para outros tipos de evento, apenas confirmar recebimento
        return NextResponse.json({ success: true, message: 'Webhook PayPal recebido' });

    } catch (error) {
        console.error('[PayPal Webhook] Erro:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { processPaymentAndCreateSubscription } from '@/services/subscriber-service';

export async function POST(request: NextRequest) {
    // Configurar MercadoPago
    const client = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
    try {
        const body = await request.json();
        console.log('Webhook MercadoPago recebido:', body);

        // Verificar se é uma notificação de pagamento
        if (body.type === 'payment') {
            const paymentId = body.data.id;
            
            // Buscar detalhes do pagamento
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: paymentId });

            console.log('Dados do pagamento:', paymentData);

            // Verificar se o pagamento foi aprovado
            if (paymentData.status === 'approved') {
                // Extrair informações do pagamento
                const customerEmail = paymentData.payer?.email;
                const customerName = `${paymentData.payer?.first_name || ''} ${paymentData.payer?.last_name || ''}`.trim();
                const amount = paymentData.transaction_amount || 0;
                const currency = paymentData.currency_id || 'BRL';
                const paymentMethod = paymentData.payment_method_id === 'pix' ? 'pix' : 'mercadopago';

                if (customerEmail) {
                    try {
                        console.log('🎯 Criando assinatura MercadoPago de 30 dias para:', customerEmail);
                        
                        // Criar assinatura usando o novo sistema
                        const subscriptionId = await processPaymentAndCreateSubscription(
                            customerEmail,              // Email do usuário
                            paymentId.toString(),       // ID do pagamento
                            amount,                     // Valor do pagamento
                            currency,                   // Moeda
                            paymentMethod,              // Método de pagamento
                            customerName                // Nome do usuário
                        );

                        console.log('✅ Assinatura MercadoPago criada com sucesso:', subscriptionId);
                        
                        return NextResponse.json({ 
                            success: true, 
                            message: 'Pagamento MercadoPago processado e assinatura criada',
                            subscriptionId: subscriptionId
                        });
                        
                    } catch (subscriptionError) {
                        console.error('❌ Erro ao criar assinatura MercadoPago:', subscriptionError);
                        return NextResponse.json({ 
                            success: false, 
                            message: 'Erro ao criar assinatura MercadoPago' 
                        }, { status: 500 });
                    }
                } else {
                    console.error('Email do cliente não encontrado no pagamento');
                    return NextResponse.json({ 
                        success: false, 
                        message: 'Email do cliente não encontrado' 
                    }, { status: 400 });
                }
            } else {
                console.log('Pagamento não aprovado, status:', paymentData.status);
                return NextResponse.json({ 
                    success: true, 
                    message: 'Pagamento recebido mas não aprovado' 
                });
            }
        }

        // Para outros tipos de notificação, apenas confirmar recebimento
        return NextResponse.json({ success: true, message: 'Webhook recebido' });

    } catch (error) {
        console.error('Erro no webhook MercadoPago:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        }, { status: 500 });
    }
}

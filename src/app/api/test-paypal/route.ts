import { NextRequest, NextResponse } from 'next/server';
import { processPaymentAndCreateSubscription } from '@/services/subscriber-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('🧪 Teste API PayPal recebido:', body);

        const { 
            paymentId, 
            email, 
            name, 
            amount, 
            currency = 'BRL',
            planId = 'test' 
        } = body;

        // Validar dados obrigatórios
        if (!paymentId || !email || !amount) {
            return NextResponse.json({
                success: false,
                message: 'Dados obrigatórios: paymentId, email, amount'
            }, { status: 400 });
        }

        try {
            // Processar pagamento e criar assinatura
            const subscriberId = await processPaymentAndCreateSubscription(
                email,
                paymentId,
                parseFloat(amount),
                currency,
                'paypal',
                name || 'Cliente PayPal',
                planId
            );

            console.log(`[Teste PayPal] Assinante criado: ${subscriberId}`);

            return NextResponse.json({
                success: true,
                message: 'Pagamento processado e assinante criado com sucesso',
                subscriberId,
                data: {
                    email,
                    paymentId,
                    amount,
                    currency,
                    method: 'paypal'
                }
            });

        } catch (error) {
            console.error('[Teste PayPal] Erro ao processar:', error);
            return NextResponse.json({
                success: false,
                message: 'Erro ao processar pagamento: ' + (error instanceof Error ? error.message : String(error))
            }, { status: 500 });
        }

    } catch (error) {
        console.error('[Teste PayPal] Erro na API:', error);
        return NextResponse.json({
            success: false,
            message: 'Erro interno do servidor'
        }, { status: 500 });
    }
}

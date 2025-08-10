import { NextRequest, NextResponse } from 'next/server';
import { processPaymentAndCreateSubscription } from '@/services/subscriber-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const {
            paymentId,
            amount,
            currency,
            paymentMethod,
            customerEmail,
            customerName,
            customerPhone
        } = body;

        // Validações básicas
        if (!paymentId || !amount || !currency || !paymentMethod || !customerEmail) {
            return NextResponse.json(
                { success: false, message: 'Dados do pagamento incompletos' },
                { status: 400 }
            );
        }

        // Processar pagamento e criar assinatura
        const subscriberId = await processPaymentAndCreateSubscription(
            customerEmail,
            paymentId,
            amount,
            currency,
            paymentMethod,
            customerName,
            customerPhone
        );

        console.log(`[Save Subscriber API] Assinante criado com sucesso: ${subscriberId}`);

        return NextResponse.json({
            success: true,
            message: 'Assinante salvo com sucesso',
            subscriberId
        });

    } catch (error) {
        console.error('[Save Subscriber API] Erro ao salvar assinante:', error);
        
        return NextResponse.json(
            { 
                success: false, 
                message: 'Erro interno do servidor',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

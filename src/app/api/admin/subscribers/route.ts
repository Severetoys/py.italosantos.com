import { NextRequest, NextResponse } from 'next/server';
import { getAllActiveSubscribers, cleanupExpiredSubscriptions } from '@/services/subscriber-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'cleanup') {
            // Limpar assinaturas expiradas
            const cleanedCount = await cleanupExpiredSubscriptions();
            return NextResponse.json({
                success: true,
                message: `${cleanedCount} assinaturas expiradas foram desativadas`,
                cleanedCount
            });
        }

        // Buscar todos os assinantes ativos
        const subscribers = await getAllActiveSubscribers();
        
        // Calcular estatísticas
        const stats = {
            totalSubscribers: subscribers.length,
            totalRevenue: subscribers.reduce((sum, sub) => sum + sub.amount, 0),
            paymentMethods: subscribers.reduce((acc, sub) => {
                acc[sub.paymentMethod] = (acc[sub.paymentMethod] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            planTypes: subscribers.reduce((acc, sub) => {
                acc[sub.planType] = (acc[sub.planType] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        };

        return NextResponse.json({
            success: true,
            subscribers: subscribers.map(sub => ({
                id: sub.userId,
                email: sub.email,
                name: sub.name,
                paymentMethod: sub.paymentMethod,
                amount: sub.amount,
                currency: sub.currency,
                planType: sub.planType,
                subscriptionStartDate: sub.subscriptionStartDate,
                subscriptionEndDate: sub.subscriptionEndDate,
                isActive: sub.isActive,
                createdAt: sub.createdAt
            })),
            stats
        });

    } catch (error) {
        console.error('[Admin Subscribers API] Erro:', error);
        
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

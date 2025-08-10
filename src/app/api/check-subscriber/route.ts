import { NextRequest, NextResponse } from 'next/server';
import { getSubscriberByEmail, isActiveSubscriber } from '@/services/subscriber-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        const userId = searchParams.get('userId');

        if (!email && !userId) {
            return NextResponse.json(
                { success: false, message: 'Email ou userId são obrigatórios' },
                { status: 400 }
            );
        }

        let subscriber = null;
        let isActive = false;

        if (email) {
            subscriber = await getSubscriberByEmail(email);
            isActive = subscriber?.isActive || false;
        } else if (userId) {
            isActive = await isActiveSubscriber(userId);
        }

        return NextResponse.json({
            success: true,
            isSubscriber: isActive,
            isVip: isActive,
            subscriber: subscriber ? {
                email: subscriber.email,
                name: subscriber.name,
                planType: subscriber.planType,
                subscriptionEndDate: subscriber.subscriptionEndDate,
                paymentMethod: subscriber.paymentMethod
            } : null
        });

    } catch (error) {
        console.error('[Check Subscriber API] Erro:', error);
        
        return NextResponse.json(
            { 
                success: false, 
                message: 'Erro interno do servidor',
                isSubscriber: false,
                isVip: false
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, userId } = body;

        if (!email && !userId) {
            return NextResponse.json(
                { success: false, message: 'Email ou userId são obrigatórios' },
                { status: 400 }
            );
        }

        let subscriber = null;
        let isActive = false;

        if (email) {
            subscriber = await getSubscriberByEmail(email);
            isActive = subscriber?.isActive || false;
        } else if (userId) {
            isActive = await isActiveSubscriber(userId);
        }

        return NextResponse.json({
            success: true,
            isSubscriber: isActive,
            isVip: isActive,
            subscriber: subscriber ? {
                email: subscriber.email,
                name: subscriber.name,
                planType: subscriber.planType,
                subscriptionEndDate: subscriber.subscriptionEndDate,
                paymentMethod: subscriber.paymentMethod,
                subscriptionStartDate: subscriber.subscriptionStartDate
            } : null
        });

    } catch (error) {
        console.error('[Check Subscriber API] Erro:', error);
        
        return NextResponse.json(
            { 
                success: false, 
                message: 'Erro interno do servidor',
                isSubscriber: false,
                isVip: false
            },
            { status: 500 }
        );
    }
}

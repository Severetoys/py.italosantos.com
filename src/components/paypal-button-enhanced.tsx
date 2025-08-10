"use client";

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { Shield, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PayPalButtonProps {
    onPaymentSuccess: (paymentData?: any) => void;
    amount?: string;
    currency?: string;
    description?: string;
    className?: string;
    variant?: 'default' | 'premium' | 'compact';
}

const PayPalButtonWrapper = ({ 
    onPaymentSuccess, 
    amount = "10.00", 
    currency = "BRL", 
    description = "Pagamento",
    variant = "default"
}: PayPalButtonProps) => {
    const { toast } = useToast();

    return (
        <div className="space-y-2">
            <PayPalButtons
                style={{
                    layout: "vertical",
                    color: "blue",
                    shape: "rect",
                    label: "paypal",
                    height: variant === "compact" ? 40 : 55,
                    tagline: variant === "premium",
                }}
                createOrder={(data, actions) => {
                    return actions.order.create({
                        purchase_units: [
                            {
                                amount: {
                                    value: amount,
                                    currency_code: currency,
                                },
                                description: description,
                            },
                        ],
                        intent: "CAPTURE",
                    });
                }}
                onApprove={async (data, actions) => {
                    try {
                        const details = await actions.order?.capture();
                        console.log("PayPal payment completed:", details);
                        
                        // Salvar pagamento no sistema de assinantes
                        try {
                            const saveResponse = await fetch('/api/test-paypal', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    paymentId: details?.id,
                                    email: details?.payer?.email_address,
                                    name: `${details?.payer?.name?.given_name || ''} ${details?.payer?.name?.surname || ''}`.trim(),
                                    amount: details?.purchase_units?.[0]?.amount?.value,
                                    currency: details?.purchase_units?.[0]?.amount?.currency_code,
                                    planId: 'paypal-subscription'
                                }),
                            });

                            const saveData = await saveResponse.json();
                            
                            if (saveData.success) {
                                console.log('✅ Pagamento salvo no sistema:', saveData.subscriberId);
                                
                                toast({
                                    title: "✅ Pagamento PayPal Concluído!",
                                    description: `Assinatura ativada! ID: ${saveData.subscriberId.slice(0, 8)}...`,
                                    duration: 6000,
                                });
                            } else {
                                console.error('❌ Erro ao salvar pagamento:', saveData.message);
                                toast({
                                    title: "⚠️ Pagamento Aprovado",
                                    description: `ID: ${details?.id}. Contate o suporte se necessário.`,
                                    duration: 8000,
                                });
                            }
                        } catch (saveError) {
                            console.error('Erro ao salvar pagamento:', saveError);
                            toast({
                                title: "✅ Pagamento PayPal Concluído!",
                                description: `Transação ID: ${details?.id || 'N/A'}`,
                                duration: 6000,
                            });
                        }
                        
                        // Chamar onPaymentSuccess com os detalhes do pagamento
                        onPaymentSuccess({
                            id: details?.id,
                            method: 'paypal',
                            email: details?.payer?.email_address,
                            name: `${details?.payer?.name?.given_name || ''} ${details?.payer?.name?.surname || ''}`.trim(),
                            amount: details?.purchase_units?.[0]?.amount?.value,
                            currency: details?.purchase_units?.[0]?.amount?.currency_code
                        });
                    } catch (error) {
                        console.error("Erro ao capturar pagamento:", error);
                        toast({
                            title: "❌ Falha no Pagamento",
                            description: "Tente novamente ou use outro método de pagamento.",
                            variant: "destructive",
                            duration: 6000,
                        });
                    }
                }}
                onError={(error) => {
                    console.error("Erro PayPal:", error);
                    toast({
                        title: "❌ Erro do PayPal",
                        description: "Problema na conexão. Tente novamente.",
                        variant: "destructive",
                        duration: 6000,
                    });
                }}
                onCancel={() => {
                    toast({
                        title: "⚠️ Pagamento Cancelado",
                        description: "Você cancelou o pagamento PayPal.",
                        duration: 3000,
                    });
                }}
            />
            
            {variant === "premium" && (
                <div className="flex items-center justify-center text-xs text-gray-500 space-x-4 mt-2">
                    <div className="flex items-center">
                        <Shield className="h-3 w-3 mr-1" />
                        Proteção do Comprador
                    </div>
                    <div className="flex items-center">
                        <CreditCard className="h-3 w-3 mr-1" />
                        Cartão não obrigatório
                    </div>
                </div>
            )}
        </div>
    );
};

const PayPalButton = ({ 
    onPaymentSuccess, 
    amount = "10.00", 
    currency = "BRL", 
    description = "Pagamento",
    className,
    variant = "default"
}: PayPalButtonProps) => {
    const paypalOptions = {
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        currency: currency,
        intent: "capture",
        components: "buttons",
        "disable-funding": "venmo,card",
        locale: "pt_BR",
        "data-sdk-integration-source": "button-factory",
        "enable-funding": "paypal",
        vault: false,
    };

    return (
        <div className={cn("w-full", className)}>
            <PayPalScriptProvider options={paypalOptions}>
                <PayPalButtonWrapper
                    onPaymentSuccess={onPaymentSuccess}
                    amount={amount}
                    currency={currency}
                    description={description}
                    variant={variant}
                />
            </PayPalScriptProvider>
        </div>
    );
};

export default PayPalButton;
export type { PayPalButtonProps };

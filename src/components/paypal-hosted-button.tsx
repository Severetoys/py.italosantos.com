"use client";

import { forwardRef, useImperativeHandle, useState } from 'react';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PayPalHostedButtonProps {
    onPaymentSuccess: () => void;
    amount?: string;
    currency?: string;
    description?: string;
    className?: string;
}

interface PayPalHostedButtonRef {
    triggerPayment: () => void;
}

const PayPalButtonWrapper = ({ 
    onPaymentSuccess, 
    amount = "10.00", 
    currency = "BRL", 
    description = "Pagamento" 
}: PayPalHostedButtonProps) => {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();
    const { toast } = useToast();

    if (isPending) {
        return (
            <div className="flex items-center justify-center p-4 min-h-[50px]">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="ml-2 text-blue-600">Carregando PayPal...</span>
            </div>
        );
    }

    if (isRejected) {
        return (
            <div className="flex items-center justify-center p-4 min-h-[50px] text-red-500">
                ⚠️ Erro ao carregar PayPal
            </div>
        );
    }

    return (
        <PayPalButtons
            style={{
                layout: "vertical",
                color: "blue",
                shape: "rect",
                label: "paypal",
                height: 50,
                tagline: false,
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
                    
                    toast({
                        title: "✅ Pagamento PayPal Aprovado!",
                        description: `Transação: ${details?.id}`,
                        duration: 5000,
                    });
                    
                    onPaymentSuccess();
                } catch (error) {
                    console.error("Erro ao capturar pagamento:", error);
                    toast({
                        variant: "destructive",
                        title: "❌ Erro no Pagamento",
                        description: "Não foi possível processar o pagamento.",
                    });
                }
            }}
            onError={(err) => {
                console.error("PayPal error:", err);
                toast({
                    variant: "destructive",
                    title: "❌ Erro do PayPal",
                    description: "Ocorreu um erro durante o processamento.",
                });
            }}
            onCancel={() => {
                toast({
                    title: "⚠️ Pagamento Cancelado",
                    description: "O pagamento foi cancelado pelo usuário.",
                });
            }}
        />
    );
};

const PayPalHostedButton = forwardRef<PayPalHostedButtonRef, PayPalHostedButtonProps>(({ 
    onPaymentSuccess, 
    amount = "10.00", 
    currency = "BRL", 
    description = "Pagamento",
    className 
}, ref) => {
    const [showPayPal, setShowPayPal] = useState(false);
    
    useImperativeHandle(ref, () => ({
        triggerPayment: () => {
            setShowPayPal(true);
        }
    }));

    const paypalOptions = {
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        currency: currency,
        intent: "capture",
        components: "buttons",
    };

    if (!showPayPal) {
        return (
            <Button
                onClick={() => setShowPayPal(true)}
                className={cn("w-full bg-[#0070ba] hover:bg-[#005ea6] text-white", className)}
            >
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar com PayPal
            </Button>
        );
    }

    return (
        <div className={cn("w-full", className)}>
            <PayPalScriptProvider options={paypalOptions}>
                <PayPalButtonWrapper
                    onPaymentSuccess={onPaymentSuccess}
                    amount={amount}
                    currency={currency}
                    description={description}
                />
            </PayPalScriptProvider>
        </div>
    );
});

PayPalHostedButton.displayName = "PayPalHostedButton";

export default PayPalHostedButton;
export type { PayPalHostedButtonProps, PayPalHostedButtonRef };

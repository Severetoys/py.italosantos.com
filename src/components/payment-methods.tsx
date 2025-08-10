'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, QrCode, Wallet, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PaymentButtons from '@/components/payment-buttons';
import PixPaymentModal from '@/components/pix-payment-modal';
import PayPalHostedButton from '@/components/paypal-hosted-button';
import GooglePayButton from '@/components/google-pay-button';

interface PaymentMethodsProps {
  selectedPlan: {
    id: string;
    name: string;
    price: number;
    duration: number;
    features: string[];
    popular?: boolean;
    currency?: string;
    symbol?: string;
  };
  onPaymentSuccess: () => void;
  isBrazil?: boolean;
  originalPriceBRL?: number;
}

export default function PaymentMethods({ selectedPlan, onPaymentSuccess, isBrazil = true, originalPriceBRL = 99.00 }: PaymentMethodsProps) {
  const { toast } = useToast();
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('mercadopago');
  const [isProcessing, setIsProcessing] = useState(false);

  // Garantir que o método selecionado seja válido para o país
  useEffect(() => {
    if (!isBrazil && selectedMethod === 'pix') {
      setSelectedMethod('mercadopago');
    }
  }, [isBrazil, selectedMethod]);

  // Filtrar métodos de pagamento baseado no país
  const paymentMethods = [
    {
      id: 'mercadopago',
      name: 'Cartão de Crédito/Débito',
      description: 'Visa, Mastercard, Elo via MercadoPago',
      icon: <CreditCard className="h-6 w-6" />,
      color: 'bg-blue-500',
      popular: true
    },
    // PIX só disponível para o Brasil
    ...(isBrazil ? [{
      id: 'pix',
      name: 'PIX',
      description: 'Pagamento instantâneo - Aprovação imediata',
      icon: <QrCode className="h-6 w-6" />,
      color: 'bg-green-500',
      instant: true
    }] : []),
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pagamento internacional seguro',
      icon: <Wallet className="h-6 w-6" />,
      color: 'bg-blue-600'
    },
    {
      id: 'googlepay',
      name: 'Google Pay',
      description: 'Pagamento rápido e seguro com Google',
      icon: <Smartphone className="h-6 w-6" />,
      color: 'bg-gray-900',
      instant: true
    }
  ];

  const handlePixPayment = () => {
    // PIX sempre usa o valor original em BRL para evitar discrepâncias
    setIsPixModalOpen(true);
  };

  const handlePayPalSuccess = () => {
    toast({
      title: '✅ Pagamento PayPal Aprovado!',
      description: 'Sua assinatura foi ativada com sucesso.',
    });
    onPaymentSuccess();
  };

  const handleGooglePaySuccess = () => {
    toast({
      title: '✅ Pagamento Google Pay Aprovado!',
      description: 'Sua assinatura foi ativada com sucesso.',
    });
    onPaymentSuccess();
  };

  const handleMercadoPagoPayment = async () => {
    setIsProcessing(true);
    try {
      // Criar preferência do MercadoPago
      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: selectedPlan.price,
          currency: selectedPlan.currency || 'BRL',
          description: `Assinatura ${selectedPlan.name}`,
          planId: selectedPlan.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.preferenceId) {
          // Redirecionar para checkout do MercadoPago
          window.open(`https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${data.preferenceId}`, '_blank');
          
          toast({
            title: 'Redirecionando...',
            description: 'Complete o pagamento na janela do MercadoPago.',
          });
        }
      } else {
        throw new Error('Falha ao criar preferência de pagamento');
      }
    } catch (error) {
      console.error('Erro no pagamento MercadoPago:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no Pagamento',
        description: 'Não foi possível processar o pagamento. Tente novamente.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPaymentButton = () => {
    const currencySymbol = selectedPlan.symbol || 'R$';
    
    switch (selectedMethod) {
      case 'pix':
        return (
          <Button 
            onClick={handlePixPayment}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <QrCode className="mr-2 h-5 w-5" />
            Pagar com PIX - R$ {originalPriceBRL.toFixed(2)}
          </Button>
        );

      case 'paypal':
        return (
          <div className="w-full">
            <PayPalHostedButton
              amount={selectedPlan.price.toString()}
              currency={selectedPlan.currency || "BRL"}
              onPaymentSuccess={handlePayPalSuccess}
              description={`Assinatura ${selectedPlan.name}`}
            />
          </div>
        );

      case 'googlepay':
        return (
          <div className="w-full">
            <GooglePayButton
              amount={selectedPlan.price}
              currency={selectedPlan.currency || "BRL"}
              onSuccess={handleGooglePaySuccess}
              className="h-12"
            />
          </div>
        );

      case 'mercadopago':
      default:
        return (
          <Button 
            onClick={handleMercadoPagoPayment}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-5 w-5" />
            )}
            {isProcessing ? 'Processando...' : `Pagar com Cartão - ${currencySymbol} ${selectedPlan.price.toFixed(2)}`}
          </Button>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumo do Plano */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-center">
            Resumo do Pedido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Plano selecionado:</span>
            <span className="font-semibold">{selectedPlan.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Duração:</span>
            <span>{selectedPlan.duration} dia{selectedPlan.duration > 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span className="text-primary">
              {selectedPlan.currency && selectedPlan.currency !== 'BRL' ? 
                `${selectedPlan.symbol || 'R$'} ${selectedPlan.price.toFixed(2)}` :
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(selectedPlan.price)
              }
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Informação sobre PIX para usuários internacionais */}
      {!isBrazil && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              PIX disponível apenas para clientes no Brasil
            </span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Para pagamentos internacionais, utilize cartão de crédito ou PayPal.
          </p>
        </div>
      )}

      {/* Seleção do Método de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Escolha o método de pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedMethod === method.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full text-white ${method.color}`}>
                      {method.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{method.name}</h3>
                        {method.popular && (
                          <Badge className="bg-amber-600 hover:bg-amber-700">
                            Popular
                          </Badge>
                        )}
                        {method.instant && (
                          <Badge className="bg-green-600 hover:bg-green-700">
                            Instantâneo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                  </div>
                  {selectedMethod === method.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Botão de Pagamento */}
      <Card>
        <CardContent className="pt-6">
          {renderPaymentButton()}
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>🔒 Pagamento 100% seguro e criptografado</p>
            <p>✅ Ativação automática após confirmação</p>
          </div>
        </CardContent>
      </Card>

      {/* Garantias */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-green-100 rounded-full">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-sm">
                <p className="font-semibold">Acesso Imediato</p>
                <p className="text-muted-foreground">Liberado após pagamento</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-sm">
                <p className="font-semibold">Pagamento Seguro</p>
                <p className="text-muted-foreground">Dados protegidos</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-full">
                <Smartphone className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-sm">
                <p className="font-semibold">Suporte 24/7</p>
                <p className="text-muted-foreground">Ajuda quando precisar</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal PIX */}
      <PixPaymentModal
        isOpen={isPixModalOpen}
        onOpenChange={setIsPixModalOpen}
        amount={originalPriceBRL}
        onPaymentSuccess={onPaymentSuccess}
      />
    </div>
  );
}

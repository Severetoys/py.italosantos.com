'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Crown, CheckCircle, Star, Shield, Zap, Download, Loader2, X } from 'lucide-react';
import PaymentMethods from '@/components/payment-methods';
import { useProfileConfig } from '@/hooks/use-profile-config';
import { convertCurrency } from '@/ai/flows/currency-conversion-flow';
import Image from 'next/image';
import FaceIDProtectedRoute from '@/components/face-id-protected-route';
import { useFaceIDAuth } from '@/contexts/face-id-auth-context';
import SubscriptionActivation from '@/components/subscription-activation';

function AssinantePageContent() {
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [paymentInfo, setPaymentInfo] = useState({ value: '99.00', currency: 'BRL', symbol: 'R$' });
  const [isLoadingCurrency, setIsLoadingCurrency] = useState(true);
  const [isBrazil, setIsBrazil] = useState(true);
  const [paymentFeedback, setPaymentFeedback] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const { coverPhoto } = useProfileConfig();
  const { userType, userEmail } = useFaceIDAuth();
  const searchParams = useSearchParams();

  // Cria o plano de assinatura com valores internacionalizados
  const getSubscriptionPlan = () => ({
    id: 'default',
    name: 'Assinatura Premium',
    price: parseFloat(paymentInfo.value),
    duration: 30,
    currency: paymentInfo.currency,
    symbol: paymentInfo.symbol,
    features: [
      'Acesso total ao conteúdo exclusivo',
      'Downloads ilimitados',
      'Suporte dedicado',
      'Conteúdo em alta definição',
      'Liberação instantânea após pagamento'
    ]
  });  useEffect(() => {
    checkSubscriptionStatus();
    fetchCurrency();
  }, []);

  // Trata os parâmetros de retorno do PayPal
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const token = searchParams.get('token');
    const PayerID = searchParams.get('PayerID');
    
    if (paymentStatus === 'success' && token && PayerID) {
      setPaymentFeedback({
        type: 'success',
        message: 'Pagamento realizado com sucesso! Sua assinatura será ativada em instantes.'
      });
      
      // Recarrega o status da assinatura após sucesso do pagamento
      setTimeout(() => {
        checkSubscriptionStatus();
      }, 2000);
      
    } else if (paymentStatus === 'cancelled') {
      setPaymentFeedback({
        type: 'error',
        message: 'Pagamento cancelado. Você pode tentar novamente quando quiser.'
      });
    }
  }, [searchParams]);

  const fetchCurrency = async () => {
    setIsLoadingCurrency(true);
    
    // Define valores padrão baseados no locale
    const userLocale = navigator.language || 'pt-BR';
    setIsBrazil(userLocale.toLowerCase().includes('pt'));

    console.log('Fetching currency for locale:', userLocale);
    
    try {
      // Timeout para a conversão de moeda (máximo 10 segundos)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );
      
      const conversionPromise = convertCurrency({ targetLocale: userLocale });
      
      const result = await Promise.race([conversionPromise, timeoutPromise]) as any;

      console.log('Currency conversion result:', result);

      if (result && result.amount && result.currencyCode) {
        setPaymentInfo({
          value: result.amount.toFixed(2),
          currency: result.currencyCode,
          symbol: result.currencySymbol
        });
        console.log('Updated payment info:', {
          value: result.amount.toFixed(2),
          currency: result.currencyCode,
          symbol: result.currencySymbol
        });
      } else {
        console.log('Using default BRL values - invalid conversion result');
      }
    } catch (error) {
      console.error("Failed to fetch currency or timeout:", error);
      // Mantém o valor padrão em BRL em caso de erro
      console.log('Using default BRL values due to error');
    } finally {
      setIsLoadingCurrency(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      
      // Verifica se o usuário está logado via Face ID
      if (!userEmail) {
        setLoading(false);
        return;
      }

      // Verifica status do pagamento na API do Firebase
      const response = await fetch('/api/face-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'checkPayment',
          customerEmail: userEmail
        })
      });

      const result = await response.json();
      
      if (result.success && result.isSubscriber) {
        setIsSubscriber(true);
        setSubscriptionData({
          type: result.subscriptionType,
          isActive: true
        });
        
        // Salva no localStorage para cache
        localStorage.setItem('userSubscription', JSON.stringify({
          type: result.subscriptionType,
          isActive: true
        }));
        localStorage.setItem('hasSubscription', 'true');
      } else {
        // Remove dados antigos do cache se não é mais assinante
        localStorage.removeItem('userSubscription');
        localStorage.removeItem('hasSubscription');
        localStorage.removeItem('hasPaid');
      }
    } catch (error) {
      console.error('Erro ao verificar status da assinatura:', error);
      
      // Fallback para localStorage em caso de erro de rede
      const subscription = localStorage.getItem('userSubscription');
      const hasPaid = localStorage.getItem('hasPaid');
      const hasSubscription = localStorage.getItem('hasSubscription');
      
      if (subscription || hasPaid === 'true' || hasSubscription === 'true') {
        setIsSubscriber(true);
        if (subscription) {
          const subData = JSON.parse(subscription);
          setSubscriptionData(subData);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || isLoadingCurrency) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2 text-foreground text-xl">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  const SUBSCRIPTION_PLAN = getSubscriptionPlan();

  return (
    <>
      {/* Hero Section com imagem de capa */}
      <div className="relative w-full h-[40vh] flex items-center justify-center">
        <Image
          src={coverPhoto || "https://placehold.co/1200x400.png"}
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="opacity-80"
        />
        <div 
          className="relative border-4 border-red-500 p-4 bg-black/50"
          style={{ boxShadow: '0 0 15px 5px rgba(255, 0, 0, 0.5)' }}
        >
          <h1 
            className="text-6xl md:text-7xl font-bold text-white text-center"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            {isSubscriber ? 'Bem-vindo(a) Assinante!' : 'Área Premium'}
          </h1>
        </div>
      </div>

      {/* Content Section */}
      <main className="flex-grow flex flex-col items-center w-full py-12">
        <div className="w-full max-w-4xl mx-auto px-4">
          
          {/* Payment Feedback */}
          {paymentFeedback.type && (
            <div className={`mb-8 p-4 rounded-lg border-2 ${
              paymentFeedback.type === 'success' 
                ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {paymentFeedback.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <X className="h-5 w-5 mr-2" />
                  )}
                  <span className="font-medium">{paymentFeedback.message}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaymentFeedback({ type: null, message: '' })}
                  className="p-1 h-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {isSubscriber ? (
            // Subscriber Dashboard
            <div className="text-center space-y-8">
              <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-border">
                <div className="flex items-center justify-center mb-6">
                  <Crown className="h-12 w-12 text-yellow-500 mr-3" />
                  <h2 className="text-4xl font-bold text-foreground">Status Premium</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                      <span className="text-lg font-semibold text-green-500">Status: Ativo</span>
                    </div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="text-center">
                      <span className="text-lg font-semibold text-blue-500">Próximo pagamento:</span>
                      <p className="text-muted-foreground">{subscriptionData?.nextPayment || 'Em 30 dias'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-foreground mb-4">Seus Benefícios</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {SUBSCRIPTION_PLAN.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-foreground bg-muted/50 rounded-lg p-3">
                        <Star className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Subscription Plans
            <div className="text-center space-y-12">
              {/* Subscription Card */}
              <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border-2 border-red-500 relative overflow-hidden">
                {/* Premium Badge */}
                <div className="absolute top-4 right-4">
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                    <Crown className="h-4 w-4 mr-1" />
                    PREMIUM
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-4xl font-bold text-foreground mb-4">Assinatura Premium</h2>
                  <div className="text-6xl font-bold text-red-500 mb-2">
                    {SUBSCRIPTION_PLAN.symbol} {SUBSCRIPTION_PLAN.price.toFixed(2)}
                  </div>
                  <p className="text-muted-foreground text-lg">Por {SUBSCRIPTION_PLAN.duration} dias</p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center text-foreground">
                    <Shield className="h-5 w-5 text-green-500 mr-3" />
                    <span>Acesso total ao conteúdo exclusivo</span>
                  </div>
                  <div className="flex items-center text-foreground">
                    <Download className="h-5 w-5 text-blue-500 mr-3" />
                    <span>Downloads ilimitados</span>
                  </div>
                  <div className="flex items-center text-foreground">
                    <Star className="h-5 w-5 text-yellow-500 mr-3" />
                    <span>Suporte dedicado</span>
                  </div>
                  <div className="flex items-center text-foreground">
                    <Zap className="h-5 w-5 text-purple-500 mr-3" />
                    <span>Conteúdo em alta definição</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <PaymentMethods 
                  selectedPlan={SUBSCRIPTION_PLAN}
                  isBrazil={isBrazil}
                  originalPriceBRL={99.00}
                  onPaymentSuccess={() => {
                    localStorage.setItem('hasSubscription', 'true');
                    localStorage.setItem('hasPaid', 'true');
                    localStorage.setItem('userSubscription', JSON.stringify({
                      planName: SUBSCRIPTION_PLAN.name,
                      nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
                    }));
                    checkSubscriptionStatus();
                  }}
                />

                {/* Subscription Activation */}
                <div className="mt-8">
                  <h3 className="text-2xl font-bold text-center mb-6">Já efetuou o pagamento?</h3>
                  <SubscriptionActivation 
                    onActivationSuccess={() => {
                      checkSubscriptionStatus();
                    }}
                  />
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-muted/50 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-green-500 mr-3" />
                  Pagamento 100% Seguro
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-foreground">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🔒</div>
                    <h4 className="font-semibold mb-2">Criptografia SSL</h4>
                    <p className="text-sm text-muted-foreground">Seus dados são protegidos com a mais alta segurança</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl mb-2">💳</div>
                    <h4 className="font-semibold mb-2">Múltiplas Formas de Pagamento</h4>
                    <p className="text-sm text-muted-foreground">PayPal, PIX, Cartão de Crédito e mais</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl mb-2">⚡</div>
                    <h4 className="font-semibold mb-2">Liberação Instantânea</h4>
                    <p className="text-sm text-muted-foreground">Acesso imediato após confirmação do pagamento</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function AssinantePage() {
  return (
    <FaceIDProtectedRoute>
      <AssinantePageContent />
    </FaceIDProtectedRoute>
  );
}

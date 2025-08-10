"use client";

import { Button } from '@/components/ui/button';
import { Fingerprint, KeyRound, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import FeatureMarquee from '@/components/feature-marquee';
import Image from 'next/image';
import AboutSection from '@/components/about-section';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { convertCurrency } from '@/ai/flows/currency-conversion-flow';
import PixPaymentModal from '@/components/pix-payment-modal';
import GPayPaymentModal from '@/components/gpay-payment-modal';
import ApplePayPaymentModal from '@/components/applepay-payment-modal';
import Link from 'next/link';
import PayPalButton from '@/components/paypal-button-enhanced';
import AccessTypeModal from '@/components/access-type-modal';
import { useProfileConfig } from '@/hooks/use-profile-config';

export default function Home() {
    const { toast } = useToast();
    const router = useRouter();
    const { coverPhoto } = useProfileConfig();
    
    const [paymentInfo, setPaymentInfo] = useState({ value: '99.00', currency: 'BRL', symbol: 'R$' });
    const [isLoadingCurrency, setIsLoadingCurrency] = useState(true);
    const [isPixModalOpen, setIsPixModalOpen] = useState(false);
    const [isGPayModalOpen, setIsGPayModalOpen] = useState(false);
    const [isApplePayModalOpen, setIsApplePayModalOpen] = useState(false);
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
    const [isBrazil, setIsBrazil] = useState(true);
    // Novo estado para controlar qual método está sendo simulado
    const [simulatedMethod, setSimulatedMethod] = useState<'pix' | null>(null);

    useEffect(() => {
        const fetchCurrency = async () => {
            setIsLoadingCurrency(true);
            try {
                const userLocale = navigator.language || 'pt-BR';
                setIsBrazil(userLocale.toLowerCase().includes('pt'));

                const result = await convertCurrency({ targetLocale: userLocale });

                if (result.amount && result.currencyCode) {
                    setPaymentInfo({
                        value: result.amount.toFixed(2),
                        currency: result.currencyCode,
                        symbol: result.currencySymbol
                    });
                }
            } catch (error) {
                console.error("Failed to fetch currency", error);
                // Mantém o valor padrão em BRL em caso de erro
            } finally {
                setIsLoadingCurrency(false);
            }
        };
        fetchCurrency();
    }, []);

    const handlePaymentSuccess = useCallback(async (paymentDetails?: any) => {
        toast({ title: 'Pagamento bem-sucedido!', description: 'Seja bem-vindo(a) ao conteúdo exclusivo!' });
        
        // Salvar localmente para compatibilidade
        localStorage.setItem('hasPaid', 'true');
        localStorage.setItem('hasSubscription', 'true');
        localStorage.setItem('userType', 'vip');
        localStorage.setItem('subscriptionDate', new Date().toISOString());
        
        // Se tiver detalhes do pagamento, salvar no Firebase
        if (paymentDetails) {
            try {
                const response = await fetch('/api/save-subscriber', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        paymentId: paymentDetails.id || `payment_${Date.now()}`,
                        amount: parseFloat(paymentInfo.value),
                        currency: paymentInfo.currency,
                        paymentMethod: paymentDetails.method || 'unknown',
                        customerEmail: paymentDetails.email || 'unknown@example.com',
                        customerName: paymentDetails.name
                    }),
                });
                
                if (response.ok) {
                    console.log('Assinante salvo com sucesso no Firebase');
                } else {
                    console.log('Erro ao salvar assinante, mas pagamento foi processado');
                }
            } catch (error) {
                console.error('Erro ao salvar assinante:', error);
                // Não bloquear o fluxo se der erro ao salvar
            }
        }
        
        router.push('/assinante');
    }, [router, toast, paymentInfo]);

    // Função para abrir o modal simulando o método
    const openPaymentModal = (method: 'pix') => {
        setSimulatedMethod(method);
        setIsPixModalOpen(true);
    };

    // Ajusta os handlers dos botões
    const handleGooglePayClick = useCallback(() => {
        setIsGPayModalOpen(true);
    }, []);

    const handleApplePayClick = useCallback(() => {
        setIsApplePayModalOpen(true);
    }, []);
    

    return (
        <>
            <div 
                className="relative w-full h-[50vh] flex items-center justify-center"
            >
                <Image
                    src={coverPhoto || "https://placehold.co/1200x400.png"}
                    alt="Background"
                    layout="fill"
                    objectFit="cover"
                    className="opacity-80"
                    data-ai-hint="male model"
                />
                {/* Overlay escuro para aumentar contraste do nome */}
                <div className="absolute inset-0 bg-black/60 z-10" />
                <h1 
                    className="text-8xl md:text-9xl font-bold text-white shadow-neon-white z-20"
                    style={{ fontFamily: '"Times New Roman", Times, serif', WebkitTextStroke: '2px #222', textShadow: '0 0 16px #fff, 0 0 32px #fff8' }}
                >
                    Italo Santos
                </h1>
            </div>

            <main className="flex-grow flex flex-col items-center w-full">
                <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-4xl mx-auto">
                    
                    <div className="w-full max-w-xs flex flex-col items-center gap-y-4 pt-14">
                         <Button asChild className="w-full h-14 text-lg bg-white hover:bg-gray-200 text-black flex items-center justify-center transform scale-125">
                            <Link href="/auth/face">
                                <Fingerprint className="mr-2 h-6 w-6" />
                                Face ID
                            </Link>
                        </Button>

                         <div className="flex items-center justify-center w-full max-w-sm mt-6 gap-x-4">
                            <button 
                                className="flex-1 cursor-pointer bg-transparent border-none p-0 transition-transform hover:scale-105"
                                onClick={handleGooglePayClick}
                                aria-label="Pagar com Google Pay"
                            >
                                <Image
                                    src="/google-pay.png"
                                    alt="Google Pay"
                                    width={242} 
                                    height={98}
                                    className="w-full h-auto object-contain"
                                />
                            </button>
                             <div className="flex flex-col items-center justify-center px-1 w-[70px]">
                                <button
                                    className="w-full transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center"
                                    onClick={() => openPaymentModal('pix')}
                                    aria-label="Pagar com PIX"
                                    disabled={!isBrazil || isLoadingCurrency}
                                >
                                    <Image
                                        src="/pix.png"
                                        alt="PIX"
                                        width={55}
                                        height={98}
                                        className="w-full h-auto object-contain"
                                    />
                                    <span className="text-[10px] text-muted-foreground mt-1 text-nowrap">PIX Brasil</span>
                                </button>
                            </div>
                            <button 
                                className="flex-1 cursor-pointer bg-transparent border-none p-0 transition-transform hover:scale-105"
                                onClick={handleApplePayClick}
                                aria-label="Pagar com Apple Pay"
                            >
                               <Image
                                    src="/apple-pay.png"
                                    alt="Apple Pay"
                                    width={242}
                                    height={98}
                                    className="w-full h-auto object-contain"
                                />
                            </button>
                        </div>

                        <div className="text-center py-4 min-h-[100px] flex flex-col items-center justify-center">
                            <p className="text-lg">Assinatura Mensal</p>
                             {isLoadingCurrency ? (
                                 <Loader2 className="h-10 w-10 mx-auto animate-spin text-white" />
                             ) : (
                                <p className="text-7xl font-bold text-white">
                                    {paymentInfo.value.split('.')[0]}
                                    <span className="text-4xl align-top">.{paymentInfo.value.split('.')[1]}</span>
                                    <span className="text-2xl font-normal align-top ml-1">{paymentInfo.symbol}</span>
                                </p>
                             )}
                            <div className="w-full h-14 mt-4">
                                <PayPalButton
                                    onPaymentSuccess={handlePaymentSuccess}
                                    amount={paymentInfo.value}
                                    currency={paymentInfo.currency}
                                    description="Assinatura Mensal Premium"
                                    variant="default"
                                    className="w-full"
                                />
                            </div>
                        </div>
                        
                        {/* Selo de Segurança */}
                        <div className="flex items-center justify-center gap-x-3 py-4 px-6 bg-gray-900 border border-gray-700 rounded-lg shadow-sm">
                            <img src="/shield.svg" alt="Escudo de segurança" className="h-14 w-14" />
                            <div className="text-center">
                                <p className="text-sm font-semibold text-white">100% Seguro & Protegido</p>
                                <p className="text-xs text-gray-400">SSL Certificado • Dados Criptografados</p>
                            </div>
                        </div>
                        
                         <Button 
                            className="w-full h-14 text-xl bg-white hover:bg-gray-200 text-black flex items-center justify-center"
                            onClick={() => setIsAccessModalOpen(true)}
                         >
                            <KeyRound className="mr-2 h-6 w-6" />
                            ENTRAR
                        </Button>
                    </div>
                </div>
            
                <FeatureMarquee />
                <AboutSection />
            </main>

            <PixPaymentModal 
                isOpen={isPixModalOpen}
                onOpenChange={setIsPixModalOpen}
                amount={parseFloat(paymentInfo.value)}
                onPaymentSuccess={handlePaymentSuccess}
                paymentMethod={simulatedMethod || 'pix'}
            />
            <GPayPaymentModal
                isOpen={isGPayModalOpen}
                onOpenChange={setIsGPayModalOpen}
                amount={parseFloat(paymentInfo.value)}
                currency={paymentInfo.currency}
                symbol={paymentInfo.symbol}
                onPaymentSuccess={handlePaymentSuccess}
            />
            <ApplePayPaymentModal
                isOpen={isApplePayModalOpen}
                onOpenChange={setIsApplePayModalOpen}
                amount={parseFloat(paymentInfo.value)}
                currency={paymentInfo.currency}
                symbol={paymentInfo.symbol}
                onPaymentSuccess={handlePaymentSuccess}
            />

            <AccessTypeModal 
                isOpen={isAccessModalOpen}
                onOpenChange={setIsAccessModalOpen}
            />
        </>
    );

}

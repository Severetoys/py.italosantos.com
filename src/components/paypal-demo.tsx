"use client";

import { useState } from 'react';
import PayPalButton from './paypal-button-enhanced';
import PayPalHostedButton from './paypal-hosted-button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

export default function PayPalDemo() {
    const { toast } = useToast();
    const [selectedVariant, setSelectedVariant] = useState<'default' | 'premium' | 'compact'>('default');

    const handlePaymentSuccess = () => {
        toast({
            title: "🎉 Pagamento Realizado!",
            description: "PayPal funcionando perfeitamente!",
            duration: 5000,
        });
    };

    const variants = [
        { key: 'default', label: 'Padrão', description: 'Botão padrão com animações' },
        { key: 'premium', label: 'Premium', description: 'Layout premium com card' },
        { key: 'compact', label: 'Compacto', description: 'Versão compacta' },
    ] as const;

    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {!paypalClientId && (
                <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 text-center border border-red-300">
                    <strong>Erro:</strong> NEXT_PUBLIC_PAYPAL_CLIENT_ID não está configurado.<br />
                    Configure a variável de ambiente para que o botão PayPal funcione corretamente.
                </div>
            )}

            <div className="text-center mb-14">
                <h1 className="text-3xl font-bold mb-2">🎯 PayPal Buttons Demo</h1>
                <p className="text-muted-foreground">
                    Botões PayPal melhorados com diferentes variantes
                </p>
            </div>

            {/* Seletor de Variantes */}
            <Card>
                <CardHeader>
                    <CardTitle>Escolha a Variante</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {variants.map((variant) => (
                            <Button
                                key={variant.key}
                                variant={selectedVariant === variant.key ? "default" : "outline"}
                                onClick={() => setSelectedVariant(variant.key)}
                                className="flex-1 min-w-[120px]"
                            >
                                {variant.label}
                            </Button>
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        {variants.find(v => v.key === selectedVariant)?.description}
                    </p>
                </CardContent>
            </Card>

            {/* Demonstração da Variante Selecionada */}
            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>🆕 PayPal Enhanced ({selectedVariant})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PayPalButton
                            onPaymentSuccess={handlePaymentSuccess}
                            amount="29.90"
                            currency="BRL"
                            description={`Teste PayPal ${selectedVariant}`}
                            variant={selectedVariant}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>📋 PayPal Original</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PayPalHostedButton
                            onPaymentSuccess={handlePaymentSuccess}
                            amount="29.90"
                            currency="BRL"
                            description="Teste PayPal Original"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Comparação de Características */}
            <Card>
                <CardHeader>
                    <CardTitle>🔥 Melhorias Implementadas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-green-600 mb-2">✅ PayPal Enhanced</h3>
                            <ul className="space-y-1 text-sm">
                                <li>🎨 3 variantes diferentes (default, premium, compact)</li>
                                <li>✨ Animações suaves e efeitos visuais</li>
                                <li>🔥 Gradientes e sombras modernas</li>
                                <li>🛡️ Ícones de segurança e proteção</li>
                                <li>🌟 Efeito brilho no hover</li>
                                <li>📱 Design responsivo otimizado</li>
                                <li>🇧🇷 Localização pt-BR</li>
                                <li>💫 Loading states melhorados</li>
                                <li>🎯 Better UX feedback</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold text-orange-600 mb-2">⚡ PayPal Original</h3>
                            <ul className="space-y-1 text-sm">
                                <li>📝 Implementação básica</li>
                                <li>🔵 Design padrão do PayPal</li>
                                <li>⚡ Funcionalidade essencial</li>
                                <li>🎯 Toast notifications</li>
                                <li>🔄 Estados de loading</li>
                                <li>❌ Visual limitado</li>
                                <li>📱 Responsividade básica</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Informações Técnicas */}
            <Card>
                <CardHeader>
                    <CardTitle>⚙️ Configuração Técnica</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Environment Variables:</h4>
                        <code className="text-sm">
                            NEXT_PUBLIC_PAYPAL_CLIENT_ID = {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? '✅ Configurado' : '❌ Não encontrado'}
                        </code>
                        
                        <h4 className="font-semibold mt-4 mb-2">Características:</h4>
                        <ul className="text-sm space-y-1">
                            <li>🔧 SDK: @paypal/react-paypal-js</li>
                            <li>💰 Moedas: BRL, USD, EUR</li>
                            <li>🎯 Intent: capture</li>
                            <li>🚫 Disable: venmo, card</li>
                            <li>🌍 Locale: pt_BR</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

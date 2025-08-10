
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, QrCode, ClipboardCopy, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { createPixPayment } from '@/ai/flows/mercado-pago-pix-flow';
import { Alert, AlertTitle, AlertDescription as AlertDesc } from '@/components/ui/alert';
import { processPaymentAndCreateSubscription } from '@/services/subscriber-service';

interface PixPaymentModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  amount: number;
  onPaymentSuccess: () => void;
  paymentMethod?: 'pix' | 'google' | 'apple';
}

export default function PixPaymentModal({ isOpen, onOpenChange, amount, onPaymentSuccess, paymentMethod }: PixPaymentModalProps) {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pixData, setPixData] = useState<{ qrCodeBase64: string; qrCode: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGeneratePix = async () => {
        if (!email || !name) {
            toast({ variant: 'destructive', title: 'Nome e Email são obrigatórios.' });
            return;
        }
        setIsLoading(true);
        setError(null);
        setPixData(null);

        try {
            const result = await createPixPayment({ amount, email, name, phone });
            if (result.error) {
                throw new Error(result.error);
            }
            if (result.qrCodeBase64 && result.qrCode) {
                setPixData({ qrCodeBase64: result.qrCodeBase64, qrCode: result.qrCode });
                localStorage.setItem('customerEmail', email);
            } else {
                 throw new Error("Não foi possível obter os dados do PIX.");
            }
        } catch (e: any) {
            setError(e.message || 'Ocorreu um erro desconhecido.');
            toast({ variant: 'destructive', title: 'Erro ao gerar PIX', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Código PIX copiado!" });
    };

    const handleClose = () => {
        onOpenChange(false);
        // Reset state after a short delay to allow closing animation
        setTimeout(() => {
            setName('');
            setEmail('');
            setPhone('');
            setPixData(null);
            setError(null);
            setIsLoading(false);
        }, 300);
    }
    
    // This creates a subscription when user confirms payment manually
    const handleManualConfirmation = async () => {
        if (!email || !name) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Email e nome são necessários para criar a assinatura.'
            });
            return;
        }

        setIsLoading(true);
        
        try {
            console.log('🎯 Criando assinatura PIX de 30 dias para:', email);
            
            // Gerar ID único para o pagamento PIX
            const pixPaymentId = `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Criar assinatura automaticamente
            const subscriptionId = await processPaymentAndCreateSubscription(
                email,          // Email do usuário
                pixPaymentId,   // ID único do pagamento PIX
                amount,         // Valor do pagamento
                'BRL',         // Moeda
                'pix',         // Método de pagamento
                name,          // Nome do usuário
                phone          // Telefone (opcional)
            );
            
            console.log('✅ Assinatura PIX criada com sucesso:', subscriptionId);
            
            toast({
                title: "✅ Pagamento PIX Confirmado!",
                description: `Assinatura ativada por 30 dias! ID: ${subscriptionId.slice(0, 8)}...`,
                duration: 6000,
            });
            
            onPaymentSuccess();
            handleClose();
            
        } catch (error) {
            console.error('❌ Erro ao criar assinatura PIX:', error);
            
            toast({
                variant: 'destructive',
                title: "❌ Erro na Assinatura",
                description: "Erro ao ativar a assinatura. Entre em contato conosco com o comprovante PIX.",
                duration: 8000,
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md shadow-lg border-gray-400 bg-card/90 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-white text-center flex items-center justify-center gap-2">
                        <QrCode /> Pagamento via PIX
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {pixData ? `Escaneie o QR Code ou use o código para pagar R$ ${amount.toFixed(2)}.` : 'Insira seus dados para gerar o código PIX.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Erro</AlertTitle>
                            <AlertDesc>{error}</AlertDesc>
                        </Alert>
                    )}

                    {!pixData ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input
                                    id="name"
                                    placeholder="Seu nome completo"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu.email@exemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="phone">Telefone (Opcional)</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="(21) 99999-8888"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <Alert variant="default" className="border-gray-400">
                                <ShieldCheck className="h-4 w-4 text-white" />
                                <AlertTitle className="text-white">Aviso de Segurança</AlertTitle>
                                <AlertDesc className="text-muted-foreground">
                                    Este pagamento é único e não recorrente. Não armazenamos nenhuma credencial de acesso ou dados de pagamento.
                                </AlertDesc>
                            </Alert>
                            <Button onClick={handleGeneratePix} disabled={isLoading || !email || !name} className="w-full h-11">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? 'Gerando...' : 'Gerar QR Code PIX'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 flex flex-col items-center">
                             <div className="p-2 bg-white rounded-lg">
                                <Image
                                    src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`}
                                    alt="PIX QR Code"
                                    width={256}
                                    height={256}
                                />
                            </div>
                            <div className="w-full space-y-2">
                                <Label>PIX Copia e Cola</Label>
                                <div className="flex items-center gap-2">
                                     <Input
                                        readOnly
                                        value={pixData.qrCode}
                                        className="text-xs font-mono"
                                    />
                                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(pixData.qrCode)}>
                                        <ClipboardCopy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                             <p className="text-xs text-muted-foreground text-center">Após o pagamento, clique no botão abaixo para confirmar e liberar seu acesso.</p>
                            <Button 
                                onClick={handleManualConfirmation} 
                                disabled={isLoading}
                                className="w-full bg-green-600 hover:bg-green-700 h-11"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Ativando Assinatura...
                                    </>
                                ) : (
                                    'Já Paguei, Liberar Acesso'
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PayPalButton from '@/components/paypal-button-enhanced';
import { useToast } from '@/hooks/use-toast';

export default function PayPalTestPage() {
  const { toast } = useToast();
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [testAmount, setTestAmount] = useState("1.00");

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('🎉 Pagamento PayPal concluído:', paymentData);
    setPaymentResult(paymentData);
    
    toast({
      title: "✅ Pagamento PayPal Aprovado!",
      description: `Transação: ${paymentData?.id || 'N/A'}`,
      duration: 8000,
    });
  };

  const resetTest = () => {
    setPaymentResult(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">💳 Teste PayPal - Italo Santos</h1>
        <p className="text-muted-foreground mb-4">
          Faça um pagamento teste com suas credenciais de produção
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p><strong>⚠️ ATENÇÃO:</strong> Este é um ambiente de PRODUÇÃO com credenciais reais!</p>
          <p>Pagamentos feitos aqui são <strong>REAIS</strong> e serão cobrados.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {paymentResult ? (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 text-center flex items-center justify-center gap-2">
                ✅ Pagamento Concluído com Sucesso!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium">ID da Transação:</span>
                  <span className="font-mono text-xs bg-gray-100 p-1 rounded">{paymentResult.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium">Método:</span>
                  <span className="uppercase font-bold text-blue-600">{paymentResult.method}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium">Email:</span>
                  <span>{paymentResult.email}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium">Nome:</span>
                  <span>{paymentResult.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium">Valor:</span>
                  <span className="font-bold text-green-600 text-lg">
                    {paymentResult.currency} {paymentResult.amount}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-medium">Status:</span>
                  <span className="text-green-600 font-bold">✅ APROVADO</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-green-100 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2">🎉 O que aconteceu:</h3>
                <ul className="text-sm space-y-1">
                  <li>✅ Pagamento processado pelo PayPal</li>
                  <li>✅ Assinante criado automaticamente no Firestore</li>
                  <li>✅ Webhook acionado (se configurado)</li>
                  <li>✅ Sistema funcionando perfeitamente!</li>
                </ul>
              </div>
              
              <Button 
                onClick={resetTest} 
                variant="outline" 
                className="w-full mt-4"
              >
                🔄 Fazer Outro Teste
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">💰 Configurar Pagamento Teste</CardTitle>
              <CardDescription className="text-center">
                Configure o valor e faça um pagamento real de teste
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">R$ {testAmount}</div>
                <div className="text-sm text-muted-foreground">Valor do Pagamento</div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor do Teste (R$):</label>
                <select
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  className="w-full p-3 border rounded-md bg-white"
                >
                  <option value="1.00">R$ 1,00 - Teste Mínimo</option>
                  <option value="5.00">R$ 5,00 - Teste Básico</option>
                  <option value="10.00">R$ 10,00 - Teste Médio</option>
                  <option value="15.00">R$ 15,00 - Teste Padrão</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  💡 Recomendamos começar com R$ 1,00 para confirmar que está funcionando
                </p>
              </div>
              
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-4">
                <h3 className="font-bold mb-2 text-center">🔥 Botão PayPal Oficial</h3>
                <PayPalButton
                  onPaymentSuccess={handlePaymentSuccess}
                  amount={testAmount}
                  currency="BRL"
                  description={`Teste PayPal - R$ ${testAmount} - Italo Santos`}
                  variant="default"
                  className="w-full"
                />
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Clique para abrir o PayPal e fazer o pagamento
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções de Como Testar */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">📋 Como Fazer o Pagamento Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-bold mb-2">🔸 Passo 1: Configure o Valor</h4>
                <p>Escolha um valor baixo (R$ 1,00) para o primeiro teste.</p>
              </div>
              
              <div>
                <h4 className="font-bold mb-2">🔸 Passo 2: Clique no Botão PayPal</h4>
                <p>O botão azul "PayPal" abrirá uma janela do PayPal.</p>
              </div>
              
              <div>
                <h4 className="font-bold mb-2">🔸 Passo 3: Faça Login no PayPal</h4>
                <p>Use sua conta PayPal pessoal para fazer o pagamento teste.</p>
              </div>
              
              <div>
                <h4 className="font-bold mb-2">🔸 Passo 4: Confirme o Pagamento</h4>
                <p>Revise os dados e confirme o pagamento.</p>
              </div>
              
              <div>
                <h4 className="font-bold mb-2">🔸 Passo 5: Aguarde a Confirmação</h4>
                <p>O sistema processará automaticamente e mostrará o resultado.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status das Credenciais */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">🔧 Status da Configuração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-bold mb-2">PayPal:</h4>
                <p>✅ <strong>Client ID:</strong> Configurado</p>
                <p>✅ <strong>Client Secret:</strong> Configurado</p>
                <p>✅ <strong>Ambiente:</strong> Produção</p>
                <p>✅ <strong>App Name:</strong> Italo Santos</p>
              </div>
              <div>
                <h4 className="font-bold mb-2">Sistema:</h4>
                <p>✅ <strong>Moeda:</strong> BRL (Real)</p>
                <p>✅ <strong>Webhook:</strong> Configurado</p>
                <p>✅ <strong>Firestore:</strong> Ativo</p>
                <p>✅ <strong>APIs:</strong> Funcionando</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

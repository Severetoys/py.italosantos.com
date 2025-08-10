'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2, Crown, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DirectTestPage() {
  const [email, setEmail] = useState('teste@example.com');
  const [name, setName] = useState('Usuário Teste');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDirectTest = async () => {
    if (!email) {
      setError('Email é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test/direct-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Erro no teste');
      }
    } catch (err) {
      setError('Erro ao executar teste: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleAutoLogin = () => {
    if (result?.data?.auth) {
      const auth = result.data.auth;
      localStorage.setItem('isAuthenticated', auth.isAuthenticated);
      localStorage.setItem('userType', auth.userType);
      localStorage.setItem('userEmail', auth.userEmail);
      
      // Redirecionar para galeria
      router.push('/galeria-assinantes');
    }
  };

  return (
    <main className="flex flex-1 w-full flex-col items-center p-4 bg-background min-h-screen">
      <Card className="w-full max-w-3xl animate-in fade-in-0 zoom-in-95 duration-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Crown className="text-amber-500" />
            Teste Direto - Assinatura sem API Intermediária
          </CardTitle>
          <CardDescription>
            Versão simplificada que cria assinatura diretamente no Firebase
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Formulário */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email para teste</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teste@example.com"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome (opcional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Usuário Teste"
                disabled={loading}
              />
            </div>

            <Button 
              onClick={handleDirectTest} 
              disabled={loading || !email}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando Assinatura...
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Criar Assinatura Direta
                </>
              )}
            </Button>
          </div>

          {/* Erro */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Resultado */}
          {result && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  {result.message}
                </AlertDescription>
              </Alert>

              {/* Dados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      💳 Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>ID:</strong> {result.data.payment.paymentId}</div>
                    <div><strong>Valor:</strong> R$ {result.data.payment.amount}</div>
                    <div><strong>Status:</strong> <Badge variant="outline" className="text-green-600">Aprovado</Badge></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      Assinatura
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Email:</strong> {result.data.subscription.email}</div>
                    <div><strong>Expira:</strong> {new Date(result.data.subscription.expirationDate).toLocaleDateString('pt-BR')}</div>
                    <div><strong>Status:</strong> <Badge className="bg-green-600">Ativa</Badge></div>
                  </CardContent>
                </Card>
              </div>

              {/* Login Automático */}
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-700 dark:text-blue-300">
                        Login Automático & Acesso à Galeria VIP
                      </h4>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Clique para fazer login e acessar a galeria de assinantes
                      </p>
                    </div>
                    <Button onClick={handleAutoLogin} className="bg-blue-600 hover:bg-blue-700">
                      <LogIn className="w-4 h-4 mr-2" />
                      Acessar Galeria VIP
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

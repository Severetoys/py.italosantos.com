"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Twitter, Settings, Save, TestTube, Loader2, CheckCircle, AlertCircle, Users, BarChart3 } from 'lucide-react';
import { twitterFlow } from '@/ai/flows/twitter-flow';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Contas pré-configuradas para facilitar a troca
const PRESET_ACCOUNTS = [
    { username: 'Severepics', name: 'Severe Pics', description: 'Conta principal' },
    { username: 'elonmusk', name: 'Elon Musk', description: 'Exemplo de conta pública' },
    { username: 'Twitter', name: 'Twitter Oficial', description: 'Conta oficial do Twitter/X' },
];

export default function XSettingsPage() {
    const { toast } = useToast();
    const [currentUsername, setCurrentUsername] = useState('Severepics');
    const [customUsername, setCustomUsername] = useState('');
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [testResults, setTestResults] = useState<{ success: boolean; message: string; tweetsCount?: number } | null>(null);
    const [lastTestedUsername, setLastTestedUsername] = useState('');

    // Carregar configuração atual do localStorage
    useEffect(() => {
        const savedUsername = localStorage.getItem('twitter_username');
        if (savedUsername) {
            setCurrentUsername(savedUsername);
        }
    }, []);

    const saveUsername = (username: string) => {
        localStorage.setItem('twitter_username', username);
        setCurrentUsername(username);
        toast({
            title: "Conta alterada!",
            description: `Agora usando a conta: @${username}`,
        });
    };

    const testConnection = async (username: string) => {
        if (!username.trim()) {
            toast({
                variant: 'destructive',
                title: 'Username necessário',
                description: 'Digite um nome de usuário para testar.',
            });
            return;
        }

        setIsTestingConnection(true);
        setLastTestedUsername(username);
        setTestResults(null);

        try {
            // Primeiro, tenta usar dados do cache se disponível
            const response = await twitterFlow({ username: username.trim(), maxResults: 5, mediaType: 'all' });
            
            setTestResults({
                success: true,
                message: `Conexão bem-sucedida!`,
                tweetsCount: response.tweets.length
            });

            toast({
                title: "Teste bem-sucedido!",
                description: `Encontrados ${response.tweets.length} tweets de @${username} (dados podem ser do cache)`,
            });

        } catch (error: any) {
            let errorMessage = 'Erro desconhecido';
            let canStillUse = false;
            
            if (error.message?.includes('não encontrado')) {
                errorMessage = 'Usuário não encontrado - Verifique se o username está correto';
            } else if (error.message?.includes('Rate limit') || error.message?.includes('Too Many Requests')) {
                errorMessage = 'Rate limit da API atingido';
                canStillUse = true; // Pode ainda funcionar com cache
            } else if (error.message?.includes('TWITTER_BEARER_TOKEN')) {
                errorMessage = 'Token da API não configurado no servidor';
            } else {
                errorMessage = error.message || 'Erro ao conectar com a API';
            }

            setTestResults({
                success: canStillUse,
                message: canStillUse 
                    ? `${errorMessage} - Mas pode funcionar com dados em cache` 
                    : errorMessage
            });

            toast({
                variant: canStillUse ? 'default' : 'destructive',
                title: canStillUse ? 'Aviso no teste' : 'Erro no teste',
                description: canStillUse 
                    ? `${errorMessage}. A conta ainda pode funcionar se houver dados em cache.`
                    : errorMessage,
                duration: 6000,
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Twitter className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold">Configurações do X (Twitter)</h1>
                        <p className="text-muted-foreground">Gerencie as contas do X para buscar vídeos e mídias</p>
                    </div>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/admin/x-status">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Ver Status da API
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Conta Atual
                    </CardTitle>
                    <CardDescription>
                        Conta atualmente configurada para buscar vídeos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <Twitter className="h-6 w-6 text-primary" />
                        <div>
                            <p className="font-medium">@{currentUsername}</p>
                            <p className="text-sm text-muted-foreground">
                                Sistema com fallback: API Oficial + RapidAPI
                            </p>
                        </div>
                        <Badge variant="secondary" className="ml-auto">Ativa</Badge>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="presets" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="presets" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Contas Rápidas
                    </TabsTrigger>
                    <TabsTrigger value="custom" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Conta Personalizada
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="presets" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contas Pré-configuradas</CardTitle>
                            <CardDescription>
                                Clique para alternar rapidamente entre contas conhecidas
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {PRESET_ACCOUNTS.map((account) => (
                                <div
                                    key={account.username}
                                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                                        currentUsername === account.username 
                                            ? 'border-primary bg-primary/5' 
                                            : 'border-border hover:bg-muted/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Twitter className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="font-medium">@{account.username}</p>
                                            <p className="text-sm text-muted-foreground">{account.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {currentUsername === account.username && (
                                            <Badge variant="default">Atual</Badge>
                                        )}
                                        <Button
                                            variant={currentUsername === account.username ? "secondary" : "outline"}
                                            size="sm"
                                            onClick={() => saveUsername(account.username)}
                                            disabled={currentUsername === account.username}
                                        >
                                            {currentUsername === account.username ? "Em uso" : "Usar conta"}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => testConnection(account.username)}
                                            disabled={isTestingConnection}
                                        >
                                            {isTestingConnection && lastTestedUsername === account.username ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <TestTube className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Conta Personalizada</CardTitle>
                            <CardDescription>
                                Digite o username de qualquer conta pública do X
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="custom-username">Nome de usuário (sem @)</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                                        <Input
                                            id="custom-username"
                                            placeholder="exemplo: elonmusk"
                                            value={customUsername}
                                            onChange={(e) => setCustomUsername(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => testConnection(customUsername)}
                                        disabled={isTestingConnection || !customUsername.trim()}
                                    >
                                        {isTestingConnection && lastTestedUsername === customUsername ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <TestTube className="h-4 w-4 mr-2" />
                                        )}
                                        Testar
                                    </Button>
                                </div>
                            </div>

                            {testResults && lastTestedUsername === customUsername && (
                                <div className={`p-4 rounded-lg border ${
                                    testResults.success 
                                        ? 'border-green-200 bg-green-50 text-green-800' 
                                        : 'border-red-200 bg-red-50 text-red-800'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        {testResults.success ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-red-600" />
                                        )}
                                        <div>
                                            <p className="font-medium">
                                                {testResults.success ? 'Teste bem-sucedido!' : 'Erro no teste'}
                                            </p>
                                            <p className="text-sm">
                                                {testResults.message}
                                                {testResults.tweetsCount !== undefined && (
                                                    ` - ${testResults.tweetsCount} tweets encontrados`
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={() => saveUsername(customUsername)}
                                disabled={!customUsername.trim() || (testResults && !testResults.success) || false}
                                className="w-full"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Salvar e Usar Esta Conta
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-green-500" />
                        Sistema de Fallback
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>• <strong>API Oficial do X:</strong> Primeira tentativa (mais confiável)</p>
                    <p>• <strong>RapidAPI:</strong> Fallback automático se a oficial falhar</p>
                    <p>• <strong>Cache Inteligente:</strong> Dados antigos são servidos em caso de falha</p>
                    <p>• <strong>Rate Limiting:</strong> Sistema detecta e se adapta automaticamente</p>
                    <p>• <strong>Alta Disponibilidade:</strong> Duas APIs garantem mais estabilidade</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        Informações Importantes
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>• As contas devem ser públicas para funcionar corretamente</p>
                    <p>• A API do X tem limites de requisições (rate limiting)</p>
                    <p>• Os dados ficam em cache por 1-4 horas dependendo do status</p>
                    <p>• Use o teste de conexão antes de salvar uma nova conta</p>
                    <p>• A mudança afeta imediatamente a página "Vídeos do X"</p>
                </CardContent>
            </Card>
        </div>
    );
}

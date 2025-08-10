'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { twitterFlow } from '@/ai/flows/twitter-flow';

interface CacheStatus {
    hasData: boolean;
    dataAge: string;
    isRateLimited: boolean;
    rateLimitUntil: string;
    currentUsername: string;
}

export default function XStatusPage() {
    const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const { toast } = useToast();

    const loadCacheStatus = async () => {
        setIsLoading(true);
        try {
            const currentUsername = localStorage.getItem('twitter_username') || 'Severepics';
            
            // Tenta fazer uma requisição pequena para verificar o status
            const response = await twitterFlow({ 
                username: currentUsername, 
                maxResults: 5,
                mediaType: 'all'
            });

            setCacheStatus({
                hasData: response.tweets.length > 0,
                dataAge: 'Dados frescos (menos de 1 minuto)',
                isRateLimited: false,
                rateLimitUntil: 'Não limitado',
                currentUsername
            });

            setLastUpdate(new Date());

        } catch (error: any) {
            const isRateLimited = error.message?.includes('Rate limit') || 
                                error.message?.includes('Too Many Requests');
            
            const currentUsername = localStorage.getItem('twitter_username') || 'Severepics';
            
            setCacheStatus({
                hasData: isRateLimited, // Se rate limited, provavelmente tem dados antigos
                dataAge: isRateLimited ? 'Dados antigos (cache)' : 'Sem dados',
                isRateLimited,
                rateLimitUntil: isRateLimited ? 'Próximos 15-30 minutos' : 'Não limitado',
                currentUsername
            });

            if (isRateLimited) {
                toast({
                    variant: 'destructive',
                    title: 'Rate Limit Ativo',
                    description: 'A API está limitada. Usando dados do cache.',
                    duration: 5000,
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearCache = () => {
        // Limpa o cache do localStorage relacionado ao Twitter
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('twitter_')) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        toast({
            title: 'Cache limpo',
            description: 'Todos os dados do cache foram removidos.',
        });
        
        loadCacheStatus();
    };

    useEffect(() => {
        loadCacheStatus();
    }, []);

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Status da API do X</h1>
                    <p className="text-muted-foreground">
                        Monitore o status da conexão e cache da API do Twitter/X
                    </p>
                </div>
                <Button 
                    onClick={loadCacheStatus}
                    disabled={isLoading}
                    variant="outline"
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Geral */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {cacheStatus?.isRateLimited ? (
                                <AlertCircle className="h-5 w-5 text-yellow-500" />
                            ) : (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            Status da API
                        </CardTitle>
                        <CardDescription>
                            Estado atual da conexão com a API do X
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span>Status:</span>
                            <Badge variant={cacheStatus?.isRateLimited ? "destructive" : "default"}>
                                {cacheStatus?.isRateLimited ? "Rate Limited" : "Normal"}
                            </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span>Dados disponíveis:</span>
                            <Badge variant={cacheStatus?.hasData ? "default" : "secondary"}>
                                {cacheStatus?.hasData ? "Sim" : "Não"}
                            </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span>Idade dos dados:</span>
                            <span className="text-sm text-muted-foreground">
                                {cacheStatus?.dataAge || "Carregando..."}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span>Rate limit até:</span>
                            <span className="text-sm text-muted-foreground">
                                {cacheStatus?.rateLimitUntil || "Carregando..."}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Informações de Cache */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Cache e Configuração
                        </CardTitle>
                        <CardDescription>
                            Configurações atuais e controle de cache
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span>Conta ativa:</span>
                            <Badge variant="outline">
                                @{cacheStatus?.currentUsername || "Carregando..."}
                            </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span>Última verificação:</span>
                            <span className="text-sm text-muted-foreground">
                                {lastUpdate ? lastUpdate.toLocaleTimeString() : "Nunca"}
                            </span>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-3">
                            <Button 
                                onClick={clearCache}
                                variant="outline" 
                                className="w-full"
                            >
                                Limpar Cache
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Remove todos os dados em cache. Use apenas se estiver enfrentando problemas.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Informações sobre Rate Limiting */}
            <Card>
                <CardHeader>
                    <CardTitle>Sobre Rate Limiting</CardTitle>
                    <CardDescription>
                        Como o sistema lida com os limites da API do X
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold mb-2">Cache Normal</h4>
                            <p className="text-sm text-muted-foreground">
                                Dados ficam em cache por 1 hora para reduzir chamadas à API.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Durante Rate Limit</h4>
                            <p className="text-sm text-muted-foreground">
                                Cache é estendido para 4 horas e dados antigos são servidos.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Retry Logic</h4>
                            <p className="text-sm text-muted-foreground">
                                Sistema tenta 3 vezes com backoff exponencial (1s, 2s, 4s).
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Fallback</h4>
                            <p className="text-sm text-muted-foreground">
                                Sempre retorna dados do cache quando possível durante problemas.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

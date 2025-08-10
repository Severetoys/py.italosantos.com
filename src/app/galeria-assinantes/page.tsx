'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  Star, 
  Lock, 
  Image as ImageIcon, 
  Video, 
  Download, 
  Shield,
  Calendar,
  Clock,
  Zap,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/use-subscription';
import ExclusiveMediaGrid, { useExclusiveMedia } from '@/components/exclusive-media-grid';
import SubscriptionStatus from '@/components/subscription-status';
import FaceIDProtectedRoute from '@/components/face-id-protected-route';

// Componente de bloqueio rigoroso
function AccessDenied({ type }: { type: 'auth' | 'subscription' }) {
  const router = useRouter();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (type === 'auth') {
        router.push('/auth/face');
      } else {
        router.push('/assinante');
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [type, router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center max-w-md mx-auto p-8">
        <Lock className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          🚫 Acesso Negado
        </h1>
        <p className="text-muted-foreground mb-6">
          {type === 'auth' 
            ? 'Você precisa estar autenticado para acessar esta página.'
            : 'Esta área é exclusiva para assinantes ativos.'
          }
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Redirecionando...
        </div>
      </div>
    </div>
  );
}

interface MediaItem {
  id: string;
  title: string;
  type: 'photo' | 'video';
  thumbnail: string;
  fullUrl: string;
  description?: string;
  uploadDate: string;
  exclusive: boolean;
}

function SubscriptionRequired() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Crown className="w-12 h-12 text-primary" />
      </div>
      
      <h2 className="text-2xl font-bold mb-4">Conteúdo Exclusivo para Assinantes</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Esta galeria contém fotos e vídeos exclusivos disponíveis apenas para assinantes premium.
        Assine agora e tenha acesso ilimitado a todo conteúdo especial!
      </p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-primary/20">
            <Shield className="w-5 h-5 text-primary" />
            <div className="text-left">
              <p className="font-medium text-sm">Conteúdo Exclusivo</p>
              <p className="text-xs text-muted-foreground">Fotos e vídeos únicos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-primary/20">
            <Download className="w-5 h-5 text-primary" />
            <div className="text-left">
              <p className="font-medium text-sm">Downloads Ilimitados</p>
              <p className="text-xs text-muted-foreground">Baixe quando quiser</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-primary/20">
            <Zap className="w-5 h-5 text-primary" />
            <div className="text-left">
              <p className="font-medium text-sm">Acesso Instantâneo</p>
              <p className="text-xs text-muted-foreground">Liberação imediata</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Link href="/assinante">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Crown className="w-4 h-4 mr-2" />
              Assinar Agora - R$ 99,00/mês
            </Button>
          </Link>
          
          <p className="text-xs text-muted-foreground">
            💳 Pagamento via PayPal ou Google Pay • ⚡ Liberação instantânea • 🔒 Cancele quando quiser
          </p>
        </div>
        
        <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-amber-700 dark:text-amber-400">Assinatura Mensal</span>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Renovação automática a cada 30 dias. Acesso completo durante todo o período da assinatura.
          </p>
        </div>
      </div>
    </div>
  );
}

function GaleriaAssinantesContent() {
  const router = useRouter();
  const { hasActiveSubscription, subscription, isLoading, isAuthenticated } = useSubscription();
  const { media, loading: mediaLoading } = useExclusiveMedia();
  const [selectedTab, setSelectedTab] = useState('all');
  const [accessVerified, setAccessVerified] = useState(false);
  const [verifyingAccess, setVerifyingAccess] = useState(true);

  // Verificação rigorosa server-side
  useEffect(() => {
    const verifyAccess = async () => {
      try {
        setVerifyingAccess(true);
        
        // Verificar autenticação básica primeiro
        const userEmail = localStorage.getItem('userEmail');
        const authStatus = localStorage.getItem('isAuthenticated') === 'true';
        
        if (!authStatus || !userEmail) {
          console.log('❌ Usuário não autenticado - redirecionando para /auth/face');
          router.push('/auth/face');
          return;
        }
        
        // Verificar acesso server-side
        const response = await fetch('/api/galeria-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail })
        });
        
        const result = await response.json();
        
        if (!result.hasAccess) {
          console.log('❌ Acesso negado à galeria - redirecionando para /assinante');
          router.push('/assinante');
          return;
        }
        
        console.log('✅ Acesso verificado e autorizado');
        setAccessVerified(true);
        
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        router.push('/assinante');
      } finally {
        setVerifyingAccess(false);
      }
    };
    
    verifyAccess();
  }, [router]);

  // Proteção adicional baseada no hook de assinatura
  useEffect(() => {
    if (!verifyingAccess && !isLoading && !hasActiveSubscription && accessVerified) {
      console.log('❌ Hook detectou falta de assinatura - redirecionando');
      router.push('/assinante');
    }
  }, [verifyingAccess, isLoading, hasActiveSubscription, accessVerified, router]);

  const photos = media.filter(item => item.type === 'photo');
  const videos = media.filter(item => item.type === 'video');

  // Mostrar loading durante verificação de acesso
  if (verifyingAccess || isLoading || mediaLoading || !accessVerified) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {verifyingAccess ? 'Verificando permissões...' : 'Carregando galeria exclusiva...'}
          </p>
        </div>
      </div>
    );
  }

  // Se chegou até aqui, o acesso foi verificado e aprovado

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Crown className="w-8 h-8 text-amber-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Galeria Exclusiva
          </h1>
          <Star className="w-8 h-8 text-amber-500" />
        </div>
        
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Conteúdo premium e exclusivo para assinantes. Fotos e vídeos em alta qualidade 
          com acesso total e downloads ilimitados durante os 30 dias da sua assinatura.
        </p>

        {hasActiveSubscription && subscription && (
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 rounded-full">
              <Badge className="bg-green-600 hover:bg-green-700">
                <Shield className="w-3 h-3 mr-1" />
                Assinante Ativo
              </Badge>
              <span className="text-sm text-green-700 dark:text-green-300">
                Expira em {new Date(subscription.endDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
            
            {/* Status da Assinatura */}
            <SubscriptionStatus />
          </div>
        )}
      </div>

      {/* Conteúdo exclusivo para assinantes ativos */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
          <TabsTrigger value="all" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Tudo ({media.length})
          </TabsTrigger>
          <TabsTrigger value="photos" className="text-xs">
            <ImageIcon className="w-3 h-3 mr-1" />
            Fotos ({photos.length})
          </TabsTrigger>
          <TabsTrigger value="videos" className="text-xs">
            <Video className="w-3 h-3 mr-1" />
            Vídeos ({videos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">Todo Conteúdo Exclusivo</h2>
            <p className="text-sm text-muted-foreground">
              {media.length} itens de conteúdo premium disponíveis para download
            </p>
          </div>
          <ExclusiveMediaGrid items={media} hasAccess={true} />
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">Fotos Exclusivas</h2>
            <p className="text-sm text-muted-foreground">
              {photos.length} fotos em alta resolução para download
            </p>
          </div>
          <ExclusiveMediaGrid items={photos} hasAccess={true} />
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">Vídeos Exclusivos</h2>
            <p className="text-sm text-muted-foreground">
              {videos.length} vídeos em alta qualidade disponíveis
            </p>
          </div>
          <ExclusiveMediaGrid items={videos} hasAccess={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function GaleriaAssinantesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasActiveSubscription, subscription } = useSubscription();
  const [accessVerified, setAccessVerified] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Aguarda hidratação do componente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Verificação rigorosa com bloqueio imediato
  useEffect(() => {
    if (!mounted) return; // Aguarda hydration

    // Bloqueio imediato se não autenticado
    if (!isLoading && !isAuthenticated) {
      console.log('❌ Não autenticado - redirecionando para /auth/face');
      router.replace('/auth/face');
      return;
    }

    // Bloqueio imediato se sem assinatura
    if (!isLoading && isAuthenticated && !hasActiveSubscription) {
      console.log('❌ Sem assinatura - redirecionando para /assinante');
      router.replace('/assinante');
      return;
    }

    // Verificação adicional no servidor
    if (!isLoading && isAuthenticated && hasActiveSubscription && !accessVerified && !isVerifying) {
      verifyAccess();
    }
  }, [mounted, isAuthenticated, isLoading, hasActiveSubscription, router, accessVerified, isVerifying]);

  const verifyAccess = async () => {
    if (isVerifying) return;
    
    try {
      setIsVerifying(true);
      console.log('🔍 Verificando acesso no servidor...');
      
      const userEmail = subscription?.email || localStorage.getItem('userEmail');
      
      if (!userEmail) {
        console.log('❌ Email não encontrado - redirecionando');
        router.replace('/auth/face');
        return;
      }

      const response = await fetch('/api/galeria-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: userEmail })
      });

      if (!response.ok) {
        console.log('❌ Resposta do servidor não OK - redirecionando');
        router.replace('/assinante');
        return;
      }

      const result = await response.json();
      if (!result.hasAccess) {
        console.log('❌ Acesso negado pelo servidor - redirecionando');
        router.replace('/assinante');
        return;
      }

      console.log('✅ Acesso verificado e aprovado');
      setAccessVerified(true);
    } catch (error) {
      console.error('❌ Erro ao verificar acesso:', error);
      router.replace('/assinante');
    } finally {
      setIsVerifying(false);
    }
  };

  // Aguarda hydration
  if (!mounted) {
    return null;
  }

  // Verificação de carregamento
  if (isLoading || isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Shield className="w-8 h-8 animate-pulse mx-auto mb-4 text-amber-500" />
          <p className="text-muted-foreground">
            {isLoading ? 'Carregando...' : 'Verificando permissões de acesso...'}
          </p>
        </div>
      </div>
    );
  }

  // Verificação de autenticação
  if (!isAuthenticated) {
    return <AccessDenied type="auth" />;
  }

  // Verificação de assinatura
  if (!hasActiveSubscription) {
    return <AccessDenied type="subscription" />;
  }

  // Aguarda verificação de acesso no servidor
  if (!accessVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Shield className="w-8 h-8 animate-pulse mx-auto mb-4 text-amber-500" />
          <p className="text-muted-foreground">Validando acesso...</p>
        </div>
      </div>
    );
  }

  // Se chegou até aqui, mostrar conteúdo protegido
  return (
    <FaceIDProtectedRoute>
      <main className="flex flex-1 w-full flex-col items-center p-4 bg-background min-h-screen">
        <Card className="w-full max-w-7xl animate-in fade-in-0 zoom-in-95 duration-500 shadow-xl border-primary/20 bg-card/95 backdrop-blur-xl">
          <CardHeader className="text-center border-b border-primary/10">
            <CardTitle className="text-2xl text-primary flex items-center justify-center gap-3">
              <Crown className="text-amber-500" />
              Galeria Exclusiva para Assinantes
              <Star className="text-amber-500" />
            </CardTitle>
            <CardDescription>
              Área exclusiva com conteúdo premium para assinantes
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <GaleriaAssinantesContent />
          </CardContent>
        </Card>
      </main>
    </FaceIDProtectedRoute>
  );
}

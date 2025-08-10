"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "../../../components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Camera, Twitter, Settings, RefreshCw, ExternalLink, Save, Eye } from 'lucide-react';
import { useToast } from "../../../hooks/use-toast";
import Script from 'next/script';
import { Badge } from "../../../components/ui/badge";

// Componente do Widget do Twitter para Admin
interface TwitterAdminWidgetProps {
  username: string;
  theme?: 'light' | 'dark';
  height?: number;
  showPhotosOnly?: boolean;
}

const TwitterAdminWidget: React.FC<TwitterAdminWidgetProps> = ({ 
  username, 
  theme = 'light', 
  height = 600,
  showPhotosOnly = true
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTwitterWidget = () => {
      if (typeof window !== 'undefined' && (window as any).twttr) {
        setIsLoading(true);
        setError(null);
        
        // Limpar widget anterior
        if (widgetRef.current) {
          widgetRef.current.innerHTML = '';
        }

        // Configurações do widget
        const widgetConfig = {
          height: height,
          theme: theme,
          chrome: "noheader,nofooter,noborders,transparent",
          borderColor: "#e1e8ed",
          lang: "pt",
          related: "twitterapi,twitter",
          'tweet-limit': showPhotosOnly ? 50 : 20, // Mais tweets para filtrar fotos
          dnt: true, // Do not track
          cards: "visible"
        };

        // Criar widget do Twitter
        (window as any).twttr.widgets.createTimeline(
          {
            sourceType: 'profile',
            screenName: username
          },
          widgetRef.current,
          widgetConfig
        ).then(() => {
          setIsLoading(false);
          
          // Se for modo "somente fotos", aplicar filtro CSS
          if (showPhotosOnly && widgetRef.current) {
            const style = document.createElement('style');
            style.textContent = `
              .twitter-widget-container iframe {
                filter: none !important;
              }
              /* Esconder tweets sem mídia quando possível */
              .timeline-Tweet:not(.timeline-Tweet--withMedia) {
                display: none !important;
              }
            `;
            widgetRef.current.appendChild(style);
          }
        }).catch((err: any) => {
          console.error('Erro ao carregar widget do Twitter:', err);
          setError('Erro ao carregar o feed do Twitter. Verifique se o usuário existe.');
          setIsLoading(false);
        });
      }
    };

    // Aguardar o script do Twitter carregar
    const checkTwitter = () => {
      if (typeof window !== 'undefined' && (window as any).twttr) {
        loadTwitterWidget();
      } else {
        setTimeout(checkTwitter, 100);
      }
    };

    checkTwitter();
  }, [username, theme, height, showPhotosOnly]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive bg-destructive/10 rounded-lg p-4">
        <AlertCircle className="h-12 w-12" />
        <p className="mt-4 font-semibold">Erro ao carregar feed do Twitter</p>
        <p className="text-sm text-center">{error}</p>
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(`https://twitter.com/${username}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver no Twitter
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setError(null)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[400px] absolute inset-0 bg-background/80 rounded-lg z-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando feed do Twitter...</p>
          <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
        </div>
      )}
      <div ref={widgetRef} className="twitter-widget-container" />
    </div>
  );
};

export default function AdminFotosPage() {
  const { toast } = useToast();
  
  // Estados para configuração do Twitter
  const [twitterUsername, setTwitterUsername] = useState('severepics');
  const [currentUsername, setCurrentUsername] = useState('severepics');
  const [widgetTheme, setWidgetTheme] = useState<'light' | 'dark'>('light');
  const [widgetHeight, setWidgetHeight] = useState(700);
  const [showPhotosOnly, setShowPhotosOnly] = useState(true);
  
  // Estados para configurações salvas
  const [savedConfig, setSavedConfig] = useState({
    username: 'severepics',
    theme: 'light' as 'light' | 'dark',
    height: 700,
    photosOnly: true
  });

  // Carregar configurações salvas
  useEffect(() => {
    const saved = localStorage.getItem('twitter-admin-config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setSavedConfig(config);
        setTwitterUsername(config.username);
        setCurrentUsername(config.username);
        setWidgetTheme(config.theme);
        setWidgetHeight(config.height);
        setShowPhotosOnly(config.photosOnly);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, []);

  const handleUsernameUpdate = () => {
    if (!twitterUsername.trim()) {
      toast({
        variant: "destructive",
        title: "Username inválido",
        description: "Por favor, insira um nome de usuário válido"
      });
      return;
    }
    
    const cleanUsername = twitterUsername.replace('@', '').trim();
    setCurrentUsername(cleanUsername);
    
    toast({
      title: "Feed atualizado!",
      description: `Carregando feed de @${cleanUsername}`
    });
  };

  const saveConfiguration = () => {
    const config = {
      username: currentUsername,
      theme: widgetTheme,
      height: widgetHeight,
      photosOnly: showPhotosOnly
    };
    
    localStorage.setItem('twitter-admin-config', JSON.stringify(config));
    setSavedConfig(config);
    
    toast({
      title: "Configurações salvas!",
      description: "As configurações foram salvas e serão mantidas na próxima visita"
    });
  };

  const presetUsers = [
    { username: 'severepics', label: 'Severe Pics (Principal)' },
    { username: 'italosantos', label: 'Ítalo Santos' },
    { username: 'twitter', label: 'Twitter Oficial' },
    { username: 'elonmusk', label: 'Elon Musk (Teste)' }
  ];

  return (
    <>
      <Script 
        src="https://platform.twitter.com/widgets.js" 
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Twitter widgets script carregado');
        }}
      />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Fotos do Twitter</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie fotos de perfis do Twitter usando o widget oficial
            </p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Widget Oficial ✅
          </Badge>
        </div>

        <Tabs defaultValue="viewer" className="w-full">
          <TabsList>
            <TabsTrigger value="viewer" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizador
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="viewer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Twitter className="h-5 w-5" />
                  Feed do Twitter: @{currentUsername}
                </CardTitle>
                <CardDescription>
                  Widget oficial do Twitter - 100% confiável e sempre atualizado
                  {showPhotosOnly && (
                    <Badge variant="outline" className="ml-2">
                      <Camera className="h-3 w-3 mr-1" />
                      Focado em fotos
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Controles rápidos */}
                <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {presetUsers.map((preset) => (
                      <Button
                        key={preset.username}
                        variant={currentUsername === preset.username ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setTwitterUsername(preset.username);
                          setCurrentUsername(preset.username);
                        }}
                      >
                        @{preset.username}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://twitter.com/${currentUsername}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentUsername(currentUsername)} // Force refresh
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Widget do Twitter */}
                <div className="border rounded-lg overflow-hidden">
                  <TwitterAdminWidget 
                    username={currentUsername} 
                    theme={widgetTheme}
                    height={widgetHeight}
                    showPhotosOnly={showPhotosOnly}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações do Widget
                </CardTitle>
                <CardDescription>
                  Personalize a aparência e comportamento do widget do Twitter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="twitter-username">Nome de usuário do Twitter</Label>
                  <div className="flex gap-2">
                    <Input
                      id="twitter-username"
                      value={twitterUsername}
                      onChange={(e) => setTwitterUsername(e.target.value)}
                      placeholder="severepics"
                      className="flex-1"
                    />
                    <Button onClick={handleUsernameUpdate}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Aplicar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Digite sem o @ - exemplo: severepics
                  </p>
                </div>

                {/* Tema */}
                <div className="space-y-2">
                  <Label htmlFor="theme-select">Tema do Widget</Label>
                  <select
                    id="theme-select"
                    value={widgetTheme}
                    onChange={(e) => setWidgetTheme(e.target.value as 'light' | 'dark')}
                    className="block w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                  </select>
                </div>

                {/* Altura */}
                <div className="space-y-2">
                  <Label htmlFor="height-input">Altura do Widget (px)</Label>
                  <Input
                    id="height-input"
                    type="number"
                    value={widgetHeight}
                    onChange={(e) => setWidgetHeight(Number(e.target.value))}
                    min="400"
                    max="1200"
                    step="50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recomendado: 600-800px
                  </p>
                </div>

                {/* Modo fotos */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="photos-only"
                    checked={showPhotosOnly}
                    onChange={(e) => setShowPhotosOnly(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="photos-only">
                    Foco em posts com fotos
                    <span className="text-xs text-muted-foreground block">
                      Prioriza posts que contêm imagens
                    </span>
                  </Label>
                </div>

                {/* Salvar configurações */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={saveConfiguration} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setTwitterUsername(savedConfig.username);
                      setCurrentUsername(savedConfig.username);
                      setWidgetTheme(savedConfig.theme);
                      setWidgetHeight(savedConfig.height);
                      setShowPhotosOnly(savedConfig.photosOnly);
                    }}
                  >
                    Restaurar Salvas
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Informações sobre o Widget */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sobre esta Solução</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm font-medium">Widget oficial do Twitter - 100% confiável</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm font-medium">Não precisa de API keys ou configuração complexa</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm font-medium">Sempre atualizado com o feed real do Twitter</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm font-medium">Funciona para qualquer usuário público do Twitter</span>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Dica:</strong> Esta solução substitui completamente as APIs complexas que estavam falhando. 
                    O widget oficial do Twitter é mantido pela própria empresa e sempre funciona!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

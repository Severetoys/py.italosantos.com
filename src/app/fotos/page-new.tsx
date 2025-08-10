"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Loader2, AlertCircle, Camera, Twitter, Instagram, Upload, Settings, RefreshCw, ExternalLink } from 'lucide-react';
import Image from "next/image";
import { useToast } from "../../hooks/use-toast";
import { collection, getDocs, Timestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Script from 'next/script';

// Interface para fotos uploadadas
interface UploadedPhoto {
  id: string;
  title: string;
  imageUrl: string;
}

// Componente do Widget do Twitter
interface TwitterWidgetProps {
  username: string;
  theme?: 'light' | 'dark';
  height?: number;
}

const TwitterWidget: React.FC<TwitterWidgetProps> = ({ 
  username, 
  theme = 'light', 
  height = 600 
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

        // Criar novo widget
        (window as any).twttr.widgets.createTimeline(
          {
            sourceType: 'profile',
            screenName: username
          },
          widgetRef.current,
          {
            height: height,
            theme: theme,
            chrome: "noheader,nofooter,noborders,transparent",
            borderColor: "#e1e8ed",
            lang: "pt",
            related: "twitterapi,twitter",
            'tweet-limit': 20
          }
        ).then(() => {
          setIsLoading(false);
        }).catch((err: any) => {
          console.error('Erro ao carregar widget do Twitter:', err);
          setError('Erro ao carregar o feed do Twitter');
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
  }, [username, theme, height]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive bg-destructive/10 rounded-lg p-4">
        <AlertCircle className="h-12 w-12" />
        <p className="mt-4 font-semibold">Erro ao carregar feed do Twitter</p>
        <p className="text-sm text-center">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={() => window.open(`https://twitter.com/${username}`, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Ver no Twitter
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[400px] absolute inset-0 bg-background/80 rounded-lg">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando feed do Twitter...</p>
        </div>
      )}
      <div ref={widgetRef} className="twitter-widget-container" />
    </div>
  );
};

// Componentes de estado reutilizáveis
const FeedLoading = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px]">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
    <p className="mt-4 text-muted-foreground">{message}</p>
  </div>
);

const FeedError = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive bg-destructive/10 rounded-lg p-4">
    <AlertCircle className="h-12 w-12" />
    <p className="mt-4 font-semibold">Erro ao carregar</p>
    <p className="text-sm text-center">{message}</p>
  </div>
);

const FeedEmpty = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
    <Camera className="h-12 w-12" />
    <p className="mt-4 text-lg font-semibold text-center">{message}</p>
  </div>
);

export default function FotosPage() {
  const { toast } = useToast();
  
  // Estados para configuração do Twitter
  const [twitterUsername, setTwitterUsername] = useState('severepics');
  const [currentUsername, setCurrentUsername] = useState('severepics');
  const [widgetTheme, setWidgetTheme] = useState<'light' | 'dark'>('light');
  const [widgetHeight, setWidgetHeight] = useState(600);
  
  // Estados para fotos uploadadas
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState(true);

  // Buscar fotos uploadadas do Firestore
  const fetchUploadedPhotos = async () => {
    setIsLoadingUploads(true);
    try {
      const photosCollection = collection(db, 'photos');
      const photosQuery = query(photosCollection, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(photosQuery);
      
      const photos: UploadedPhoto[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        photos.push({
          id: doc.id,
          title: data.title || 'Sem título',
          imageUrl: data.imageUrl,
        });
      });
      
      setUploadedPhotos(photos);
    } catch (error) {
      console.error('Erro ao buscar fotos:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar fotos",
        description: "Não foi possível carregar as fotos do Firestore"
      });
    } finally {
      setIsLoadingUploads(false);
    }
  };

  useEffect(() => {
    fetchUploadedPhotos();
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
    
    setCurrentUsername(twitterUsername.replace('@', ''));
    toast({
      title: "Feed atualizado!",
      description: `Carregando feed de @${twitterUsername.replace('@', '')}`
    });
  };

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
            <h1 className="text-3xl font-bold">Galeria de Fotos</h1>
            <p className="text-muted-foreground">
              Veja fotos do Twitter, Instagram e uploads diretos
            </p>
          </div>
        </div>

        <Tabs defaultValue="twitter" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="twitter" className="flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              Twitter/X
            </TabsTrigger>
            <TabsTrigger value="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="uploads" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Uploads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="twitter" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Twitter className="h-5 w-5" />
                  Feed do Twitter/X
                </CardTitle>
                <CardDescription>
                  Widget oficial do Twitter para exibir fotos e posts do usuário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Configurações do Widget */}
                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="twitter-username">Nome de usuário</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="twitter-username"
                        value={twitterUsername}
                        onChange={(e) => setTwitterUsername(e.target.value)}
                        placeholder="severepics"
                        className="flex-1"
                      />
                      <Button onClick={handleUsernameUpdate} size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div>
                      <Label htmlFor="theme-select">Tema</Label>
                      <select
                        id="theme-select"
                        value={widgetTheme}
                        onChange={(e) => setWidgetTheme(e.target.value as 'light' | 'dark')}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
                      >
                        <option value="light">Claro</option>
                        <option value="dark">Escuro</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="height-input">Altura</Label>
                      <Input
                        id="height-input"
                        type="number"
                        value={widgetHeight}
                        onChange={(e) => setWidgetHeight(Number(e.target.value))}
                        min="400"
                        max="1000"
                        className="mt-1 w-24"
                      />
                    </div>
                  </div>
                </div>

                {/* Widget do Twitter */}
                <div className="border rounded-lg overflow-hidden">
                  <TwitterWidget 
                    username={currentUsername} 
                    theme={widgetTheme}
                    height={widgetHeight}
                  />
                </div>

                {/* Link direto para o Twitter */}
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(`https://twitter.com/${currentUsername}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver perfil completo no Twitter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instagram" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="h-5 w-5" />
                  Feed do Instagram
                </CardTitle>
                <CardDescription>
                  Em desenvolvimento - API do Instagram em configuração
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeedEmpty message="Feed do Instagram será implementado em breve" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uploads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Fotos Enviadas
                </CardTitle>
                <CardDescription>
                  Fotos enviadas diretamente para o sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUploads ? (
                  <FeedLoading message="Carregando fotos enviadas..." />
                ) : uploadedPhotos.length === 0 ? (
                  <FeedEmpty message="Nenhuma foto foi enviada ainda" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedPhotos.map((photo) => (
                      <div key={photo.id} className="group relative overflow-hidden rounded-lg border bg-muted/50">
                        <div className="aspect-square relative">
                          <Image
                            src={photo.imageUrl}
                            alt={photo.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-sm font-medium truncate">{photo.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

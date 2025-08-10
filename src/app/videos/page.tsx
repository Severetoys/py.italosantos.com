"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Loader2, AlertCircle, Video, Twitter, Upload, Play } from 'lucide-react';
import { useToast } from "../../hooks/use-toast";
import { twitterFlow, type TwitterMediaInput, type TwitterMediaOutput } from '../../ai/flows/twitter-flow';
import { collection, getDocs, Timestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Interfaces para os tipos de mídia
interface TwitterMedia {
  url?: string;
  preview_image_url?: string;
  type: string;
  media_key: string;
}

// Tipo para tweet com mídia (baseado no novo schema)
interface TweetWithMedia {
  id: string;
  text: string;
  created_at?: string;
  media: TwitterMedia[];
  username: string;
  profile_image_url?: string;
  isRetweet?: boolean;
}

interface UploadedVideo {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  createdAt: Timestamp;
}

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
    <Video className="h-12 w-12" />
    <p className="mt-4 text-lg font-semibold text-center">{message}</p>
  </div>
);

const TwitterVideos = () => {
    const { toast } = useToast();
    const [tweets, setTweets] = useState<TweetWithMedia[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTwitter = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await twitterFlow({ 
                    username: 'Severepics', 
                    maxResults: 100,
                    mediaType: 'videos' 
                });
                setTweets(response.tweets);
            } catch (e: any) {
                const errorMessage = e.message || "Ocorreu um erro desconhecido.";
                setError(`Não foi possível carregar o feed do Twitter. Motivo: ${errorMessage}`);
                toast({
                    variant: 'destructive',
                    title: 'Erro ao Carregar o Feed do Twitter',
                    description: errorMessage,
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchTwitter();
    }, [toast]);
    
    const videos = tweets.flatMap(tweet => 
        tweet.media.filter(m => (m.type === 'video' || m.type === 'animated_gif') && (m.url || m.preview_image_url))
    );

    if (isLoading) return <FeedLoading message="Carregando vídeos do X (Twitter)..." />;
    if (error) return <FeedError message={error} />;
    if (videos.length === 0) return <FeedEmpty message="Nenhum vídeo encontrado no feed do Twitter." />;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map(media => (
                <div key={media.media_key} className="group relative aspect-video overflow-hidden rounded-lg border border-primary/20 hover:border-primary hover:shadow-neon-red-light transition-all">
                    <div className="relative w-full h-full bg-black/20">
                        {media.preview_image_url && (
                            <img 
                                src={media.preview_image_url} 
                                alt="Video Thumbnail" 
                                className="w-full h-full object-cover"
                            />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="h-12 w-12 text-white/80 group-hover:text-white transition-colors" />
                        </div>
                        {media.url && (
                            <video 
                                src={media.url} 
                                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                controls
                                muted
                                preload="metadata"
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Componente para a aba de Uploads
const UploadsFeed = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [videos, setVideos] = useState<UploadedVideo[]>([]);
    const [error, setError] = useState<string | null>(null);
    // Gerar thumbs aleatórias se não existir
    const [generatedThumbs, setGeneratedThumbs] = useState<{[id: string]: string}>({});

    useEffect(() => {
        videos.forEach(video => {
            if (!video.thumbnailUrl && video.videoUrl && !generatedThumbs[video.id]) {
                const videoEl = document.createElement('video');
                videoEl.src = video.videoUrl;
                videoEl.muted = true;
                videoEl.preload = 'metadata';
                videoEl.onloadedmetadata = () => {
                    const duration = videoEl.duration;
                    if (duration && duration > 2) {
                        const min = duration * 0.1;
                        const max = duration * 0.9;
                        const randomTime = Math.random() * (max - min) + min;
                        videoEl.currentTime = randomTime;
                    } else {
                        videoEl.currentTime = 1;
                    }
                };
                videoEl.onseeked = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = videoEl.videoWidth;
                    canvas.height = videoEl.videoHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                        const dataUrl = canvas.toDataURL('image/jpeg');
                        setGeneratedThumbs(prev => ({ ...prev, [video.id]: dataUrl }));
                    }
                };
            }
        });
    }, [videos]);

    useEffect(() => {
        const fetchVideos = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const videosCollection = collection(db, "videos");
                const q = query(videosCollection, orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const videosList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as UploadedVideo));
                setVideos(videosList);
            } catch (e: any) {
                setError("Não foi possível carregar os vídeos do servidor.");
                toast({
                    variant: "destructive",
                    title: "Erro ao Carregar Vídeos",
                    description: "Houve um problema ao buscar os vídeos enviados.",
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchVideos();
    }, [toast]);

    if (isLoading) return <FeedLoading message="Carregando vídeos enviados..." />;
    if (error) return <FeedError message={error} />;
    if (videos.length === 0) return <FeedEmpty message="Nenhum vídeo foi enviado ainda." />;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map(video => (
                <div key={video.id} className="group relative aspect-video overflow-hidden rounded-lg border border-primary/20 hover:border-primary hover:shadow-neon-red-light transition-all">
                    <video
                        src={video.videoUrl}
                        poster={video.thumbnailUrl || generatedThumbs[video.id]}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-sm font-bold">{video.title}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function VideosPage() {
  return (
    <main className="flex flex-1 w-full flex-col items-center p-4 bg-background">
      <Card className="w-full max-w-6xl animate-in fade-in-0 zoom-in-95 duration-500 shadow-neon-red-strong border-primary/50 bg-card/90 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-primary text-shadow-neon-red-light flex items-center justify-center gap-3">
            <Video /> Galeria de Vídeos
          </CardTitle>
          <CardDescription>Feeds de vídeos de várias fontes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="twitter_videos" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-background/50 border border-primary/20">
              <TabsTrigger value="twitter_videos" className="data-[state=active]:bg-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon-red-light">
                <Twitter className="h-4 w-4 mr-2"/>Vídeos do X
              </TabsTrigger>
              <TabsTrigger value="uploads" className="data-[state=active]:bg-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon-red-light">
                <Upload className="h-4 w-4 mr-2"/>Uploads
              </TabsTrigger>
            </TabsList>
            <TabsContent value="twitter_videos" className="pt-6">
              <TwitterVideos />
            </TabsContent>
            <TabsContent value="uploads" className="pt-6">
                <UploadsFeed />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}

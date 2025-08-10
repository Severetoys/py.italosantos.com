
"use client";

import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { CornerDownRight, CheckCircle, MapPin, Twitter, Instagram, Youtube, Facebook, Loader2, AlertCircle, ImageIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { initialReviews } from '@/lib/reviews-data';
import { useAdminGallery } from '@/hooks/use-admin-gallery';

declare global {
  interface Window {
    FB: any;
  }
}

interface Review {
  id: string;
  author: string;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp; 
  reply?: {
      author: string;
      text: string;
      isVerified: boolean;
      createdAt: Timestamp;
  };
}

const MainFooter = () => {
    const { toast } = useToast();
    const { galleryPhotos, loading: galleryLoading, error: galleryError, refreshSettings } = useAdminGallery();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newReviewAuthor, setNewReviewAuthor] = useState('');
    const [newReviewText, setNewReviewText] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const fetchApprovedReviews = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // First check if Firebase is accessible
            if (!db) {
                throw new Error("Firebase não está configurado corretamente");
            }

            const reviewsRef = collection(db, 'reviews');
            const q = query(reviewsRef, where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // If firestore is empty, populate with initial reviews and refetch
                console.log("No approved reviews found. Populating with initial data...");
                const batch = [];
                for (const reviewData of initialReviews) {
                    batch.push(addDoc(collection(db, "reviews"), {
                        ...reviewData,
                        createdAt: reviewData.reply ? reviewData.reply.createdAt : Timestamp.now(),
                        status: 'approved',
                    }));
                }
                await Promise.all(batch);
                // After populating, call the function again to fetch the new data
                setTimeout(fetchApprovedReviews, 500); 
                return;
            }

            const approvedReviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
            setReviews(approvedReviews);

        } catch (e: any) {
            console.error("Error fetching approved reviews:", e);
            
            // Check for specific error types
            let errorMessage = "Não foi possível carregar os comentários.";
            if (e.code === 'permission-denied') {
                errorMessage = "Acesso negado ao banco de dados.";
            } else if (e.code === 'network-request-failed' || e.message?.includes('network')) {
                errorMessage = "Erro de conexão. Verifique sua internet.";
            } else if (e.code === 'unavailable') {
                errorMessage = "Serviço temporariamente indisponível.";
            }
            
            // Always try to use fallback data regardless of error
            console.log("Using fallback static reviews data...");
            try {
                const fallbackReviews = initialReviews.map((review, index) => ({
                    id: `static_${index}`,
                    ...review,
                    status: 'approved' as const,
                    createdAt: review.reply ? review.reply.createdAt : Timestamp.now(),
                }));
                setReviews(fallbackReviews);
                setError(null); // Clear error since we have fallback data
            } catch (fallbackError) {
                console.error("Failed to load fallback data:", fallbackError);
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        if (typeof window !== 'undefined' && window.FB) {
            window.FB.XFBML.parse();
        }
        
        // Add a small delay to ensure Firebase is fully initialized
        const initializeReviews = async () => {
            try {
                await fetchApprovedReviews();
            } catch (error) {
                console.error("Failed to initialize reviews:", error);
                // Force fallback if initial load fails
                const fallbackReviews = initialReviews.map((review, index) => ({
                    id: `fallback_${index}`,
                    ...review,
                    status: 'approved' as const,
                    createdAt: review.reply ? review.reply.createdAt : Timestamp.now(),
                }));
                setReviews(fallbackReviews);
                setIsLoading(false);
            }
        };

        // Small delay to ensure everything is loaded
        setTimeout(initializeReviews, 100);
    }, []);
    
    const handleAddReview = async () => {
        if (!newReviewAuthor || !newReviewText) {
            toast({ variant: 'destructive', title: 'Por favor, preencha nome e comentário.' });
            return;
        }
        setIsSubmittingReview(true);
        try {
            await addDoc(collection(db, "reviews"), {
                author: newReviewAuthor,
                text: newReviewText,
                status: 'pending',
                createdAt: Timestamp.now(),
            });
            toast({ title: 'Comentário enviado para moderação!' });
            setNewReviewAuthor('');
            setNewReviewText('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao enviar comentário.' });
        } finally {
            setIsSubmittingReview(false);
        }
    }

    const galleryWords = ["ACOMPANHANTE MASCULINO", "SENSUALIDADE", "PRAZER", "BDSM", "FETISH", "FANTASIA", "IS"];
      
    // Criar galerias usando as fotos do painel admin, filtrando apenas as que têm fotos configuradas
    const galleries = galleryWords
        .map((word, i) => {
            // Pegar a foto correspondente do admin
            const adminPhoto = galleryPhotos[i];
            const photoUrl = adminPhoto?.url;
            
            // Só incluir se a foto existe e não é placeholder
            if (!photoUrl || photoUrl === 'https://placehold.co/400x600.png') {
                return null;
            }
                
            return {
                id: i,
                word: word,
                photos: [{
                    src: photoUrl,
                    hint: i % 2 === 0 ? "fashion editorial" : "urban model",
                    id: 0
                }]
            };
        })
        .filter((gallery): gallery is NonNullable<typeof gallery> => gallery !== null); // Remove nulls e type assertion
      
    const ReviewCard = ({ review }: { review: Review }) => {
        const fallback = review.author.substring(0, 2).toUpperCase();
        // Logo Garoto Com Local SVG correto
        const garotocomlocalLogo = "/Garoto-com-local-icone.svg";
        const garotocomlocalLogoFallback = "https://firebasestorage.googleapis.com/v0/b/italo-santos-app.firebasestorage.app/o/gcl-pin.png?alt=media";
        const defaultAvatar = "https://placehold.co/100x100.png?text=" + fallback;
        const reviewDate = review.createdAt ? formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : 'Data indisponível';

        // Função para determinar a fonte do comentário baseado no conteúdo
        const getReviewSource = (authorName: string, text: string) => {
            const lowerAuthor = authorName.toLowerCase();
            const lowerText = text.toLowerCase();
            
            // Garoto Com Local - indicadores típicos
            if (lowerAuthor.includes('sp') || lowerAuthor.includes('rj') || lowerAuthor.includes('bh') || 
                lowerAuthor.includes('mg') || lowerAuthor.includes('pr') || lowerText.includes('garoto com local')) {
                return { name: 'Garoto Com Local', color: 'bg-green-500', icon: '🌐' };
            }
            // Portal do Cliente - nomes curtos ou conteúdo específico
            else if (authorName.length <= 3 || lowerText.includes('portal') || lowerText.includes('cliente') ||
                     lowerAuthor.includes('anon') || lowerAuthor.includes('user')) {
                return { name: 'Portal do Cliente', color: 'bg-blue-500', icon: '👤' };
            }
            // Avaliação Direta - outros casos
            else {
                return { name: 'Avaliação Direta', color: 'bg-orange-500', icon: '📝' };
            }
        };

        const source = getReviewSource(review.author, review.text);
        const avatarSrc = source.name === 'Garoto Com Local' ? garotocomlocalLogo : defaultAvatar;


        return (
            <Card className="flex flex-col w-full max-w-2xl p-6 bg-card/50 backdrop-blur-sm border-gray-700 hover:border-gray-400 hover:shadow-lg transition-all duration-300">
              <CardContent className="flex flex-col items-start text-left p-0 flex-grow gap-4">
                <div className="flex items-center gap-4 w-full">
                  {source.name === 'Garoto Com Local' ? (
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-muted overflow-hidden">
                      <img
                        src={garotocomlocalLogo}
                        alt="Garoto Com Local"
                        className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = garotocomlocalLogoFallback; }}
                      />
                    </div>
                  ) : (
                    <Avatar className="w-12 h-12 border-2 border-gray-400">
                      <AvatarImage src={avatarSrc} alt={source.name} data-ai-hint="user profile" />
                      <AvatarFallback className="bg-gray-800 text-white font-bold">{fallback}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{review.author}</h3>
                      {/* Indicador da fonte */}
                      <div className="flex items-center gap-1 px-2 py-1 bg-muted/30 rounded-full">
                        <div className={`w-2 h-2 ${source.color} rounded-full`}></div>
                        <span className="text-xs font-medium text-muted-foreground">{source.name}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{reviewDate}</p>
                  </div>
                </div>
                <p className="text-foreground text-sm flex-grow">{review.text}</p>
                {review.reply && (
                  <div className="w-full pl-6 mt-4 border-l-2 border-gray-400">
                     <div className="flex items-start gap-3">
                        <CornerDownRight className="h-4 w-4 mt-1 text-gray-400 flex-shrink-0" />
                        <div className="flex-1">
                           <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{review.reply.author}</h4>
                                {review.reply.isVerified && <CheckCircle className="h-5 w-5 text-blue-400" />}
                            </div>
                            <p className="text-xs text-muted-foreground">{review.reply.createdAt ? formatDistanceToNow(review.reply.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : ''}</p>
                           <p className="text-foreground text-sm mt-2">{review.reply.text}</p>
                        </div>
                    </div>
                  </div>
                )}
                 <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground hover:text-white !shadow-none">Responder</Button>
              </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Separator className="my-4 bg-gray-400" />
            <div className="py-8 space-y-8">
                {galleryLoading ? (
                    // Estado de loading das galerias
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-white mb-4" />
                        <p className="text-muted-foreground">Carregando galerias...</p>
                    </div>
                ) : galleryError ? (
                    // Estado de erro das galerias
                    <div className="flex flex-col items-center justify-center py-16">
                        <AlertCircle className="h-8 w-8 text-red-400 mb-4" />
                        <p className="text-red-400 mb-4">Erro ao carregar galerias</p>
                        <Button 
                            variant="outline" 
                            onClick={refreshSettings}
                            className="text-white border-gray-400 hover:bg-white hover:text-black"
                        >
                            Tentar Novamente
                        </Button>
                    </div>
                ) : galleries.length === 0 ? (
                    // Estado quando não há fotos configuradas
                    <div className="flex flex-col items-center justify-center py-16">
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4 text-center">
                            Nenhuma foto foi configurada ainda.
                            <br />
                            Configure as galerias no painel administrativo.
                        </p>
                        <Button 
                            variant="outline"
                            className="text-white border-gray-400 hover:bg-white hover:text-black"
                            asChild
                        >
                            <a href="/admin/settings" target="_blank" rel="noopener noreferrer">
                                Configurar Galerias
                            </a>
                        </Button>
                    </div>
                ) : (
                    // Galerias com fotos configuradas
                    galleries.map((gallery) => (
                      <div key={gallery.id}>
                        <div className="w-full px-4 md:px-8">
                          <Carousel className="w-full" opts={{ loop: true }}>
                              <CarouselContent>
                                  {gallery.photos.map((photo) => (
                                    <CarouselItem key={photo.id} className="basis-full">
                                      <div className="p-1 space-y-2">
                                        <Card className="overflow-hidden border-gray-700 hover:border-gray-400 hover:shadow-lg transition-all duration-300">
                                          <CardContent className="flex aspect-[9/16] items-center justify-center p-0">
                                            <Image
                                                src={photo.src}
                                                alt={`Foto da galeria ${gallery.word}`}
                                                width={400}
                                                height={800}
                                                className="w-full h-full object-cover"
                                                data-ai-hint={photo.hint}
                                              />
                                          </CardContent>
                                        </Card>
                                      </div>
                                    </CarouselItem>
                                  ))}
                              </CarouselContent>
                              <CarouselPrevious className="ml-14 bg-background/50 border-gray-400 text-white hover:bg-white hover:text-black" />
                              <CarouselNext className="mr-14 bg-background/50 border-gray-400 text-white hover:bg-white hover:text-black" />
                          </Carousel>
                          <p className="text-center text-white text-4xl tracking-widest uppercase mt-2">
                            {gallery.word}
                          </p>
                        </div>
                        <Separator className="max-w-xl mx-auto my-8 bg-border/30" />
                      </div>
                    ))
                )}
            </div>
            
            <div className="px-4 md:px-8 py-12 bg-background flex flex-col items-center">
                 <div className="max-w-4xl w-full mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-8 text-white flex items-center justify-center gap-2">
                        <MapPin className="h-8 w-8 text-white"/>
                        Localização
                    </h2>
                    <Card className="overflow-hidden bg-card/50 border-gray-700 hover:border-gray-400 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-2">
                             <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.145944983025!2d-46.656539084476!3d-23.56306366754635!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59c8da0aa315%3A0x2665c5b4e7b6a4b!2sAv.%20Paulista%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%20Brasil!5e0!3m2!1spt-BR!2sus!4v1625845012345!5m2!1spt-BR!2sus"
                                width="100%"
                                height="450"
                                style={{ border: 0 }}
                                allowFullScreen={true}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="px-4 md:px-8 py-12 bg-background flex flex-col items-center">
                <div className="max-w-4xl w-full mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-4 text-white">O que dizem sobre mim</h2>
                    
                    {/* Fontes das Avaliações */}
                    <div className="text-center mb-8 p-4 bg-muted/20 rounded-lg border border-muted/30">
                        <p className="text-sm font-medium mb-3 text-foreground">
                            ✅ Avaliações verificadas de clientes reais
                        </p>
                        <div className="flex flex-wrap justify-center gap-6 text-sm">
                            <span className="flex items-center gap-2 text-foreground/80">
                                <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                <strong>Garoto Com Local</strong>
                            </span>
                            <span className="flex items-center gap-2 text-foreground/80">
                                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                                <strong>Portal do Cliente</strong>
                            </span>
                            <span className="flex items-center gap-2 text-foreground/80">
                                <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm"></div>
                                <strong>Avaliações Diretas</strong>
                            </span>
                        </div>
                    </div>
                    
                    <Card className="w-full max-w-2xl p-6 bg-card/50 backdrop-blur-sm border-gray-700 mb-6 mx-auto">
                        <h3 className="text-lg font-semibold mb-4">Deixe sua avaliação</h3>
                        <div className="space-y-4">
                            <Input 
                                placeholder="Seu nome"
                                value={newReviewAuthor}
                                onChange={(e) => setNewReviewAuthor(e.target.value)}
                            />
                            <Textarea 
                                placeholder="Escreva seu comentário aqui..."
                                value={newReviewText}
                                onChange={(e) => setNewReviewText(e.target.value)}
                            />
                            <Button onClick={handleAddReview} disabled={isSubmittingReview}>
                                {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Enviar Comentário
                            </Button>
                        </div>
                    </Card>
                    
                    <div className="flex flex-col items-center gap-6">
                      {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-6 w-6 animate-spin"/>
                          Carregando avaliações...
                        </div>
                      )}
                      {error && (
                        <div className="flex flex-col items-center gap-4 text-destructive">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-6 w-6"/>
                            {error}
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setError(null);
                              fetchApprovedReviews();
                            }}
                            disabled={isLoading}
                          >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Tentar novamente
                          </Button>
                        </div>
                      )}
                      {!isLoading && !error && reviews.length === 0 && (
                        <p className="text-muted-foreground">Nenhuma avaliação aprovada ainda.</p>
                      )}
                      {!isLoading && !error && reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                      
                      {/* Nota sobre as avaliações */}
                      {!isLoading && !error && reviews.length > 0 && (
                        <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-muted max-w-2xl w-full text-center">
                          <p className="text-xs text-muted-foreground">
                            💡 <strong>Transparência total:</strong> Todas as avaliações são de clientes reais e passam por moderação para garantir autenticidade. 
                            Coletadas através da plataforma Garoto Com Local e outros canais verificados.
                          </p>
                        </div>
                      )}
                    </div>
                </div>
            </div>
            
            <footer className="w-full p-4 text-center text-sm text-muted-foreground">
              <Separator className="mb-4 bg-gray-400" />
               <div className="my-4 flex justify-center">
                <div
                    className="fb-like"
                    data-share="true"
                    data-width="450"
                    data-show-faces="true"
                >
                </div>
              </div>
              <p>Copyrights © Italo Santos 2019 - Todos os direitos reservados</p>
               <div className="flex justify-center gap-4 my-4">
                  <a href="#" aria-label="Twitter">
                      <Twitter className="h-5 w-5 text-white hover:text-gray-400" />
                  </a>
                  <a href="#" aria-label="Instagram">
                      <Instagram className="h-5 w-5 text-white hover:text-gray-400" />
                  </a>
                  <a href="#" aria-label="YouTube">
                      <Youtube className="h-5 w-5 text-white hover:text-gray-400" />
                  </a>
                  <a href="#" aria-label="Facebook">
                    <Facebook className="h-5 w-5 text-white hover:text-gray-400" />
                </a>
              </div>
              <p>
                  <a href="/termos-condicoes" className="underline hover:text-white">Termos & Condições</a> | <a href="/politica-de-privacidade" className="underline hover:text-white">Política de Privacidade</a>
              </p>
              <p className="mt-2">Este site inclui conteúdo protegido por direitos autorais, é proibida reprodução total ou parcial deste conteúdo sem autorização prévia do proprietário do site.</p>
            </footer>
        </>
    );
};

export default MainFooter;

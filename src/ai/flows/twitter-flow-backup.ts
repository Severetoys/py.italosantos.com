
'use server';
/**
 * @fileOverview Fluxo para buscar mídias (fotos e vídeos) de um perfil do Twitter, com cache e fallback entre APIs.
 * Este fluxo tenta primeiro a API oficial do X e, em caso de erro, usa APIs alternativas (RapidAPI).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    saveMultipleTwitterPhotos,
    getSavedPhotosFromUser,
    getPhotoStorageStats 
} from '@/services/twitter-photo-storage';

// Define o schema de entrada, que espera o nome de usuário do Twitter.
const TwitterMediaInputSchema = z.object({
  username: z.string().describe("O nome de usuário do Twitter para buscar as mídias."),
  maxResults: z.number().optional().default(100).describe("Número máximo de tweets a serem retornados."),
});
export type TwitterMediaInput = z.infer<typeof TwitterMediaInputSchema>;

// Define o schema de saída.
const TwitterMediaSchema = z.object({
    id: z.string(),
    text: z.string(),
    created_at: z.string().optional(),
    media: z.array(z.object({
        media_key: z.string(),
        type: z.enum(['photo', 'video', 'animated_gif']),
        url: z.string().optional(),
        preview_image_url: z.string().optional(),
        variants: z.any().optional(),
    })),
});

const TwitterMediaOutputSchema = z.object({
    tweets: z.array(TwitterMediaSchema),
});
export type TwitterMediaOutput = z.infer<typeof TwitterMediaOutputSchema>;
export type TweetWithMedia = z.infer<typeof TwitterMediaSchema>;


// Cache em memória com informações de rate limit (ECONOMIA MÁXIMA)
let cache = {
    data: null as TwitterMediaOutput | null,
    timestamp: 0, // Forçar nova busca
    rateLimitUntil: 0, // timestamp até quando estamos rate limited
};

// Cache de controle de requisições por usuário (prevenir requisições desnecessárias)
const userRequestCache = new Map<string, number>();
const USER_REQUEST_COOLDOWN = 5 * 60 * 1000; // 5 minutos para permitir testes

const CACHE_DURATION = {
    normal: 3 * 60 * 60 * 1000, // 3 HORAS normal (economia máxima)
    rateLimited: 6 * 60 * 60 * 1000, // 6 HORAS quando rate limited (economia máxima)
    extended: 12 * 60 * 60 * 1000, // 12 HORAS para cache estendido
};

// Função para verificar se estamos rate limited
const isRateLimited = () => cache.rateLimitUntil > Date.now();

// Função para marcar rate limit
const setRateLimit = (durationMinutes = 15) => {
    cache.rateLimitUntil = Date.now() + (durationMinutes * 60 * 1000);
};

// Função para obter duração do cache baseada no status
const getCacheDuration = () => {
    return isRateLimited() ? CACHE_DURATION.rateLimited : CACHE_DURATION.normal;
};

// Função para aguardar um tempo (sleep)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para tentar buscar dados via API oficial do X
async function fetchFromOfficialAPI(username: string, maxResults: number): Promise<TwitterMediaOutput> {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken || bearerToken === 'YOUR_TWITTER_BEARER_TOKEN') {
        throw new Error("TWITTER_BEARER_TOKEN não configurado");
    }

    const headers = { 'Authorization': `Bearer ${bearerToken}` };

    // 1. Obter o ID do usuário
    const userResponse = await fetchWithRetry(`https://api.twitter.com/2/users/by/username/${username}`, { headers });
    if (!userResponse.ok) {
        const errorText = await userResponse.text();
        let errorMessage;
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.errors && errorJson.errors[0]?.title === 'Not Found Entity') {
                errorMessage = `Usuário @${username} não encontrado na API oficial`;
            } else {
                errorMessage = errorJson.detail || errorJson.errors?.[0]?.detail || 'Erro na API oficial';
            }
        } catch {
            errorMessage = `Erro na API oficial: ${userResponse.status}`;
        }
        throw new Error(errorMessage);
    }

    const userData = await userResponse.json();
    const userId = userData.data.id;

    // 2. Buscar tweets com mídia
    const tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets`;
    const params = new URLSearchParams({
        'max_results': Math.max(5, Math.min(maxResults, 100)).toString(),
        'tweet.fields': 'created_at,attachments',
        'media.fields': 'media_key,type,url,preview_image_url,variants',
        'expansions': 'attachments.media_keys'
    });

    const tweetsResponse = await fetchWithRetry(`${tweetsUrl}?${params}`, { headers });
    if (!tweetsResponse.ok) {
        throw new Error(`Erro ao buscar tweets da API oficial: ${tweetsResponse.status}`);
    }

    const tweetsData = await tweetsResponse.json();
    return processTwitterData(tweetsData, username);
}

// Função para tentar buscar dados via RapidAPI (fallback)
async function fetchFromRapidAPI(username: string, maxResults: number): Promise<TwitterMediaOutput> {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
        throw new Error("RAPIDAPI_KEY não configurado");
    }

    const headers = {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST || 'twitter-api45.p.rapidapi.com'
    };

    try {
        // Usando endpoint específico para mídias do usuário
        const mediaResponse = await fetch(
            `https://twitter-api45.p.rapidapi.com/usermedia.php?screenname=${username}&count=${Math.max(5, Math.min(maxResults, 100))}`,
            { headers }
        );

        if (!mediaResponse.ok) {
            throw new Error(`RapidAPI erro ao buscar mídias: ${mediaResponse.status}`);
        }

        const mediaData = await mediaResponse.json();
        
        // Processar dados específicos desta API
        return processRapidAPIMediaData(mediaData, username);

    } catch (error: any) {
        throw new Error(`RapidAPI falhou: ${error.message}`);
    }
}

// Função específica para processar dados da RapidAPI User Media
function processRapidAPIMediaData(mediaData: any, username: string): TwitterMediaOutput {
    console.log('🔍 [DEBUG] Dados brutos da RapidAPI User Media:', JSON.stringify(mediaData, null, 2));
    
    // Esta API retorna diretamente posts com mídia
    let tweets = [];
    
    if (mediaData.timeline && Array.isArray(mediaData.timeline)) {
        tweets = mediaData.timeline;
        console.log(`📊 [DEBUG] Encontrados ${tweets.length} tweets na timeline`);
    } else if (Array.isArray(mediaData)) {
        tweets = mediaData;
        console.log(`📊 [DEBUG] Encontrados ${tweets.length} tweets no array direto`);
    } else if (mediaData.data && Array.isArray(mediaData.data)) {
        tweets = mediaData.data;
        console.log(`📊 [DEBUG] Encontrados ${tweets.length} tweets em data`);
    } else if (mediaData.tweets && Array.isArray(mediaData.tweets)) {
        tweets = mediaData.tweets;
        console.log(`📊 [DEBUG] Encontrados ${tweets.length} tweets em tweets`);
    } else {
        console.warn('⚠️ Formato de resposta da RapidAPI não reconhecido:', mediaData);
        return { tweets: [] };
    }

    const processedTweets = tweets
        .map((tweet: any, index: number) => {
            console.log(`🔍 [DEBUG] Processando tweet ${index + 1}:`, {
                id: tweet.id_str || tweet.id,
                hasMedia: !!(tweet.media || tweet.photos || tweet.videos),
                mediaCount: (tweet.media?.length || 0) + (tweet.photos?.length || 0) + (tweet.videos?.length || 0)
            });
            
            // Extrair mídia do tweet
            let media = [];
            
            console.log(`🔍 [DEBUG] Estrutura de mídia do tweet ${index + 1}:`, JSON.stringify(tweet.media, null, 2));
            
            // Processar estrutura real da RapidAPI: tweet.media = { video: [...], photo: [...] }
            if (tweet.media && typeof tweet.media === 'object') {
                console.log(`📹 [DEBUG] Tweet ${index + 1} tem objeto 'media'`);
                
                // Processar vídeos
                if (tweet.media.video && Array.isArray(tweet.media.video)) {
                    console.log(`📹 [DEBUG] Encontrados ${tweet.media.video.length} vídeos`);
                    const videoMedia = tweet.media.video.map((video: any, videoIndex: number) => {
                        console.log(`📹 [DEBUG] Vídeo ${videoIndex + 1}:`, JSON.stringify(video, null, 2));
                        return {
                            media_key: `video_${tweet.tweet_id || tweet.id}_${videoIndex}`,
                            type: 'video',
                            url: video.media_url_https || video.url,
                            preview_image_url: video.media_url_https || video.url,
                            variants: video.variants || video.video_info?.variants || []
                        };
                    });
                    media.push(...videoMedia);
                }
                
                // Processar fotos
                if (tweet.media.photo && Array.isArray(tweet.media.photo)) {
                    console.log(`📸 [DEBUG] Encontradas ${tweet.media.photo.length} fotos`);
                    const photoMedia = tweet.media.photo.map((photo: any, photoIndex: number) => ({
                        media_key: `photo_${tweet.tweet_id || tweet.id}_${photoIndex}`,
                        type: 'photo',
                        url: photo.media_url_https || photo.url,
                        preview_image_url: photo.media_url_https || photo.url
                    }));
                    media.push(...photoMedia);
                }
                
                // Processar animated_gif se existir
                if (tweet.media.animated_gif && Array.isArray(tweet.media.animated_gif)) {
                    console.log(`🎬 [DEBUG] Encontrados ${tweet.media.animated_gif.length} GIFs animados`);
                    const gifMedia = tweet.media.animated_gif.map((gif: any, gifIndex: number) => ({
                        media_key: `gif_${tweet.tweet_id || tweet.id}_${gifIndex}`,
                        type: 'animated_gif',
                        url: gif.media_url_https || gif.url,
                        preview_image_url: gif.media_url_https || gif.url,
                        variants: gif.variants || []
                    }));
                    media.push(...gifMedia);
                }
                
            } else if (tweet.media && Array.isArray(tweet.media)) {
                // Fallback para formato antigo (array direto)
                console.log(`📹 [DEBUG] Tweet ${index + 1} tem ${tweet.media.length} mídias no formato array`);
                media = tweet.media.map((m: any, mediaIndex: number) => {
                    const mediaType = m.type || (m.video_info ? 'video' : 'photo');
                    console.log(`📹 [DEBUG] Mídia ${mediaIndex + 1}: tipo=${mediaType}, url=${m.media_url_https || m.url || m.media_url}`);
                    return {
                        media_key: m.id || m.media_key || `media_${Date.now()}_${mediaIndex}`,
                        type: mediaType,
                        url: m.media_url_https || m.url || m.media_url,
                        preview_image_url: m.media_url_https || m.url || m.media_url,
                        variants: m.video_info?.variants || m.variants
                    };
                });
            } else if (tweet.photos && Array.isArray(tweet.photos)) {
                console.log(`📸 [DEBUG] Tweet ${index + 1} tem ${tweet.photos.length} fotos`);
                media = tweet.photos.map((photo: any, photoIndex: number) => ({
                    media_key: `photo_${Date.now()}_${photoIndex}`,
                    type: 'photo',
                    url: photo.url || photo,
                    preview_image_url: photo.url || photo
                }));
            } else if (tweet.videos && Array.isArray(tweet.videos)) {
                console.log(`📹 [DEBUG] Tweet ${index + 1} tem ${tweet.videos.length} vídeos`);
                media = tweet.videos.map((video: any, videoIndex: number) => ({
                    media_key: `video_${Date.now()}_${videoIndex}`,
                    type: 'video',
                    url: video.url || video,
                    preview_image_url: video.thumbnail || video.preview_image_url,
                    variants: video.variants
                }));
            } else {
                console.log(`❌ [DEBUG] Tweet ${index + 1} não tem mídia reconhecível`);
            }

            if (media.length === 0) {
                console.log(`⚠️ [DEBUG] Tweet ${index + 1} pulado - sem mídia válida`);
                return null;
            }

            console.log(`✅ [DEBUG] Tweet ${index + 1} processado com ${media.length} mídias`);
            return {
                id: tweet.id_str || tweet.id || `tweet_${Date.now()}`,
                text: tweet.full_text || tweet.text || '',
                created_at: tweet.created_at,
                username: username, // Adicionar username para backup
                media: media
            };
        })
        .filter(Boolean);

    console.log(`📊 [DEBUG] Resultado final: ${processedTweets.length} tweets com mídia processados`);
    return { tweets: processedTweets };
}

// Função específica para processar dados da RapidAPI (formato pode ser diferente)
function processRapidAPIData(timelineData: any, username: string): TwitterMediaOutput {
    console.log('Dados da RapidAPI:', timelineData);
    
    // Se tem timeline array diretamente
    let tweets = [];
    if (timelineData.timeline && Array.isArray(timelineData.timeline)) {
        tweets = timelineData.timeline;
    } else if (Array.isArray(timelineData)) {
        tweets = timelineData;
    } else if (timelineData.data && Array.isArray(timelineData.data)) {
        tweets = timelineData.data;
    }

    const tweetsWithMedia = tweets
        .filter((tweet: any) => {
            // Verificar se o tweet tem mídia (fotos, vídeos)
            return tweet.media_url || tweet.images || tweet.videos || 
                   (tweet.entities && (tweet.entities.media || tweet.entities.urls));
        })
        .map((tweet: any) => {
            const medias = [];
            
            // Tentar extrair mídia de diferentes formatos possíveis
            if (tweet.media_url) {
                medias.push({
                    media_key: tweet.tweet_id || tweet.id,
                    type: 'photo',
                    url: tweet.media_url,
                    preview_image_url: tweet.media_url
                });
            }
            
            if (tweet.images && Array.isArray(tweet.images)) {
                tweet.images.forEach((img: string, index: number) => {
                    medias.push({
                        media_key: `${tweet.tweet_id || tweet.id}_img_${index}`,
                        type: 'photo',
                        url: img,
                        preview_image_url: img
                    });
                });
            }
            
            if (tweet.videos && Array.isArray(tweet.videos)) {
                tweet.videos.forEach((video: any, index: number) => {
                    medias.push({
                        media_key: `${tweet.tweet_id || tweet.id}_vid_${index}`,
                        type: 'video',
                        url: video.url || video,
                        preview_image_url: video.thumbnail || video.preview_image_url
                    });
                });
            }

            return {
                id: tweet.tweet_id || tweet.id || Date.now().toString(),
                text: tweet.text || tweet.full_text || '',
                created_at: tweet.created_at || new Date().toISOString(),
                media: medias,
            };
        })
        .filter((tweet: any) => tweet.media.length > 0);

    return { tweets: tweetsWithMedia };
}

// Função para processar dados de qualquer API (formato padrão Twitter v2)
function processTwitterData(tweetsData: any, username: string = 'unknown'): TwitterMediaOutput {
    console.log('🔍 [DEBUG] Dados brutos da API oficial Twitter:', JSON.stringify(tweetsData, null, 2));
    
    if (!tweetsData.data || !Array.isArray(tweetsData.data)) {
        console.log('❌ [DEBUG] Dados da API oficial não têm formato esperado');
        return { tweets: [] };
    }

    console.log(`📊 [DEBUG] API oficial retornou ${tweetsData.data.length} tweets`);

    const mediaMap = new Map();
    if (tweetsData.includes?.media) {
        console.log(`📹 [DEBUG] Encontradas ${tweetsData.includes.media.length} mídias nos includes`);
        tweetsData.includes.media.forEach((media: any, index: number) => {
            console.log(`📹 [DEBUG] Mídia ${index + 1}: key=${media.media_key}, type=${media.type}, url=${media.url}`);
            mediaMap.set(media.media_key, media);
        });
    } else {
        console.log('❌ [DEBUG] Nenhuma mídia encontrada nos includes da API oficial');
    }

    const tweetsWithMedia = tweetsData.data
        .map((tweet: any, index: number) => {
            console.log(`🔍 [DEBUG] Processando tweet oficial ${index + 1}:`, {
                id: tweet.id,
                hasAttachments: !!tweet.attachments,
                mediaKeys: tweet.attachments?.media_keys
            });
            
            if (!tweet.attachments?.media_keys) {
                console.log(`⚠️ [DEBUG] Tweet oficial ${index + 1} não tem attachments ou media_keys`);
                return null;
            }

            const medias = tweet.attachments.media_keys
                .map((mediaKey: string, mediaIndex: number) => {
                    const media = mediaMap.get(mediaKey);
                    if (!media) {
                        console.log(`❌ [DEBUG] Mídia com key ${mediaKey} não encontrada no mapa`);
                        return null;
                    }

                    console.log(`✅ [DEBUG] Processando mídia ${mediaIndex + 1}: type=${media.type}, url=${media.url || media.preview_image_url}`);
                    return {
                        media_key: media.media_key,
                        type: media.type,
                        url: media.url || media.preview_image_url,
                        preview_image_url: media.preview_image_url,
                        variants: media.variants,
                    };
                })
                .filter(Boolean);

            if (medias.length === 0) {
                console.log(`⚠️ [DEBUG] Tweet oficial ${index + 1} pulado - sem mídias válidas`);
                return null;
            }

            console.log(`✅ [DEBUG] Tweet oficial ${index + 1} processado com ${medias.length} mídias`);
            return {
                id: tweet.id,
                text: tweet.text,
                created_at: tweet.created_at,
                username: username, // Adicionar username para backup
                media: medias,
            };
        })
        .filter(Boolean);

    console.log(`📊 [DEBUG] API oficial - Resultado final: ${tweetsWithMedia.length} tweets com mídia`);
    return { tweets: tweetsWithMedia };
}

// Função para fazer retry com exponential backoff
async function fetchWithRetry(url: string, options: any, maxRetries = 3): Promise<Response> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            
            // Se for rate limit (429), aguarda antes de tentar novamente
            if (response.status === 429) {
                if (attempt === maxRetries) {
                    throw new Error(`Too Many Requests - Rate limit atingido após ${maxRetries} tentativas`);
                }
                
                // Aguarda com backoff exponencial: 1s, 2s, 4s...
                const waitTime = Math.pow(2, attempt - 1) * 1000;
                console.log(`Rate limit detectado. Aguardando ${waitTime}ms antes da próxima tentativa...`);
                await sleep(waitTime);
                continue;
            }
            
            return response;
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Aguarda antes de tentar novamente em caso de erro de rede
            const waitTime = Math.pow(2, attempt - 1) * 1000;
            console.log(`Erro na tentativa ${attempt}. Aguardando ${waitTime}ms...`);
            await sleep(waitTime);
        }
    }
    
    throw new Error('Máximo de tentativas excedido');
}

/**
 * Fluxo Genkit que busca os tweets com mídia de um usuário do Twitter.
 */
const fetchTwitterMediaFlow = ai.defineFlow(
  {
    name: 'fetchTwitterMediaFlow',
    inputSchema: TwitterMediaInputSchema,
    outputSchema: TwitterMediaOutputSchema,
  },
  async ({ username, maxResults }) => {
    const now = Date.now();
    const cacheDuration = getCacheDuration();
    
    console.log(`🐦 [ECONOMIA MÁXIMA] Buscando mídia do Twitter para @${username}`);
    
    // CONTROLE ANTI-REQUISIÇÕES DESNECESSÁRIAS
    const userKey = username.toLowerCase();
    const lastUserRequest = userRequestCache.get(userKey);
    if (lastUserRequest && (now - lastUserRequest) < USER_REQUEST_COOLDOWN) {
        const cooldownRemaining = Math.round((USER_REQUEST_COOLDOWN - (now - lastUserRequest)) / 1000 / 60);
        console.log(`⏳ ECONOMIA: Aguarde ${cooldownRemaining} minutos para nova busca de @${username}`);
        
        // Retornar cache mesmo se expirado para economizar
        if (cache.data) {
            console.log(`🔄 ECONOMIA: Retornando cache para evitar API`);
            return cache.data;
        }
    }
    
    // Se temos dados no cache e ainda não expiraram, retorna do cache
    if (cache.data && (now - cache.timestamp < cacheDuration)) {
        const minutesLeft = Math.round((cache.timestamp + cacheDuration - now)/1000/60);
        const videosInCache = cache.data.tweets.reduce((count, tweet) => 
            count + tweet.media.filter(m => m.type === 'video').length, 0
        );
        console.log(`💾 ECONOMIA: Retornando dados do cache (válido por mais ${minutesLeft} minutos)`);
        console.log(`📊 CACHE: ${cache.data.tweets.length} tweets, ${videosInCache} vídeos`);
        userRequestCache.set(userKey, now);
        return cache.data;
    }
    
    // ECONOMIA EXTREMA: Se cache expirado mas recente, usar mesmo assim
    if (cache.data && (now - cache.timestamp < CACHE_DURATION.extended)) {
        const ageHours = Math.round((now - cache.timestamp) / 1000 / 60 / 60);
        console.log(`🔄 ECONOMIA EXTREMA: Usando cache de ${ageHours}h para evitar API`);
        userRequestCache.set(userKey, now);
        return cache.data;
    }
    
    // Se estamos rate limited, mas temos dados antigos, retorna eles
    if (isRateLimited() && cache.data) {
        console.log("⏳ RATE LIMIT: Retornando dados antigos do cache.");
        userRequestCache.set(userKey, now);
        return cache.data;
    }
    
    console.log("Cache do Twitter expirado ou vazio. Tentando buscar novos dados...");

    let result: TwitterMediaOutput | null = null;
    let lastError: string = '';

    // Tentativa 1: API Oficial do X
    try {
        console.log("Tentando API oficial do X...");
        result = await fetchFromOfficialAPI(username, maxResults);
        const videosFound = result.tweets.reduce((count, tweet) => 
            count + tweet.media.filter(m => m.type === 'video').length, 0
        );
        console.log(`✅ API oficial funcionou! Encontrados ${result.tweets.length} tweets com mídia (${videosFound} vídeos).`);
    } catch (error: any) {
        lastError = error.message;
        console.log(`❌ API oficial falhou: ${lastError}`);
        
        // Se for rate limit na API oficial, marca isso
        if (error.message?.includes('Too Many Requests') || error.message?.includes('Rate limit')) {
            setRateLimit(15);
        }
    }

    // Tentativa 2: RapidAPI (fallback)
    if (!result) {
        try {
            console.log("🔄 Tentando RapidAPI como fallback...");
            result = await fetchFromRapidAPI(username, maxResults);
            const videosFound = result.tweets.reduce((count, tweet) => 
                count + tweet.media.filter(m => m.type === 'video').length, 0
            );
            console.log(`✅ RapidAPI funcionou! Encontrados ${result.tweets.length} tweets com mídia (${videosFound} vídeos).`);
        } catch (error: any) {
            console.log(`❌ RapidAPI também falhou: ${error.message}`);
            lastError += ` | RapidAPI: ${error.message}`;
        }
    }

    // Se conseguiu dados de alguma API, atualiza o cache
    if (result) {
        cache = {
            data: result,
            timestamp: now,
            rateLimitUntil: 0, // Limpa o rate limit se conseguiu dados
        };
        
        // Marcar requisição do usuário para controle
        userRequestCache.set(userKey, now);
        console.log(`✅ ECONOMIA: Dados obtidos e cache atualizado para @${username}`);
        
        // 🔄 BACKUP AUTOMÁTICO: Salvar vídeos no Firebase Storage (mesma funcionalidade das fotos)
        if (result.tweets && result.tweets.length > 0) {
            try {
                console.log(`📹 BACKUP: Iniciando backup automático de ${result.tweets.length} vídeos do X...`);
                await saveMultipleTwitterPhotos(result.tweets);
                console.log(`✅ BACKUP: Vídeos salvos automaticamente no Firebase Storage!`);
            } catch (backupError) {
                console.warn(`⚠️ BACKUP: Erro ao salvar vídeos (não afeta o resultado principal):`, backupError);
            }
        }
        
        return result;
    }

    // Se ambas as APIs falharam, tenta retornar cache antigo
    if (cache.data) {
        console.warn("⚠️ ECONOMIA: APIs falharam, retornando dados antigos do cache.");
        userRequestCache.set(userKey, now);
        return cache.data;
    }

    // Se não tem nem cache, retorna erro
    throw new Error(`Todas as APIs falharam. API Oficial: ${lastError.split('|')[0] || 'erro desconhecido'}. RapidAPI: ${lastError.split('|')[1] || 'não testada'}.`);
  }
);


/**
 * Função exportada para ser chamada do lado do cliente.
 * Invoca o fluxo Genkit e retorna seu resultado.
 * Se username não for fornecido, usa o padrão do localStorage ou 'Severepics'
 */
export async function fetchTwitterFeed(input?: Partial<TwitterMediaInput>): Promise<TwitterMediaOutput> {
    // Se não foi fornecido username, tenta pegar do localStorage ou usa padrão
    let username = input?.username;
    
    if (!username && typeof window !== 'undefined') {
        username = localStorage.getItem('twitter_username') || 'Severepics';
    }
    
    if (!username) {
        username = 'Severepics'; // Fallback padrão
    }
    
    const finalInput: TwitterMediaInput = {
        username,
        maxResults: input?.maxResults || 100
    };
    
    return fetchTwitterMediaFlow(finalInput);
}

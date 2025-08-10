import { NextRequest, NextResponse } from 'next/server';
import { 
    getSavedPhotosFromUser, 
    getAllSavedPhotos, 
    getPhotoStorageStats,
    getPhotoByTweetId 
} from '@/services/twitter-photo-storage';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const tweetId = searchParams.get('tweetId');
        const mediaKey = searchParams.get('mediaKey');
        const action = searchParams.get('action') || 'list';
        const limit = parseInt(searchParams.get('limit') || '20');

        console.log(`📷 API Twitter Photos - Ação: ${action}, Username: ${username}, TweetId: ${tweetId}, Limit: ${limit}`);

        switch (action) {
            case 'user':
                if (!username) {
                    return NextResponse.json(
                        { error: 'Username é obrigatório para buscar fotos de usuário' },
                        { status: 400 }
                    );
                }
                const userPhotos = await getSavedPhotosFromUser(username, limit);
                return NextResponse.json({
                    success: true,
                    data: userPhotos,
                    count: userPhotos.length,
                    username: username,
                    limit: limit
                });

            case 'tweet':
                if (!tweetId || !mediaKey) {
                    return NextResponse.json(
                        { error: 'TweetId e MediaKey são obrigatórios para buscar foto específica' },
                        { status: 400 }
                    );
                }
                const tweetPhoto = await getPhotoByTweetId(tweetId, mediaKey);
                return NextResponse.json({
                    success: true,
                    data: tweetPhoto,
                    found: !!tweetPhoto
                });

            case 'stats':
                const stats = await getPhotoStorageStats();
                return NextResponse.json({
                    success: true,
                    data: stats
                });

            case 'all':
                const allPhotos = await getAllSavedPhotos(limit);
                return NextResponse.json({
                    success: true,
                    data: allPhotos,
                    count: allPhotos.length,
                    limit: limit
                });

            default:
                return NextResponse.json(
                    { error: 'Ação inválida. Use: user, tweet, stats ou all' },
                    { status: 400 }
                );
        }

    } catch (error: any) {
        console.error('❌ Erro na API Twitter Photos:', error);
        return NextResponse.json(
            { 
                error: 'Erro interno do servidor',
                message: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'backup':
                // Aqui poderia implementar um backup manual se necessário
                return NextResponse.json({
                    success: true,
                    message: 'Backup automático já está configurado no fluxo principal'
                });

            default:
                return NextResponse.json(
                    { error: 'Ação POST inválida' },
                    { status: 400 }
                );
        }

    } catch (error: any) {
        console.error('❌ Erro no POST da API Twitter Photos:', error);
        return NextResponse.json(
            { 
                error: 'Erro interno do servidor',
                message: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}

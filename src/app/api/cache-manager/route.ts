import { NextRequest, NextResponse } from 'next/server';
import { 
    getCacheStats, 
    cleanExpiredCaches, 
    listPermanentCaches 
} from '../../../services/twitter-cache';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'stats';

        switch (action) {
            case 'stats':
                const stats = await getCacheStats();
                return NextResponse.json({
                    success: true,
                    stats,
                    message: `Cache: ${stats.validCaches} válidos, ${stats.expiredCaches} expirados, ${stats.totalSizeKB}KB total`
                });

            case 'clean':
                await cleanExpiredCaches();
                const newStats = await getCacheStats();
                return NextResponse.json({
                    success: true,
                    stats: newStats,
                    message: 'Caches expirados removidos com sucesso'
                });

            case 'list':
                const caches = await listPermanentCaches();
                return NextResponse.json({
                    success: true,
                    caches,
                    count: caches.length,
                    message: `${caches.length} caches encontrados`
                });

            default:
                return NextResponse.json({
                    success: false,
                    message: 'Ação não reconhecida. Use: stats, clean, ou list'
                }, { status: 400 });
        }

    } catch (error: any) {
        console.error('❌ Erro na API de cache:', error.message);
        return NextResponse.json({
            success: false,
            error: error.message,
            message: 'Erro interno do servidor'
        }, { status: 500 });
    }
}

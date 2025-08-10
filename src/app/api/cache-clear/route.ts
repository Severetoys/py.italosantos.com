import { NextRequest, NextResponse } from 'next/server';
import { clearPermanentCache } from '@/services/twitter-cache';

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const mediaType = searchParams.get('mediaType') || 'photos';
        const maxResults = parseInt(searchParams.get('maxResults') || '100');

        if (!username) {
            return NextResponse.json(
                { error: 'Username é obrigatório' },
                { status: 400 }
            );
        }

        console.log(`🗑️ Limpando cache para @${username} (${mediaType})...`);
        await clearPermanentCache(username, mediaType, maxResults);

        return NextResponse.json({
            success: true,
            message: `Cache limpo para @${username}`,
            username,
            mediaType,
            maxResults
        });

    } catch (error: any) {
        console.error('❌ Erro ao limpar cache:', error);
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

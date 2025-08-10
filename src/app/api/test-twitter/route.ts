import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        console.log('🔧 Testando API do Twitter com Bearer Token...');
        
        // Verificar variáveis de ambiente
        const bearerToken = process.env.TWITTER_BEARER_TOKEN;
        
        console.log('Bearer Token presente:', !!bearerToken);
        console.log('Bearer Token começa com:', bearerToken?.substring(0, 20) + '...');
        
        if (!bearerToken) {
            return NextResponse.json({ error: 'Bearer Token não configurado' }, { status: 500 });
        }

        // URL para buscar dados do usuário
        const url = 'https://api.twitter.com/2/users/by/username/Severepics';
        
        console.log('Fazendo requisição para:', url);

        // Fazer a requisição
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json',
            },
        });

        const responseText = await response.text();
        
        console.log('Status da resposta:', response.status);
        console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));
        console.log('Corpo da resposta:', responseText);
        
        return NextResponse.json({
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseText,
            bearerTokenLength: bearerToken.length,
            bearerTokenStart: bearerToken.substring(0, 30) + '...'
        });

    } catch (error: any) {
        console.error('Erro no teste:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

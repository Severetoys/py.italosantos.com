import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET - Listar todo conteúdo VIP
export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({
        success: false,
        message: 'Erro interno do servidor'
      }, { status: 500 });
    }
    
    console.log('[VIP Content API] Buscando conteúdo VIP...');
    
    // Buscar todo o conteúdo (sem filtro na query para evitar erro de índice)
    const photosRef = adminDb.collection('photos');
    const videosRef = adminDb.collection('videos');
    
    const [photosSnapshot, videosSnapshot] = await Promise.all([
      photosRef.orderBy('createdAt', 'desc').get(),
      videosRef.orderBy('createdAt', 'desc').get()
    ]);
    
    // Combinar resultados e filtrar por folder='vip-content'
    const allContent = [
      ...photosSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      })),
      ...videosSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }))
    ];
    
    // Filtrar apenas conteúdo VIP (folder = 'vip-content')
    const content = allContent.filter(item => item.folder === 'vip-content');
    
    // Ordenar por data
    content.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log('[VIP Content API] Encontrados:', content.length, 'itens');
    
    return NextResponse.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('Erro ao buscar conteúdo VIP:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar conteúdo VIP'
    }, { status: 500 });
  }
}

// POST - Adicionar novo conteúdo VIP
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({
        success: false,
        message: 'Erro interno do servidor'
      }, { status: 500 });
    }
    
    const body = await request.json();
    const { title, description, type, url, thumbnailUrl, tags } = body;
    
    // Validação
    if (!title || !url || !type) {
      return NextResponse.json({
        success: false,
        message: 'Título, URL e tipo são obrigatórios'
      }, { status: 400 });
    }
    
    if (!['photo', 'video'].includes(type)) {
      return NextResponse.json({
        success: false,
        message: 'Tipo deve ser "photo" ou "video"'
      }, { status: 400 });
    }
    
    // Criar documento
    const vipContentData = {
      title: title.trim(),
      description: description?.trim() || '',
      type,
      url: url.trim(),
      thumbnailUrl: thumbnailUrl?.trim() || '',
      tags: Array.isArray(tags) ? tags : [],
      isActive: true,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const vipContentRef = adminDb.collection('vipContent');
    const docRef = await vipContentRef.add(vipContentData);
    
    return NextResponse.json({
      success: true,
      message: 'Conteúdo VIP adicionado com sucesso',
      id: docRef.id
    });
    
  } catch (error) {
    console.error('Erro ao adicionar conteúdo VIP:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao adicionar conteúdo VIP'
    }, { status: 500 });
  }
}

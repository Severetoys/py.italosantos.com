import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT - Atualizar conteúdo VIP
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
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
    
    // Verificar se adminDb está disponível
    if (!adminDb) {
      return NextResponse.json({
        error: 'Database connection not available'
      }, { status: 500 });
    }
    
    // Atualizar documento
    const docRef = adminDb.collection('vipContent').doc(id);
    const updateData = {
      title: title.trim(),
      description: description?.trim() || '',
      type,
      url: url.trim(),
      thumbnailUrl: thumbnailUrl?.trim() || '',
      tags: Array.isArray(tags) ? tags : [],
      updatedAt: new Date()
    };
    
    await docRef.update(updateData);
    
    return NextResponse.json({
      success: true,
      message: 'Conteúdo VIP atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar conteúdo VIP:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao atualizar conteúdo VIP'
    }, { status: 500 });
  }
}

// DELETE - Excluir conteúdo VIP
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Verificar se adminDb está disponível
    if (!adminDb) {
      return NextResponse.json({
        error: 'Database connection not available'
      }, { status: 500 });
    }
    
    console.log('[VIP Delete API] Tentando deletar ID:', id);
    
    // Primeiro tentar encontrar o documento nas coleções photos e videos
    let docRef = null;
    let collection = '';
    
    // Verificar na coleção photos
    const photoDoc = await adminDb.collection('photos').doc(id).get();
    if (photoDoc.exists) {
      docRef = adminDb.collection('photos').doc(id);
      collection = 'photos';
    } else {
      // Verificar na coleção videos
      const videoDoc = await adminDb.collection('videos').doc(id).get();
      if (videoDoc.exists) {
        docRef = adminDb.collection('videos').doc(id);
        collection = 'videos';
      }
    }
    
    if (!docRef) {
      // Se não encontrou nas coleções principais, tentar na vipContent (fallback)
      const vipDoc = await adminDb.collection('vipContent').doc(id).get();
      if (vipDoc.exists) {
        docRef = adminDb.collection('vipContent').doc(id);
        collection = 'vipContent';
      }
    }
    
    if (!docRef) {
      return NextResponse.json({
        success: false,
        message: 'Conteúdo não encontrado'
      }, { status: 404 });
    }
    
    console.log('[VIP Delete API] Deletando da coleção:', collection);
    await docRef.delete();
    
    return NextResponse.json({
      success: true,
      message: 'Conteúdo VIP excluído com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao excluir conteúdo VIP:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao excluir conteúdo VIP'
    }, { status: 500 });
  }
}

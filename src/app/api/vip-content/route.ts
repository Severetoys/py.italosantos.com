import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// GET - Buscar conteúdo VIP para assinantes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'photo', 'video', ou null para todos
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'userId é obrigatório'
      }, { status: 400 });
    }
    
    if (!adminDb) {
      return NextResponse.json({
        success: false,
        message: 'Erro interno do servidor'
      }, { status: 500 });
    }
    
    // Verificar se o usuário é um assinante ativo
    const subscribersRef = adminDb.collection('subscribers');
    const subscriberSnapshot = await subscribersRef
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();
    
    if (subscriberSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'Usuário não é um assinante ativo',
        requiresSubscription: true
      }, { status: 403 });
    }
    
    // Buscar conteúdo VIP ativo
    let vipContentQuery = adminDb.collection('vipContent')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc');
    
    // Filtrar por tipo se especificado
    if (type && ['photo', 'video'].includes(type)) {
      vipContentQuery = vipContentQuery.where('type', '==', type);
    }
    
    const contentSnapshot = await vipContentQuery.get();
    
    const content = contentSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      title: doc.data().title,
      description: doc.data().description,
      type: doc.data().type,
      url: doc.data().url,
      thumbnailUrl: doc.data().thumbnailUrl,
      tags: doc.data().tags || [],
      viewCount: doc.data().viewCount || 0,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }));
    
    return NextResponse.json({
      success: true,
      content,
      isSubscriber: true
    });
    
  } catch (error) {
    console.error('Erro ao buscar conteúdo VIP:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar conteúdo VIP'
    }, { status: 500 });
  }
}

// POST - Registrar visualização de conteúdo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, userId } = body;
    
    if (!contentId || !userId) {
      return NextResponse.json({
        success: false,
        message: 'contentId e userId são obrigatórios'
      }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({
        success: false,
        message: 'Erro interno do servidor'
      }, { status: 500 });
    }
    
    // Verificar se o usuário é um assinante ativo
    const subscribersRef = adminDb.collection('subscribers');
    const subscriberSnapshot = await subscribersRef
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();
    
    if (subscriberSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'Usuário não é um assinante ativo'
      }, { status: 403 });
    }
    
    // Incrementar contador de visualizações
    const contentRef = adminDb.collection('vipContent').doc(contentId);
    await contentRef.update({
      viewCount: FieldValue.increment(1)
    });
    
    // Opcional: Registrar visualização individual (para analytics)
    // const viewsRef = adminDb.collection('contentViews');
    // await viewsRef.add({
    //   contentId,
    //   userId,
    //   viewedAt: new Date()
    // });
    
    return NextResponse.json({
      success: true,
      message: 'Visualização registrada'
    });
    
  } catch (error) {
    console.error('Erro ao registrar visualização:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao registrar visualização'
    }, { status: 500 });
  }
}

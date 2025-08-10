import { NextRequest, NextResponse } from 'next/server';
import { airbnbService } from '@/services/airbnb-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;
    
    // Para desenvolvimento, buscar nos dados mockados
    const mockListings = airbnbService.getMockListings();
    const listing = mockListings.find(l => l.id === listingId);

    if (!listing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Propriedade não encontrada',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

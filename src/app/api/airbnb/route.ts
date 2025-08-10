import { NextRequest, NextResponse } from 'next/server';
import { airbnbService } from '@/services/airbnb-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      location: searchParams.get('location') || '',
      checkin: searchParams.get('checkin') || '',
      checkout: searchParams.get('checkout') || '',
      guests: parseInt(searchParams.get('guests') || '1'),
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      propertyType: searchParams.get('propertyType') || '',
      instantBook: searchParams.get('instantBook') === 'true',
    };

    // Para desenvolvimento, retornar dados mockados
    const mockListings = airbnbService.getMockListings();
    
    // Filtrar baseado nos parâmetros
    const filtered = mockListings.filter(listing => {
      if (params.location && 
          !listing.location.city.toLowerCase().includes(params.location.toLowerCase()) &&
          !listing.location.state.toLowerCase().includes(params.location.toLowerCase())) {
        return false;
      }
      if (params.guests && listing.maxGuests < params.guests) {
        return false;
      }
      if (params.minPrice && listing.price < params.minPrice) {
        return false;
      }
      if (params.maxPrice && listing.price > params.maxPrice) {
        return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      data: filtered,
      pagination: {
        page: 1,
        limit: 20,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / 20),
      },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Aqui você implementaria a lógica de booking
    // Por enquanto, retornamos sucesso mockado
    const bookingResult = {
      success: true,
      bookingId: `booking_${Date.now()}`,
      status: 'pending',
      message: 'Solicitação de reserva enviada com sucesso!',
      listing: body.listingId,
      checkin: body.checkin,
      checkout: body.checkout,
      guests: body.guests,
    };

    return NextResponse.json({
      success: true,
      data: bookingResult,
    });
  } catch (error) {
    console.error('Booking Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar reserva',
      },
      { status: 500 }
    );
  }
}

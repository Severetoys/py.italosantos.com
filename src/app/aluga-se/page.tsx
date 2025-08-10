
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, Star, Wifi, Car, Utensils, Tv, Wind, Home, Search, Heart } from 'lucide-react';
import { airbnbService } from '@/services/airbnb-service';
import { AirbnbListing, AirbnbSearchParams } from '@/types/airbnb';

export default function AlugaSePage() {
  const [listings, setListings] = useState<AirbnbListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<AirbnbSearchParams>({
    location: '',
    guests: 1,
  });
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    // Carregar dados mockados inicialmente
    setListings(airbnbService.getMockListings());
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Em produção, usar a API real
      // const result = await airbnbService.searchListings(searchParams);
      // if (result.success) {
      //   setListings(result.data);
      // }
      
      // Por enquanto, filtrar os dados mockados
      const mockData = airbnbService.getMockListings();
      const filtered = mockData.filter(listing => {
        if (searchParams.location && 
            !listing.location.city.toLowerCase().includes(searchParams.location.toLowerCase()) &&
            !listing.location.state.toLowerCase().includes(searchParams.location.toLowerCase())) {
          return false;
        }
        if (searchParams.guests && listing.maxGuests < searchParams.guests) {
          return false;
        }
        if (searchParams.minPrice && listing.price < searchParams.minPrice) {
          return false;
        }
        if (searchParams.maxPrice && listing.price > searchParams.maxPrice) {
          return false;
        }
        return true;
      });
      setListings(filtered);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (listingId: string) => {
    setFavorites(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className="w-4 h-4" />;
      case 'estacionamento':
      case 'car':
        return <Car className="w-4 h-4" />;
      case 'cozinha':
      case 'cozinha gourmet':
        return <Utensils className="w-4 h-4" />;
      case 'tv':
      case 'smart tv':
        return <Tv className="w-4 h-4" />;
      case 'ar condicionado':
        return <Wind className="w-4 h-4" />;
      default:
        return <Home className="w-4 h-4" />;
    }
  };

  return (
    <main className="flex flex-1 w-full flex-col items-center p-4 bg-background min-h-screen">
      <div className="w-full max-w-7xl space-y-6">
        {/* Header */}
        <Card className="animate-in fade-in-0 zoom-in-95 duration-500 shadow-neon-red-strong border-primary/50 bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-4xl text-primary text-shadow-neon-red-light text-center">
              🏠 Aluga-se - Encontre sua estadia perfeita
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Descubra acomodações únicas com integração Airbnb
            </p>
          </CardHeader>
        </Card>

        {/* Search Filters */}
        <Card className="bg-card/90 backdrop-blur-xl border-primary/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Localização</label>
                <Input
                  placeholder="Cidade ou região..."
                  value={searchParams.location || ''}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Check-in</label>
                <Input
                  type="date"
                  value={searchParams.checkin || ''}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, checkin: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Check-out</label>
                <Input
                  type="date"
                  value={searchParams.checkout || ''}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, checkout: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Hóspedes</label>
                <Select value={searchParams.guests?.toString()} onValueChange={(value) => setSearchParams(prev => ({ ...prev, guests: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hóspedes" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num} hóspede{num > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Ação</label>
                <Button 
                  onClick={handleSearch} 
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>
            
            {/* Price Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço mínimo (R$)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={searchParams.minPrice || ''}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, minPrice: parseInt(e.target.value) || undefined }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço máximo (R$)</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={searchParams.maxPrice || ''}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, maxPrice: parseInt(e.target.value) || undefined }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Counter */}
        <div className="text-center">
          <p className="text-muted-foreground">
            {listings.length} {listings.length === 1 ? 'propriedade encontrada' : 'propriedades encontradas'}
          </p>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Card key={listing.id} className="group hover:shadow-xl transition-all duration-300 border-primary/20 bg-card/90 backdrop-blur-xl overflow-hidden">
              <div className="relative">
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white"
                  onClick={() => toggleFavorite(listing.id)}
                >
                  <Heart 
                    className={`w-4 h-4 ${favorites.includes(listing.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                  />
                </Button>
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                  R$ {listing.price}/noite
                </div>
              </div>
              
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {listing.location.city}, {listing.location.state}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {listing.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{listing.bedrooms} quartos</span>
                    <span>{listing.bathrooms} banheiros</span>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {listing.maxGuests}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm font-medium">{listing.rating}</span>
                    <span className="ml-1 text-sm text-muted-foreground">({listing.reviewCount})</span>
                  </div>
                </div>
                
                {/* Amenities */}
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.slice(0, 4).map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="text-xs flex items-center gap-1">
                      {getAmenityIcon(amenity)}
                      {amenity}
                    </Badge>
                  ))}
                  {listing.amenities.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{listing.amenities.length - 4} mais
                    </Badge>
                  )}
                </div>
                
                {/* Host Info */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <img
                      src={listing.host.avatar}
                      alt={listing.host.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium">{listing.host.name}</p>
                      {listing.host.isSuperhost && (
                        <Badge variant="secondary" className="text-xs">Superhost</Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {listings.length === 0 && !loading && (
          <Card className="text-center p-12 bg-card/90 backdrop-blur-xl">
            <Home className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma propriedade encontrada</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros de busca para encontrar mais opções.
            </p>
          </Card>
        )}

        {/* API Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-blue-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm">
                <strong>Integração Airbnb:</strong> Esta página está configurada para usar a API do Airbnb via RapidAPI. 
                Para ativar dados reais, adicione sua chave da API nas variáveis de ambiente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

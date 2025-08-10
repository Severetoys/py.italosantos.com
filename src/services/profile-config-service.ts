import { ProfileSettings } from '@/app/admin/settings/actions';

export class ProfileConfigService {
  private static cache: ProfileSettings | null = null;
  private static lastFetch: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  static async getProfileSettings(): Promise<ProfileSettings | null> {
    // Verificar cache
    const now = Date.now();
    if (this.cache && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      const response = await fetch('/api/admin/profile-settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Sempre buscar dados frescos
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile settings');
      }

      const data = await response.json();
      
      // Atualizar cache
      this.cache = data;
      this.lastFetch = now;
      
      return data;
    } catch (error) {
      console.error('Error fetching profile settings:', error);
      return null;
    }
  }

  static async updateProfileSettings(settings: ProfileSettings): Promise<boolean> {
    try {
      const response = await fetch('/api/admin/profile-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // Limpar cache para forçar nova busca
        this.cache = null;
        this.lastFetch = 0;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating profile settings:', error);
      return false;
    }
  }

  static clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }

  // Métodos específicos para componentes do feed
  static async getGalleryPhotos(): Promise<string[]> {
    const settings = await this.getProfileSettings();
    return settings?.galleryPhotos?.map(photo => photo.url) || [];
  }

  static async getProfilePhoto(): Promise<string | null> {
    const settings = await this.getProfileSettings();
    return settings?.profilePictureUrl || null;
  }

  static async getCoverPhoto(): Promise<string | null> {
    const settings = await this.getProfileSettings();
    return settings?.coverPhotoUrl || null;
  }

  static async getProfileInfo(): Promise<Partial<ProfileSettings> | null> {
    const settings = await this.getProfileSettings();
    if (!settings) return null;

    return {
      name: settings.name,
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
    };
  }
}

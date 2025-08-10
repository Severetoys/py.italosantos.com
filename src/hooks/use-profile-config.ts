'use client';

import { useState, useEffect } from 'react';
import { ProfileSettings } from '@/app/admin/settings/actions';
import { ProfileConfigService } from '@/services/profile-config-service';

export function useProfileConfig() {
  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProfileConfigService.getProfileSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: ProfileSettings) => {
    try {
      const success = await ProfileConfigService.updateProfileSettings(newSettings);
      if (success) {
        setSettings(newSettings);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar configurações');
      return false;
    }
  };

  const refreshSettings = () => {
    ProfileConfigService.clearCache();
    loadSettings();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings,
    // Helpers específicos
    profilePhoto: settings?.profilePictureUrl || null,
    coverPhoto: settings?.coverPhotoUrl || null,
    galleryPhotos: settings?.galleryPhotos?.map(p => p.url) || [],
    profileInfo: settings ? {
      name: settings.name,
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
    } : null,
  };
}

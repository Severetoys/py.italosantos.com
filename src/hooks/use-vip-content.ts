import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';

interface VipContent {
  id: string;
  title: string;
  description: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  tags: string[];
  viewCount: number;
  createdAt: string;
}

interface UseVipContentReturn {
  content: VipContent[];
  loading: boolean;
  error: string | null;
  isSubscriber: boolean;
  requiresSubscription: boolean;
  refreshContent: () => Promise<void>;
  recordView: (contentId: string) => Promise<void>;
}

export function useVipContent(type?: 'photo' | 'video'): UseVipContentReturn {
  const { user } = useAuth();
  const [content, setContent] = useState<VipContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [requiresSubscription, setRequiresSubscription] = useState(false);

  const fetchContent = async () => {
    if (!user?.uid) {
      setLoading(false);
      setError('Usuário não autenticado');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        userId: user.uid
      });

      if (type) {
        params.append('type', type);
      }

      const response = await fetch(`/api/vip-content?${params}`);
      const data = await response.json();

      if (data.success) {
        setContent(data.content || []);
        setIsSubscriber(data.isSubscriber || false);
        setRequiresSubscription(false);
      } else {
        setError(data.message || 'Erro ao carregar conteúdo');
        setIsSubscriber(false);
        setRequiresSubscription(data.requiresSubscription || false);
        setContent([]);
      }
    } catch (err) {
      console.error('Erro ao buscar conteúdo VIP:', err);
      setError('Erro ao carregar conteúdo VIP');
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  const recordView = async (contentId: string) => {
    if (!user?.uid) return;

    try {
      await fetch('/api/vip-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          userId: user.uid,
        }),
      });
    } catch (err) {
      console.error('Erro ao registrar visualização:', err);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [user?.uid, type]);

  return {
    content,
    loading,
    error,
    isSubscriber,
    requiresSubscription,
    refreshContent: fetchContent,
    recordView,
  };
}

// Hook específico para fotos
export function useVipPhotos() {
  return useVipContent('photo');
}

// Hook específico para vídeos
export function useVipVideos() {
  return useVipContent('video');
}

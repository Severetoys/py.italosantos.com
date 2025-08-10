'use client';

import { useState, useEffect } from 'react';

interface SubscriberStatus {
  isSubscriber: boolean;
  isVip: boolean;
  isLoading: boolean;
  error: string | null;
  subscriber: {
    email: string;
    name?: string;
    planType: string;
    subscriptionEndDate: string;
    subscriptionStartDate: string;
    paymentMethod: string;
  } | null;
}

/**
 * Hook para verificar se um usuário é assinante ativo
 */
export function useSubscriberStatus(email?: string, userId?: string): SubscriberStatus {
  const [status, setStatus] = useState<SubscriberStatus>({
    isSubscriber: false,
    isVip: false,
    isLoading: true,
    error: null,
    subscriber: null
  });

  useEffect(() => {
    async function checkSubscriberStatus() {
      if (!email && !userId) {
        setStatus(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        setStatus(prev => ({ ...prev, isLoading: true, error: null }));

        const response = await fetch('/api/check-subscriber', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, userId }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus({
            isSubscriber: data.isSubscriber,
            isVip: data.isVip,
            isLoading: false,
            error: null,
            subscriber: data.subscriber
          });
        } else {
          setStatus(prev => ({
            ...prev,
            isLoading: false,
            error: data.message || 'Erro ao verificar status de assinante'
          }));
        }
      } catch (error) {
        console.error('[useSubscriberStatus] Erro:', error);
        setStatus(prev => ({
          ...prev,
          isLoading: false,
          error: 'Erro de conexão'
        }));
      }
    }

    checkSubscriberStatus();
  }, [email, userId]);

  return status;
}

/**
 * Hook simplificado que também verifica localStorage como fallback
 */
export function useSubscriberStatusWithFallback(email?: string, userId?: string): SubscriberStatus & { hasLocalSubscription: boolean } {
  const apiStatus = useSubscriberStatus(email, userId);
  const [hasLocalSubscription, setHasLocalSubscription] = useState(false);

  useEffect(() => {
    // Verificar localStorage como fallback
    const hasPaid = localStorage.getItem('hasPaid') === 'true';
    const hasSubscription = localStorage.getItem('hasSubscription') === 'true';
    const userType = localStorage.getItem('userType');
    
    setHasLocalSubscription(hasPaid || hasSubscription || userType === 'vip');
  }, []);

  return {
    ...apiStatus,
    // Se a API não conseguir verificar, usar localStorage como fallback
    isSubscriber: apiStatus.isSubscriber || (!apiStatus.isLoading && hasLocalSubscription),
    isVip: apiStatus.isVip || (!apiStatus.isLoading && hasLocalSubscription),
    hasLocalSubscription
  };
}

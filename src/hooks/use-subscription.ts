'use client';

import { useState, useEffect, useCallback } from 'react';
import { checkUserSubscription } from '@/app/admin/subscriptions/actions';
import { UserSubscription, SubscriptionPlan } from '@/lib/subscription-manager';

interface UseSubscriptionReturn {
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
  subscription: UserSubscription | null;
  plan: SubscriptionPlan | null;
  isLoading: boolean;
  error: string | null;
  checkSubscription: () => Promise<void>;
  logout: () => void;
}

export function useSubscription(): UseSubscriptionReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getUserId = useCallback(() => {
    // Tentar obter ID do usuário do localStorage
    return localStorage.getItem('userId') || localStorage.getItem('userEmail') || 'anonymous';
  }, []);

  const checkSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar autenticação básica (Face ID, etc.)
      const authStatus = localStorage.getItem('isAuthenticated') === 'true';
      const userEmail = localStorage.getItem('userEmail');
      
      setIsAuthenticated(authStatus);

      if (authStatus && userEmail) {
        // Definir cookie de autenticação para middleware
        document.cookie = `isAuthenticated=true; path=/; max-age=${30 * 24 * 60 * 60}`; // 30 dias
        
        // Verificar assinatura via nova API
        try {
          const response = await fetch('/api/subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'checkSubscription',
              customerEmail: userEmail
            })
          });

          const result = await response.json();
          
          if (result.success && result.hasActiveSubscription) {
            setHasActiveSubscription(true);
            
            // Definir cookie para middleware
            document.cookie = `hasSubscription=true; path=/; max-age=${30 * 24 * 60 * 60}`; // 30 dias
            
            const subscriptionData = result.subscription;
            setSubscription({
              id: subscriptionData.id,
              userId: userEmail,
              planId: 'monthly',
              email: userEmail,
              paymentId: subscriptionData.id,
              startDate: subscriptionData.paymentDate,
              endDate: subscriptionData.expirationDate,
              status: 'active' as const,
              paymentMethod: subscriptionData.paymentMethod as any,
              autoRenew: false,
              createdAt: subscriptionData.paymentDate,
              updatedAt: subscriptionData.paymentDate
            });
            
            setPlan({
              id: 'monthly',
              name: 'Assinatura Mensal',
              price: subscriptionData.amount || 99.00,
              duration: subscriptionData.planDuration || 30,
              features: [
                'Acesso total ao conteúdo exclusivo',
                'Downloads ilimitados',
                'Suporte dedicado',
                'Conteúdo em alta definição',
                `Acesso por ${subscriptionData.daysRemaining || 30} dias restantes`
              ]
            });
          } else {
            setHasActiveSubscription(false);
            setSubscription(null);
            setPlan(null);
            
            // Remover cookie de assinatura
            document.cookie = 'hasSubscription=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          }
        } catch (fetchError) {
          console.error('Erro ao consultar Firebase:', fetchError);
          
          // Fallback para dados locais em caso de erro de rede
          const hasSubscriptionStatus = localStorage.getItem('hasSubscription') === 'true';
          setHasActiveSubscription(hasSubscriptionStatus);
          setError('Não foi possível verificar assinatura no servidor');
        }
      } else {
        setHasActiveSubscription(false);
        setSubscription(null);
        setPlan(null);
        
        // Remover cookies de autenticação e assinatura
        document.cookie = 'isAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'hasSubscription=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      }
    } catch (err) {
      console.error('Erro ao verificar assinatura:', err);
      setError('Erro ao verificar status da assinatura');
      
      // Fallback para dados locais
      const hasSubscriptionStatus = localStorage.getItem('hasSubscription') === 'true';
      setHasActiveSubscription(hasSubscriptionStatus);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // Limpar todos os dados de autenticação e assinatura
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('hasPaid');
    localStorage.removeItem('hasSubscription');
    localStorage.removeItem('hasActiveSubscription');
    localStorage.removeItem('subscriptionData');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('customerEmail');
    
    // Remover cookies
    document.cookie = 'isAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'hasSubscription=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    
    setIsAuthenticated(false);
    setHasActiveSubscription(false);
    setSubscription(null);
    setPlan(null);
    setError(null);
  }, []);

  // Verificar status na montagem do componente
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Verificar periodicamente se a assinatura ainda está ativa
  useEffect(() => {
    if (!hasActiveSubscription) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 5 * 60 * 1000); // Verificar a cada 5 minutos

    return () => clearInterval(interval);
  }, [hasActiveSubscription, checkSubscription]);

  return {
    isAuthenticated,
    hasActiveSubscription,
    subscription,
    plan,
    isLoading,
    error,
    checkSubscription,
    logout
  };
}

// Hook simplificado para verificar apenas se tem acesso
export function useAccess() {
  const { isAuthenticated, hasActiveSubscription, isLoading } = useSubscription();
  
  return {
    hasAccess: isAuthenticated || hasActiveSubscription,
    isLoading
  };
}

import { adminApp } from '@/lib/firebase-admin';
import { getDatabase } from 'firebase-admin/database';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number; // em dias
  features: string[];
  popular?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  email: string;
  paymentId: string;
  paymentMethod: 'pix' | 'paypal' | 'mercadopago';
  status: 'active' | 'expired' | 'canceled' | 'pending';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

// Planos de assinatura disponíveis
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'daily',
    name: 'Acesso Diário',
    price: 2.90,
    duration: 1,
    features: [
      'Acesso completo por 24h',
      'Todos os vídeos em HD',
      'Chat direto por 24h'
    ]
  },
  {
    id: 'weekly',
    name: 'Acesso Semanal',
    price: 9.90,
    duration: 7,
    features: [
      'Acesso completo por 7 dias',
      'Todos os vídeos em HD',
      'Chat direto',
      'Conteúdo exclusivo da semana'
    ]
  },
  {
    id: 'monthly',
    name: 'Assinatura Mensal',
    price: 29.90,
    duration: 30,
    features: [
      'Acesso completo por 30 dias',
      'Todos os vídeos em HD',
      'Chat direto ilimitado',
      'Conteúdo exclusivo',
      'Suporte prioritário'
    ],
    popular: true
  },
  {
    id: 'quarterly',
    name: 'Assinatura Trimestral',
    price: 79.90,
    duration: 90,
    features: [
      'Acesso completo por 90 dias',
      'Todos os vídeos em HD',
      'Chat direto ilimitado',
      'Conteúdo exclusivo',
      'Suporte prioritário',
      '20% de desconto'
    ]
  }
];

class SubscriptionManager {
  private db = adminApp ? getDatabase(adminApp) : null;

  /**
   * Cria uma nova assinatura
   */
  async createSubscription(subscriptionData: Omit<UserSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!this.db) {
      throw new Error('Firebase Admin não disponível');
    }

    const subscriptionsRef = this.db.ref('subscriptions');
    const newSubscriptionRef = subscriptionsRef.push();
    const subscriptionId = newSubscriptionRef.key!;

    const subscription: UserSubscription = {
      ...subscriptionData,
      id: subscriptionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await newSubscriptionRef.set(subscription);
    
    // Atualizar índice por usuário
    await this.db.ref(`users/${subscriptionData.userId}/subscription`).set(subscriptionId);
    
    return subscriptionId;
  }

  /**
   * Verifica se uma assinatura está ativa
   */
  async isSubscriptionActive(userId: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const userRef = this.db.ref(`users/${userId}/subscription`);
      const snapshot = await userRef.once('value');
      const subscriptionId = snapshot.val();

      if (!subscriptionId) return false;

      const subscriptionRef = this.db.ref(`subscriptions/${subscriptionId}`);
      const subscriptionSnapshot = await subscriptionRef.once('value');
      const subscription = subscriptionSnapshot.val() as UserSubscription;

      if (!subscription) return false;

      const now = new Date();
      const endDate = new Date(subscription.endDate);

      const isActive = subscription.status === 'active' && endDate > now;

      // Auto-expirar se necessário
      if (!isActive && subscription.status === 'active') {
        await this.updateSubscriptionStatus(subscriptionId, 'expired');
      }

      return isActive;
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      return false;
    }
  }

  /**
   * Busca assinatura ativa de um usuário
   */
  async getUserActiveSubscription(userId: string): Promise<UserSubscription | null> {
    if (!this.db) return null;

    try {
      const userRef = this.db.ref(`users/${userId}/subscription`);
      const snapshot = await userRef.once('value');
      const subscriptionId = snapshot.val();

      if (!subscriptionId) return null;

      const subscriptionRef = this.db.ref(`subscriptions/${subscriptionId}`);
      const subscriptionSnapshot = await subscriptionRef.once('value');
      const subscription = subscriptionSnapshot.val() as UserSubscription;

      if (!subscription) return null;

      // Verificar se está ativa
      const now = new Date();
      const endDate = new Date(subscription.endDate);

      if (subscription.status === 'active' && endDate > now) {
        return subscription;
      }

      // Auto-expirar se necessário
      if (subscription.status === 'active') {
        await this.updateSubscriptionStatus(subscriptionId, 'expired');
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error);
      return null;
    }
  }

  /**
   * Lista todas as assinaturas (para admin)
   */
  async getAllSubscriptions(): Promise<UserSubscription[]> {
    if (!this.db) return [];

    try {
      const subscriptionsRef = this.db.ref('subscriptions');
      const snapshot = await subscriptionsRef.once('value');
      const subscriptions = snapshot.val();

      if (!subscriptions) return [];

      return Object.values(subscriptions) as UserSubscription[];
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      return [];
    }
  }

  /**
   * Atualiza status de uma assinatura
   */
  async updateSubscriptionStatus(subscriptionId: string, status: UserSubscription['status']): Promise<void> {
    if (!this.db) return;

    await this.db.ref(`subscriptions/${subscriptionId}`).update({
      status,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.updateSubscriptionStatus(subscriptionId, 'canceled');
  }

  /**
   * Calcula data de expiração baseada no plano
   */
  calculateEndDate(planId: string, startDate: Date = new Date()): Date {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) throw new Error('Plano não encontrado');

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration);
    return endDate;
  }

  /**
   * Processa pagamento e cria assinatura
   */
  async processPaymentAndCreateSubscription(data: {
    userId: string;
    email: string;
    planId: string;
    paymentId: string;
    paymentMethod: UserSubscription['paymentMethod'];
  }): Promise<string> {
    const { userId, email, planId, paymentId, paymentMethod } = data;

    const startDate = new Date();
    const endDate = this.calculateEndDate(planId, startDate);

    const subscriptionId = await this.createSubscription({
      userId,
      planId,
      email,
      paymentId,
      paymentMethod,
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: false
    });

    return subscriptionId;
  }

  /**
   * Cleanup de assinaturas expiradas (executar periodicamente)
   */
  async cleanupExpiredSubscriptions(): Promise<number> {
    if (!this.db) return 0;

    try {
      const subscriptionsRef = this.db.ref('subscriptions');
      const snapshot = await subscriptionsRef.orderByChild('status').equalTo('active').once('value');
      const subscriptions = snapshot.val();

      if (!subscriptions) return 0;

      const now = new Date();
      let expiredCount = 0;

      for (const [id, subscription] of Object.entries(subscriptions) as [string, UserSubscription][]) {
        const endDate = new Date(subscription.endDate);
        
        if (endDate <= now) {
          await this.updateSubscriptionStatus(id, 'expired');
          expiredCount++;
        }
      }

      return expiredCount;
    } catch (error) {
      console.error('Erro no cleanup de assinaturas:', error);
      return 0;
    }
  }
}

export const subscriptionManager = new SubscriptionManager();

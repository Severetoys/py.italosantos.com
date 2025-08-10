'use server'

import { subscriptionManager, SUBSCRIPTION_PLANS } from '@/lib/subscription-manager';

export async function createSubscription(data: {
  userId: string;
  email: string;
  planId: string;
  paymentId: string;
  paymentMethod: 'pix' | 'paypal' | 'mercadopago';
}) {
  try {
    const subscriptionId = await subscriptionManager.processPaymentAndCreateSubscription(data);
    return { success: true, subscriptionId };
  } catch (error: any) {
    console.error('Erro ao criar assinatura:', error);
    return { success: false, error: error.message };
  }
}

export async function checkUserSubscription(userId: string) {
  try {
    const isActive = await subscriptionManager.isSubscriptionActive(userId);
    const subscription = isActive ? await subscriptionManager.getUserActiveSubscription(userId) : null;
    
    return { 
      success: true, 
      isActive, 
      subscription,
      plan: subscription ? SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId) : null
    };
  } catch (error: any) {
    console.error('Erro ao verificar assinatura:', error);
    return { success: false, error: error.message };
  }
}

export async function cancelUserSubscription(subscriptionId: string) {
  try {
    await subscriptionManager.cancelSubscription(subscriptionId);
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao cancelar assinatura:', error);
    return { success: false, error: error.message };
  }
}

export async function getAllSubscriptionsAdmin() {
  try {
    const subscriptions = await subscriptionManager.getAllSubscriptions();
    const subscriptionsWithPlans = subscriptions.map(sub => ({
      ...sub,
      plan: SUBSCRIPTION_PLANS.find(p => p.id === sub.planId)
    }));
    
    return { success: true, subscriptions: subscriptionsWithPlans };
  } catch (error: any) {
    console.error('Erro ao buscar assinaturas:', error);
    return { success: false, error: error.message };
  }
}

export async function cleanupExpiredSubscriptions() {
  try {
    const cleanupCount = await subscriptionManager.cleanupExpiredSubscriptions();
    return { success: true, cleanupCount };
  } catch (error: any) {
    console.error('Erro no cleanup:', error);
    return { success: false, error: error.message };
  }
}

export { SUBSCRIPTION_PLANS };

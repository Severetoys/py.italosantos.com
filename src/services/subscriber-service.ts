'use server';

import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { cert } from 'firebase-admin/app';
import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// SEGURANÇA: Usando variáveis de ambiente em vez de arquivo JSON
const getServiceAccountFromEnv = () => {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is required');
  }
  
  try {
    return JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  } catch (error) {
    throw new Error('Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS_JSON');
  }
};

// Configuração do Firebase Admin
let adminApp: any = null;

try {
  if (!admin.apps.length) {
    const serviceAccount = getServiceAccountFromEnv();
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
      databaseURL: "https://authkit-y9vjx-default-rtdb.firebaseio.com",
      storageBucket: "authkit-y9vjx.firebasestorage.app"
    });
  } else {
    adminApp = admin.app();
  }
  console.log('[Subscriber Service] Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('[Subscriber Service] Failed to initialize Firebase Admin SDK:', error);
}

const db = adminApp ? getFirestore(adminApp) : null;

export interface SubscriberData {
  userId: string;
  email: string;
  name?: string;
  phone?: string;
  paymentMethod: 'paypal' | 'pix' | 'mercadopago' | 'google-pay' | 'apple-pay';
  paymentId: string;
  amount: number;
  currency: string;
  planType: 'monthly' | 'yearly' | 'lifetime';
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  isActive: boolean;
  isVip: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
  };
}

export interface PaymentDetails {
  paymentId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  customerEmail: string;
  customerName?: string;
  timestamp: string;
}

/**
 * Salva um novo assinante no Firestore após pagamento bem-sucedido
 */
export async function saveSubscriber(subscriberData: SubscriberData): Promise<string> {
  if (!db) {
    throw new Error('Firebase Admin não está disponível');
  }

  try {
    // Salvar na coleção 'subscribers'
    const subscriberRef = await db.collection('subscribers').add({
      ...subscriberData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Salvar também na coleção 'users' para compatibilidade
    await db.collection('users').doc(subscriberData.userId).set({
      email: subscriberData.email,
      name: subscriberData.name,
      phone: subscriberData.phone,
      isSubscriber: true,
      isVip: subscriberData.isVip,
      subscriptionType: subscriberData.planType,
      subscriberId: subscriberRef.id,
      lastPaymentDate: subscriberData.createdAt,
      paymentMethod: subscriberData.paymentMethod
    }, { merge: true });

    console.log(`[Subscriber Service] Assinante salvo com sucesso: ${subscriberRef.id}`);
    return subscriberRef.id;
  } catch (error) {
    console.error('[Subscriber Service] Erro ao salvar assinante:', error);
    throw error;
  }
}

/**
 * Verifica se um usuário é assinante ativo
 */
export async function isActiveSubscriber(userId: string): Promise<boolean> {
  if (!db) {
    return false;
  }

  try {
    const snapshot = await db
      .collection('subscribers')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .where('subscriptionEndDate', '>', new Date().toISOString())
      .limit(1)
      .get();

    return !snapshot.empty;
  } catch (error) {
    console.error('[Subscriber Service] Erro ao verificar assinante:', error);
    return false;
  }
}

/**
 * Obtém dados do assinante por email
 */
export async function getSubscriberByEmail(email: string): Promise<SubscriberData | null> {
  if (!db) {
    return null;
  }

  try {
    const snapshot = await db
      .collection('subscribers')
      .where('email', '==', email)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as unknown as SubscriberData;
  } catch (error) {
    console.error('[Subscriber Service] Erro ao buscar assinante por email:', error);
    return null;
  }
}

/**
 * Atualiza status de assinante (para cancelamentos/renovações)
 */
export async function updateSubscriberStatus(subscriberId: string, isActive: boolean): Promise<void> {
  if (!db) {
    throw new Error('Firebase Admin não está disponível');
  }

  try {
    await db.collection('subscribers').doc(subscriberId).update({
      isActive,
      updatedAt: new Date().toISOString()
    });

    console.log(`[Subscriber Service] Status do assinante ${subscriberId} atualizado para: ${isActive}`);
  } catch (error) {
    console.error('[Subscriber Service] Erro ao atualizar status:', error);
    throw error;
  }
}

/**
 * Salva detalhes de pagamento (para auditoria)
 */
export async function savePaymentDetails(paymentDetails: PaymentDetails): Promise<string> {
  if (!db) {
    throw new Error('Firebase Admin não está disponível');
  }

  try {
    const paymentRef = await db.collection('payments').add({
      ...paymentDetails,
      createdAt: new Date().toISOString()
    });

    console.log(`[Subscriber Service] Detalhes de pagamento salvos: ${paymentRef.id}`);
    return paymentRef.id;
  } catch (error) {
    console.error('[Subscriber Service] Erro ao salvar pagamento:', error);
    throw error;
  }
}

/**
 * Processa pagamento e cria assinatura automaticamente
 */
export async function processPaymentAndCreateSubscription(
  userEmail: string,
  paymentId: string,
  amount: number,
  currency: string,
  paymentMethod: string,
  userName?: string,
  userPhone?: string
): Promise<string> {
  
  // Calcular data de expiração (1 mês)
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  // Gerar ID único para o usuário se não existir
  const userId = `user_${Date.now()}_${paymentId}`;

  const subscriberData: SubscriberData = {
    userId,
    email: userEmail,
    name: userName,
    phone: userPhone,
    paymentMethod: paymentMethod as any,
    paymentId,
    amount,
    currency,
    planType: 'monthly',
    subscriptionStartDate: startDate.toISOString(),
    subscriptionEndDate: endDate.toISOString(),
    isActive: true,
    isVip: true, // Todos os pagantes viram VIP
    createdAt: startDate.toISOString(),
    updatedAt: startDate.toISOString(),
    metadata: {
      userAgent: 'Web Payment'
    }
  };

  // Salvar assinante
  const subscriberId = await saveSubscriber(subscriberData);

  // Salvar detalhes do pagamento
  await savePaymentDetails({
    paymentId,
    amount,
    currency,
    paymentMethod,
    customerEmail: userEmail,
    customerName: userName,
    timestamp: startDate.toISOString()
  });

  return subscriberId;
}

/**
 * Obtém todos os assinantes ativos (para admin)
 */
export async function getAllActiveSubscribers(): Promise<SubscriberData[]> {
  if (!db) {
    return [];
  }

  try {
    const snapshot = await db
      .collection('subscribers')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as SubscriberData));
  } catch (error) {
    console.error('[Subscriber Service] Erro ao buscar assinantes:', error);
    return [];
  }
}

/**
 * Limpa assinaturas expiradas
 */
export async function cleanupExpiredSubscriptions(): Promise<number> {
  if (!db) {
    return 0;
  }

  try {
    const now = new Date().toISOString();
    const snapshot = await db
      .collection('subscribers')
      .where('subscriptionEndDate', '<', now)
      .where('isActive', '==', true)
      .get();

    let updatedCount = 0;
    const batch = db.batch();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        isActive: false, 
        updatedAt: new Date().toISOString() 
      });
      updatedCount++;
    });

    await batch.commit();
    console.log(`[Subscriber Service] ${updatedCount} assinaturas expiradas foram desativadas`);
    
    return updatedCount;
  } catch (error) {
    console.error('[Subscriber Service] Erro ao limpar assinaturas expiradas:', error);
    return 0;
  }
}

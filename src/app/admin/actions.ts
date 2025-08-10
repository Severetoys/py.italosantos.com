
'use server';
/**
 * @fileOverview Server-side actions for the admin dashboard.
 */

import { adminApp } from '@/lib/firebase-admin';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';
import { db as clientDb } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp, orderBy, limit } from 'firebase/firestore';

// Use admin SDK if available, otherwise fallback to client SDK
const db = adminApp ? getDatabase(adminApp) : null;
const firestore = adminApp ? getFirestore(adminApp) : null;

// Cache para evitar consultas desnecessárias
let statsCache: { data: DashboardStats; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

interface DashboardStats {
  totalSubscribers: number;
  totalConversations: number;
  totalProducts: number;
  pendingReviews: number;
}

interface TopPage {
  id: string;
  path: string;
  count: number;
}

/**
 * Retrieves statistics for the admin dashboard.
 * @returns A promise that resolves with the dashboard statistics.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  // Check cache first
  if (statsCache && Date.now() - statsCache.timestamp < CACHE_DURATION) {
    return statsCache.data;
  }

  try {
    let totalSubscribers = 0;
    let totalConversations = 0;
    let totalProducts = 0;
    let pendingReviews = 0;

    // Get total subscribers - try admin SDK first, fallback to client SDK
    if (db) {
      const subscribersRef = db.ref('facialAuth/users');
      const subscribersSnapshot = await subscribersRef.once('value');
      totalSubscribers = subscribersSnapshot.exists() ? subscribersSnapshot.numChildren() : 0;
    } else {
      console.log('[Dashboard] Using client SDK for subscribers count (limited functionality)');
      totalSubscribers = 0; // Client SDK can't access Realtime Database server-side
    }

    // Get active conversations from Firestore
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (firestore) {
      // Using Admin SDK
      try {
        const recentChatsSnapshot = await firestore
          .collection('chats')
          .where('createdAt', '>=', sevenDaysAgo)
          .count()
          .get();
        
        totalConversations = recentChatsSnapshot.data().count;
        console.log(`Found ${totalConversations} active conversations in the last 7 days`);
      } catch (error) {
        console.error("Error counting active conversations:", error);
        try {
          const allChatsSnapshot = await firestore.collection('chats').count().get();
          totalConversations = allChatsSnapshot.data().count;
          console.log(`Fallback: counting all ${totalConversations} chats`);
        } catch (fallbackError) {
          console.error("Error in fallback chat count:", fallbackError);
          totalConversations = 0;
        }
      }

      // Get total products from Firestore
      try {
        const productsSnapshot = await firestore.collection('products').count().get();
        totalProducts = productsSnapshot.data().count;
      } catch (error) {
        console.error("Error counting products:", error);
        totalProducts = 0;
      }

      // Get pending reviews from Firestore
      try {
        const pendingReviewsSnapshot = await firestore.collection('reviews').where('status', '==', 'pending').count().get();
        pendingReviews = pendingReviewsSnapshot.data().count;
      } catch (error) {
        console.error("Error counting pending reviews:", error);
        pendingReviews = 0;
      }
    } else {
      // Fallback to client SDK (server actions with client SDK)
      console.log('[Dashboard] Using client SDK fallback');
      try {
        // Count chats using client SDK
        const chatsSnapshot = await getDocs(collection(clientDb, 'chats'));
        totalConversations = chatsSnapshot.size;

        // Count products using client SDK
        const productsSnapshot = await getDocs(collection(clientDb, 'products'));
        totalProducts = productsSnapshot.size;

        // Count pending reviews using client SDK
        const reviewsQuery = query(collection(clientDb, 'reviews'), where('status', '==', 'pending'));
        const pendingReviewsSnapshot = await getDocs(reviewsQuery);
        pendingReviews = pendingReviewsSnapshot.size;
      } catch (error) {
        console.error("Error with client SDK fallback:", error);
        totalConversations = 0;
        totalProducts = 0;
        pendingReviews = 0;
      }
    }

    const stats = {
      totalSubscribers,
      totalConversations,
      totalProducts,
      pendingReviews,
    };

    // Update cache
    statsCache = {
      data: stats,
      timestamp: Date.now()
    };

    return stats;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    // Return zeroed stats on error to prevent crashing the dashboard
    const fallbackStats = {
      totalSubscribers: 0,
      totalConversations: 0,
      totalProducts: 0,
      pendingReviews: 0,
    };

    // Cache fallback stats for a shorter period
    statsCache = {
      data: fallbackStats,
      timestamp: Date.now()
    };

    return fallbackStats;
  }
}

/**
 * Invalidates the dashboard stats cache
 */
export async function invalidateStatsCache(): Promise<void> {
  statsCache = null;
}

/**
 * Retrieves the top 3 most accessed pages from the 'pageViews' collection.
 * @returns A promise that resolves with an array of top pages.
 */
export async function getTopPages(): Promise<TopPage[]> {
    try {
        if (firestore) {
            // Using Admin SDK
            const pageViewsRef = firestore.collection('pageViews');
            const q = pageViewsRef.orderBy('count', 'desc').limit(3);
            const querySnapshot = await q.get();

            if (querySnapshot.empty) {
                return [];
            }

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                path: doc.data().path,
                count: doc.data().count
            }));
        } else {
            // Fallback to client SDK
            console.log('[Dashboard] Using client SDK for page views');
            const pageViewsQuery = query(
                collection(clientDb, 'pageViews'), 
                orderBy('count', 'desc'), 
                limit(3)
            );
            const querySnapshot = await getDocs(pageViewsQuery);

            if (querySnapshot.empty) {
                return [];
            }

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                path: doc.data().path,
                count: doc.data().count
            }));
        }
    } catch (error) {
        console.error("Error fetching top pages:", error);
        return [];
    }
}

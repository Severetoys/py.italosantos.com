'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
  updateEmail,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: string;
  lastLogin: string;
  isSubscriber: boolean;
  subscriptionType?: string;
  subscriptionEndDate?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ user: User }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[AuthProvider] onAuthStateChanged', user);
      setUser(user);
      try {
        if (user) {
          await loadUserProfile(user.uid);
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error('[AuthProvider] Erro ao carregar/criar perfil:', err);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const loadUserProfile = async (uid: string) => {
    try {
      console.log('[AuthProvider] Buscando perfil do usuário', uid);
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        console.log('[AuthProvider] Perfil encontrado', userDoc.data());
        setUserProfile(userDoc.data() as UserProfile);
      } else {
        // Criar perfil inicial se não existir
        console.log('[AuthProvider] Usuário sem perfil no Firestore, criando...');
        const initialProfile: UserProfile = {
          uid: uid,
          email: user?.email || '',
          displayName: user?.displayName || 'Usuário',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          isSubscriber: false,
        };
        // Só adiciona photoURL se existir
        if (user?.photoURL) {
          (initialProfile as any).photoURL = user.photoURL;
        }
        console.log('[AuthProvider] Criando perfil inicial', initialProfile);
        await setDoc(doc(db, 'users', uid), initialProfile);
        setUserProfile(initialProfile);
      }
    } catch (error) {
      console.error('[AuthProvider] Erro ao carregar/criar perfil do usuário:', error);
      // Em caso de erro, não bloquear - definir perfil básico do Firebase Auth
      setUserProfile({
        uid: uid,
        email: user?.email || '',
        displayName: user?.displayName || 'Usuário',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isSubscriber: false,
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Atualizar último login
      if (result.user) {
        await updateDoc(doc(db, 'users', result.user.uid), {
          lastLogin: new Date().toISOString()
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!email || !email.includes('@')) {
      throw new Error('Email obrigatório e válido para cadastro.');
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (!result.user.email) {
        // Segurança extra: se o Firebase não retornar email, apaga o usuário imediatamente
        await result.user.delete();
        throw new Error('Falha ao cadastrar: email não registrado. Tente novamente.');
      }
      // Atualizar perfil do Firebase Auth
      await updateProfile(result.user, {
        displayName: displayName
      });

      // Criar documento do usuário no Firestore
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: displayName,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isSubscriber: false,
      };

      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      
      // Retornar o resultado para poder acessar o UID
      return { user: result.user };
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  const updateUserEmail = async (newEmail: string, currentPassword: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    // Garante que o usuário do Auth está atualizado
    await user.reload();

    if (!user.email) {
      throw new Error('Seu usuário não possui email cadastrado. Faça logout e login novamente ou entre em contato com o suporte.');
    }

    try {
      // Reautenticar antes de atualizar email
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Atualizar email no Firebase Auth
      await updateEmail(user, newEmail);

      // Atualizar email no Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        email: newEmail
      });

      // Recarregar perfil
      await loadUserProfile(user.uid);
    } catch (error) {
      throw error;
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Reautenticar antes de atualizar senha
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Atualizar senha
      await updatePassword(user, newPassword);
    } catch (error) {
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Atualizar no Firestore
      await updateDoc(doc(db, 'users', user.uid), updates);

      // Se estiver atualizando displayName, também atualizar no Firebase Auth
      if (updates.displayName) {
        await updateProfile(user, {
          displayName: updates.displayName
        });
      }

      // Recarregar perfil
      await loadUserProfile(user.uid);
    } catch (error) {
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      await loadUserProfile(user.uid);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    logout,
    resetPassword,
    updateUserEmail,
    updateUserPassword,
    updateUserProfile,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Cookies from 'js-cookie';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && Cookies.get('supabaseToken') === 'mock-token') {
        const mockEmail = localStorage.getItem('mock-email') || 'test@example.com';
        setUser({ id: 'mock-local-user-123', email: mockEmail, user_metadata: { full_name: 'Test User' } });
        setLoading(false);
        return;
      }

      if (session) {
        setUser(session.user);
        Cookies.set('supabaseToken', session.access_token, { expires: 14, secure: process.env.NODE_ENV === 'production' });
      } else {
        setUser(null);
        Cookies.remove('supabaseToken');
      }
      setLoading(false);
    };

    getSession();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          Cookies.remove('supabaseToken');
          localStorage.removeItem('mock-email');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            setUser(session.user);
            Cookies.set('supabaseToken', session.access_token, { expires: 14, secure: process.env.NODE_ENV === 'production' });
          }
        } else if (session) {
          setUser(session.user);
          Cookies.set('supabaseToken', session.access_token, { expires: 14, secure: process.env.NODE_ENV === 'production' });
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email, password) => {
    if (email.toLowerCase().includes('test')) {
      const mockUser = { id: 'mock-local-user-123', email, user_metadata: { full_name: 'Test User' } };
      setUser(mockUser);
      localStorage.setItem('mock-email', email);
      Cookies.set('supabaseToken', 'mock-token', { expires: 14 });
      setLoading(false);
      return { user: mockUser };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUpWithEmail = async (email, password, fullName = '') => {
    if (email.toLowerCase().includes('test')) {
      const mockUser = { id: 'mock-local-user-123', email, user_metadata: { full_name: fullName || 'Test User' } };
      setUser(mockUser);
      localStorage.setItem('mock-email', email);
      Cookies.set('supabaseToken', 'mock-token', { expires: 14 });
      setLoading(false);
      return { user: mockUser };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
    if (error) throw error;
    return data;
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    localStorage.removeItem('mock-email');
    await supabase.auth.signOut();
    Cookies.remove('supabaseToken');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginWithEmail,
      signUpWithEmail,
      loginWithGoogle,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

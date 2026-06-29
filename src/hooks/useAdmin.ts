import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { syncLocalStorageToSupabase } from '../lib/storage';

// Admin session management
const ADMIN_SESSION_KEY = "kkn_admin_logged_in";
const ADMIN_PASSWORD = "MeduriAman2026";
const ADMIN_CHANGE_EVENT = "kkn_admin_change";

const getLocalAdminState = (): boolean => {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  } catch {
    return false;
  }
};

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => getLocalAdminState());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // === MODE LOKAL (sessionStorage) ===
      setLoading(false);
      const handler = () => setIsAdmin(getLocalAdminState());
      window.addEventListener(ADMIN_CHANGE_EVENT, handler);
      return () => window.removeEventListener(ADMIN_CHANGE_EVENT, handler);
    }

    // === MODE SUPABASE ===
    // Cek sesi Supabase DAN sesi lokal
    supabase.auth.getSession().then(({ data: { session } }) => {
      const active = !!session || getLocalAdminState();
      setIsAdmin(active);
      setLoading(false);
      if (active) {
        syncLocalStorageToSupabase();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAdmin(true);
        syncLocalStorageToSupabase();
      } else if (!getLocalAdminState()) {
        // Hanya set false jika tidak ada sesi lokal
        setIsAdmin(false);
      }
    });

    // Dengarkan perubahan sesi lokal juga saat Supabase aktif
    const handler = () => {
      const active = getLocalAdminState();
      setIsAdmin(active);
      if (active) {
        syncLocalStorageToSupabase();
      }
    };
    window.addEventListener(ADMIN_CHANGE_EVENT, handler);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener(ADMIN_CHANGE_EVENT, handler);
    };
  }, []);

  const loginAdmin = useCallback(async (passwordInput?: string) => {
    if (!passwordInput) return;

    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      setIsAdmin(true);
      window.dispatchEvent(new Event(ADMIN_CHANGE_EVENT));
      syncLocalStorageToSupabase();
      alert("✅ Login berhasil! Mode admin aktif.");
    } else {
      alert("❌ Password salah. Akses ditolak.");
    }
  }, []);

  const logoutAdmin = useCallback(async () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdmin(false);
    window.dispatchEvent(new Event(ADMIN_CHANGE_EVENT));

    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }

    alert("Berhasil keluar dari mode admin.");
  }, []);

  return { isAdmin, loading, loginAdmin, logoutAdmin };
};
import { supabase, isSupabaseConfigured } from './supabaseClient';

// localStorage key untuk menyimpan hero URL agar bertahan saat refresh
const HERO_CACHE_KEY = 'kkn_hero_image_url';

// Cache di memori
let cachedHeroUrl: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

// Helper: simpan URL ke localStorage dan memori
const saveHeroUrlToCache = (url: string) => {
  cachedHeroUrl = url;
  cacheTimestamp = Date.now();
  try {
    localStorage.setItem(HERO_CACHE_KEY, url);
  } catch {}
};

// Helper: baca URL dari localStorage
const getHeroUrlFromLocalStorage = (): string | null => {
  try {
    return localStorage.getItem(HERO_CACHE_KEY);
  } catch {
    return null;
  }
};

// Upload hero image ke Supabase Storage dan update database
export const uploadHeroImage = async (file: File): Promise<string> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please check your environment variables.');
  }

  // Validasi file
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran file tidak boleh lebih dari 5MB');
  }

  try {
    // Generate unique filename dengan timestamp
    const timestamp = new Date().getTime();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueFilename = `hero_${timestamp}.${fileExtension}`;

    // Upload ke Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('website-assets')
      .upload(`hero/${uniqueFilename}`, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Upload gagal: ${uploadError.message}`);
    }

    if (!data) {
      throw new Error('Upload gagal: no data returned');
    }

    // Dapatkan public URL
    const { data: publicUrlData } = supabase.storage
      .from('website-assets')
      .getPublicUrl(`hero/${uniqueFilename}`);

    const publicUrl = publicUrlData.publicUrl;

    if (!publicUrl) {
      throw new Error('Gagal mendapatkan public URL');
    }

    // Update site_settings table
    const { error: updateError } = await supabase
      .from('site_settings')
      .update({ hero_image: publicUrl })
      .eq('id', 1);

    if (updateError) {
      console.error('Database update error:', updateError);
      // Jika gagal update, hapus file yang sudah diupload
      await supabase.storage
        .from('website-assets')
        .remove([`hero/${uniqueFilename}`]);
      throw new Error(`Gagal menyimpan ke database: ${updateError.message}`);
    }

    // Update cache (memori + localStorage)
    saveHeroUrlToCache(publicUrl);

    // Emit event agar Hero component bisa update
    window.dispatchEvent(new Event('heroBgUpdated'));

    return publicUrl;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat upload gambar');
  }
};

// Fetch hero image dari Supabase database
export const getHeroImage = async (): Promise<string> => {
  // Return cached value jika masih fresh
  if (cachedHeroUrl && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedHeroUrl;
  }

  // Jika Supabase tidak dikonfigurasi, gunakan default
  if (!isSupabaseConfigured) {
    return '/balai_desa.png';
  }

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('hero_image')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error fetching hero image:', error);
      return getHeroUrlFromLocalStorage() || '/balai_desa.png';
    }

    if (data && data.hero_image) {
      saveHeroUrlToCache(data.hero_image);
      return data.hero_image;
    }

    return '/balai_desa.png';
  } catch (error) {
    console.error('Unexpected error fetching hero image:', error);
    return getHeroUrlFromLocalStorage() || '/balai_desa.png';
  }
};

// Synchronous: langsung baca dari localStorage (bertahan antar refresh)
export const getHeroImageSync = (): string => {
  // Cek memori dulu
  if (cachedHeroUrl && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedHeroUrl;
  }

  // Baca dari localStorage — ini yang membuat gambar langsung muncul saat refresh
  const stored = getHeroUrlFromLocalStorage();
  if (stored) {
    cachedHeroUrl = stored;
    cacheTimestamp = Date.now();
    return stored;
  }

  // Fallback default
  return '/balai_desa.png';
};
// ============================================================
// EDITABLE TEXT CONTENT — stored in Supabase `site_content` table
// ============================================================

// In-memory cache for text content to avoid repeated Supabase calls
const textCache: Record<string, string> = {};
let textCacheLoaded = false;

/**
 * Load ALL text content from Supabase once and fill memory cache.
 * Call this once at app startup.
 */
export const loadAllTextContent = async (): Promise<void> => {
  if (!isSupabaseConfigured) return;
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('id, content');
    if (error) { console.error('loadAllTextContent error:', error); return; }
    if (data) {
      data.forEach((row: { id: string; content: string }) => {
        textCache[row.id] = row.content;
      });
      textCacheLoaded = true;
    }
  } catch (e) {
    console.error('loadAllTextContent exception:', e);
  }
};

/**
 * Get a single text content value.
 * Returns from memory cache first, then falls back to localStorage.
 */
export const getTextContent = (id: string): string | null => {
  if (textCache[id] !== undefined) return textCache[id];
  // fallback: localStorage
  try { return localStorage.getItem(`kkn_text_${id}`); } catch { return null; }
};

/**
 * Save a text content value to Supabase AND memory cache AND localStorage.
 */
export const saveTextContent = async (id: string, content: string): Promise<void> => {
  // Always update memory cache and localStorage for instant UI
  textCache[id] = content;
  try { localStorage.setItem(`kkn_text_${id}`, content); } catch {}

  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase
      .from('site_content')
      .upsert({ id, content, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) console.error('saveTextContent error:', error);
  } catch (e) {
    console.error('saveTextContent exception:', e);
  }
};

export { textCacheLoaded };

// ============================================================
// THEME COLORS — stored in Supabase `site_content` table (prefix: theme_)
// ============================================================

/**
 * Save theme colors for a section to Supabase + localStorage.
 * Key format in DB: "theme_<sectionId>"
 */
export const saveThemeColors = async (sectionId: string, colors: Record<string, string>): Promise<void> => {
  const id = `theme_${sectionId}`;
  const content = JSON.stringify(colors);
  // Update memory cache
  textCache[id] = content;
  // Update localStorage for instant re-apply on next page load
  try { localStorage.setItem(`kkn_theme_${sectionId}`, content); } catch {}

  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase
      .from('site_content')
      .upsert({ id, content, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) console.error('saveThemeColors error:', error);
  } catch (e) {
    console.error('saveThemeColors exception:', e);
  }
};

/**
 * Get theme colors for a section from memory cache → localStorage fallback.
 * loadAllTextContent() must have been called first to populate from Supabase.
 */
export const getThemeColors = (sectionId: string, defaults: Record<string, string>): Record<string, string> => {
  const id = `theme_${sectionId}`;
  // Try memory cache (populated by loadAllTextContent which covers theme_ keys too)
  if (textCache[id] !== undefined) {
    try { return { ...defaults, ...JSON.parse(textCache[id]) }; } catch {}
  }
  // Fallback: localStorage
  try {
    const stored = localStorage.getItem(`kkn_theme_${sectionId}`);
    if (stored) return { ...defaults, ...JSON.parse(stored) };
  } catch {}
  return { ...defaults };
};

/**
 * Syncs all local text content and theme settings to Supabase database.
 * Call this when admin mode is active.
 */
export const syncLocalStorageToSupabase = async (): Promise<void> => {
  if (!isSupabaseConfigured) return;
  try {
    // 1. Gather all keys from localStorage
    const textsToSync: Array<{ id: string; content: string }> = [];
    const themesToSync: Array<{ id: string; content: string }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith('kkn_text_')) {
        const id = key.substring('kkn_text_'.length);
        const content = localStorage.getItem(key);
        if (content) {
          textsToSync.push({ id, content });
        }
      } else if (key.startsWith('kkn_theme_')) {
        const sectionId = key.substring('kkn_theme_'.length);
        const content = localStorage.getItem(key);
        if (content) {
          themesToSync.push({ id: `theme_${sectionId}`, content });
        }
      }
    }

    const allItems = [...textsToSync, ...themesToSync];
    if (allItems.length === 0) return;

    console.log(`[Sync] Found ${allItems.length} local items to sync to Supabase...`);

    // Fetch existing keys to avoid rewriting identical data
    const { data: remoteData, error } = await supabase
      .from('site_content')
      .select('id, content');

    if (error) {
      console.error('[Sync] Error checking remote content:', error);
      return;
    }

    const remoteMap = new Map<string, string>();
    if (remoteData) {
      remoteData.forEach((row: { id: string; content: string }) => {
        remoteMap.set(row.id, row.content);
      });
    }

    // Filter to only items that are missing or different in remote
    const itemsToUpsert = allItems.filter(item => {
      const remoteVal = remoteMap.get(item.id);
      return remoteVal !== item.content;
    });

    if (itemsToUpsert.length === 0) {
      console.log('[Sync] All local items are already in sync with Supabase.');
      return;
    }

    console.log(`[Sync] Upserting ${itemsToUpsert.length} changed items to Supabase...`);

    // Upsert items (using single-by-single or batch upsert)
    // Batch upsert is much faster and cleaner!
    const rows = itemsToUpsert.map(item => ({
      id: item.id,
      content: item.content,
      updated_at: new Date().toISOString()
    }));

    const { error: upsertError } = await supabase
      .from('site_content')
      .upsert(rows, { onConflict: 'id' });

    if (upsertError) {
      console.error('[Sync] Batch upsert failed:', upsertError);
    } else {
      console.log('[Sync] Successfully synced local data to Supabase!');
      // Update memory cache with synced items
      itemsToUpsert.forEach(item => {
        textCache[item.id] = item.content;
      });
    }
  } catch (e) {
    console.error('[Sync] Unexpected error during sync:', e);
  }
};

/**
 * Clears local storage cache for themes and texts.
 * Use this to forcibly sync local environment with remote/default.
 */
export const clearLocalCacheSync = () => {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('kkn_text_') || key.startsWith('kkn_theme_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
};


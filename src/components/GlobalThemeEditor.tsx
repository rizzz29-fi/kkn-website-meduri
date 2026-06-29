import { useState, useEffect, useRef } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { uploadHeroImage, saveThemeColors, getThemeColors, loadAllTextContent } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export const defaultThemeColors = {
  '--kkn-bg-primary': '#EAE6DB',
  '--kkn-text-primary': '#25362B',
  '--kkn-accent-1': '#9A9E8D',
  '--kkn-accent-2': '#D2CFC2',
  '--kkn-border': '#D2CFC2',
  '--kkn-card': '#E0DCCA',
  '--kkn-bg-dark': '#1F2E23',
  '--kkn-text-light': '#F7F5F0',
  '--kkn-card-light': '#F2EFE8',
};

const sectionDefaults: Record<string, typeof defaultThemeColors> = {
  hero: { ...defaultThemeColors },
  about: { ...defaultThemeColors },
  team: { ...defaultThemeColors },
  programs: { ...defaultThemeColors },
  gallery: { ...defaultThemeColors },
  footer: { ...defaultThemeColors },
  navbar: { ...defaultThemeColors },
};

export type ColorConfig = {
  key: keyof typeof defaultThemeColors;
  label: string;
  title: string;
};

const sectionColorConfig: Record<string, ColorConfig[]> = {
  navbar: [
    { key: '--kkn-bg-primary', label: 'BG Navbar', title: 'Background Navbar' },
    { key: '--kkn-text-primary', label: 'Teks Navbar', title: 'Warna Teks Navbar & Menu' },
    { key: '--kkn-accent-1', label: 'Aksen Menu', title: 'Garis Bawah Menu Aktif' },
  ],
  hero: [
    { key: '--kkn-bg-dark', label: 'Gradient Atas', title: 'Background Gradient Atas & Bawah' },
    { key: '--kkn-card', label: 'Gradient Tengah', title: 'Background Gradient Tengah' },
    { key: '--kkn-accent-1', label: 'Aksen', title: 'Warna Aksen / Garis' },
    { key: '--kkn-text-light', label: 'Teks Terang', title: 'Warna Teks Terang' },
    { key: '--kkn-bg-primary', label: 'BG Utama', title: 'Background Utama' },
    { key: '--kkn-text-primary', label: 'Teks Utama', title: 'Warna Teks' },
  ],
  about: [
    { key: '--kkn-bg-primary', label: 'BG Utama', title: 'Background Section' },
    { key: '--kkn-text-primary', label: 'Teks Utama', title: 'Warna Teks & Deskripsi' },
    { key: '--kkn-accent-1', label: 'Aksen Garis & Ikon', title: 'Garis Bawah & Warna Ikon' },
    { key: '--kkn-accent-2', label: 'Border & Lingkaran', title: 'Border Box & Lingkaran Ikon' },
    { key: '--kkn-text-light', label: 'Teks Peta', title: 'Teks Interaksi Peta' },
    { key: '--kkn-card-light', label: 'BG Kartu', title: 'Background Kartu (Visi, Misi, Lokasi)' },
  ],
  team: [
    { key: '--kkn-bg-primary', label: 'BG Utama & Jurusan', title: 'Background Section & Teks Jurusan' },
    { key: '--kkn-text-primary', label: 'Teks Judul', title: 'Warna Judul & Deskripsi' },
    { key: '--kkn-text-light', label: 'Teks Nama', title: 'Teks Nama Anggota & Inisial' },
    { key: '--kkn-accent-1', label: 'Aksen & Hover', title: 'Garis, Ikon, Hover, Tombol' },
    { key: '--kkn-accent-2', label: 'Teks Jabatan', title: 'Teks Jabatan & Hover Border' },
    { key: '--kkn-card', label: 'BG Kartu', title: 'Background Kartu Anggota' },
    { key: '--kkn-border', label: 'Border Foto', title: 'Border pada Foto Profil & Tombol Edit' },
    { key: '--kkn-bg-dark', label: 'BG Foto & Drag', title: 'Background Foto & Saat Digeser' },
    { key: '--kkn-card-light', label: 'BG Modal', title: 'Background Modal Edit' },
  ],
  programs: [
    { key: '--kkn-bg-primary', label: 'BG Utama & Kartu', title: 'Background Section dan Kartu Program' },
    { key: '--kkn-text-primary', label: 'Teks Kartu & Tab', title: 'Teks pada Kartu dan Tab Tidak Aktif' },
    { key: '--kkn-text-light', label: 'Teks Judul', title: 'Teks Judul Utama & Deskripsi' },
    { key: '--kkn-accent-1', label: 'Aksen Garis', title: 'Garis Pemisah & Aksen' },
    { key: '--kkn-accent-2', label: 'Aksen Tab & Garis', title: 'Warna Tab Aktif, Garis, dan Teks Badge' },
    { key: '--kkn-card', label: 'BG Badge', title: 'Background Badge Divisi' },
    { key: '--kkn-border', label: 'Border Kartu', title: 'Border pada Kartu Program' },
  ],
  gallery: [
    { key: '--kkn-bg-primary', label: 'BG Utama', title: 'Background Section Galeri' },
    { key: '--kkn-text-primary', label: 'Teks Utama', title: 'Warna Judul, Teks, Tanggal Kalender' },
    { key: '--kkn-accent-1', label: 'Aksen Garis', title: 'Garis Aksen & Kalender' },
    { key: '--kkn-card', label: 'BG Kalender & Tombol', title: 'Background Kalender & Tombol Upload' },
    { key: '--kkn-border', label: 'Border Kalender', title: 'Border Kotak Kalender' },
    { key: '--kkn-text-light', label: 'Teks Kalender & Sel', title: 'Teks Bulan/Hari & Background Sel Tanggal' },
    { key: '--kkn-bg-dark', label: 'Titik Aktivitas', title: 'Warna Titik Penanda Aktivitas' },
  ],
  footer: [
    { key: '--kkn-bg-dark', label: 'BG Footer', title: 'Background Utama Footer' },
    { key: '--kkn-text-light', label: 'Teks Footer', title: 'Warna Teks Footer' },
    { key: '--kkn-card', label: 'BG Ikon & Border', title: 'Background Ikon Sosial Media & Garis' },
    { key: '--kkn-bg-primary', label: 'Ikon Sosmed', title: 'Warna Ikon Sosial Media' },
    { key: '--kkn-accent-1', label: 'Aksen Teks', title: 'Warna Ikon Kecil & Link Hover' },
    { key: '--kkn-accent-2', label: 'Hover Ikon', title: 'Hover pada Bulatan Sosmed' },
  ],
};

const defaultColorConfig: ColorConfig[] = [
  { key: '--kkn-bg-primary', label: 'BG Utama', title: 'Background Utama' },
  { key: '--kkn-text-primary', label: 'Teks Utama', title: 'Teks Utama (Gelap)' },
  { key: '--kkn-accent-1', label: 'Aksen 1', title: 'Aksen 1 (Emas Tua)' },
  { key: '--kkn-accent-2', label: 'Aksen 2', title: 'Aksen 2 (Emas Muda)' },
  { key: '--kkn-border', label: 'Border', title: 'Warna Border/Garis' },
  { key: '--kkn-card', label: 'Kartu', title: 'Kartu (Coklat Tua)' },
  { key: '--kkn-bg-dark', label: 'BG Gelap', title: 'Background Gelap (Footer, Hero)' },
  { key: '--kkn-text-light', label: 'Teks Terang', title: 'Teks Terang (Krem)' },
  { key: '--kkn-card-light', label: 'BG Kartu Terang', title: 'Background Kartu Terang' },
];

const getLocalColorsForSection = (sectionId: string) => {
  const defaults = sectionDefaults[sectionId] || defaultThemeColors;
  return getThemeColors(sectionId, defaults) as typeof defaultThemeColors;
};

const saveLocalColorsForSection = (sectionId: string, colors: typeof defaultThemeColors) => {
  // Fire-and-forget async save to Supabase + localStorage
  saveThemeColors(sectionId, colors);
};

// Applies colors globally and to specific elements
const applyColorsToElement = (element: HTMLElement, colors: Record<string, string>) => {
  Object.entries(colors).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
};

// Applies colors to root element to ensure global cascade
const applyColorsToRoot = (colors: Record<string, string>) => {
  Object.entries(colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
};

export function GlobalThemeEditor() {
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [themeColors, setThemeColors] = useState(defaultThemeColors);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Hero Image Upload State
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);

  const activeSectionRef = useRef(activeSection);
  activeSectionRef.current = activeSection;

  // Load all theme colors from Supabase on mount, then re-apply to sections
  useEffect(() => {
    loadAllTextContent().then(() => {
      // Re-apply all section colors after Supabase data is loaded
      const navbar = document.getElementById('navbar');
      if (navbar) applyColorsToElement(navbar, getLocalColorsForSection('navbar'));
      const sections = document.querySelectorAll('section[id], footer[id]');
      sections.forEach((section) => {
        applyColorsToElement(section as HTMLElement, getLocalColorsForSection(section.id));
      });
      applyColorsToRoot(getLocalColorsForSection('hero'));
      // Refresh current section state
      if (activeSectionRef.current) {
        setThemeColors(getLocalColorsForSection(activeSectionRef.current));
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect to initialize themes and track active section
  useEffect(() => {
    const initSections = () => {
      // Apply to navbar
      const navbar = document.getElementById('navbar');
      if (navbar) {
        const navbarColors = getLocalColorsForSection('navbar');
        applyColorsToElement(navbar, navbarColors);
      }
      
      // Apply to regular sections and footer
      const sections = document.querySelectorAll('section[id], footer[id]');
      sections.forEach((section) => {
        // Apply stored theme for this section
        const colors = getLocalColorsForSection(section.id);
        applyColorsToElement(section as HTMLElement, colors);
      });
      
      // Also apply to root for global cascade
      const heroColors = getLocalColorsForSection('hero');
      applyColorsToRoot(heroColors);
    };

    // Initial check
    initSections();

    // Setup mutation observer to catch dynamically added sections
    const mutationObserver = new MutationObserver((mutations) => {
      let addedNodes = false;
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) addedNodes = true;
      });
      if (addedNodes) initSections();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // Robust scroll spy to detect active section
    const getActiveSection = () => {
      const sections = Array.from(document.querySelectorAll('section[id], footer[id]'));
      if (sections.length === 0) return 'navbar';

      const viewportCenter = window.innerHeight / 2;
      let closestSection = sections[0];
      let minDistance = Infinity;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        // If the center of the viewport is inside the section
        if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
          closestSection = section;
          minDistance = 0;
        } else {
          // Fallback to the closest section center
          const sectionCenter = rect.top + rect.height / 2;
          const distance = Math.abs(viewportCenter - sectionCenter);
          if (distance < minDistance && minDistance !== 0) {
            closestSection = section;
            minDistance = distance;
          }
        }
      });

      return closestSection.id;
    };

    const handleScroll = () => {
      const current = getActiveSection();
      if (current && current !== activeSectionRef.current) {
        setActiveSection(current);
      }
    };

    // Run once to set initial
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      mutationObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Sync state when active section changes
  useEffect(() => {
    if (activeSection) {
      setThemeColors(getLocalColorsForSection(activeSection));
    }
  }, [activeSection]);

  const handleColorChange = (key: keyof typeof defaultThemeColors, value: string) => {
    if (!activeSection) return;
    const newColors = { ...themeColors, [key]: value };
    setThemeColors(newColors);
    saveLocalColorsForSection(activeSection, newColors);
    
    // Apply immediately to the active DOM element
    const el = document.getElementById(activeSection);
    if (el) {
      applyColorsToElement(el, newColors);
    }
    
    // Also apply to root for global cascade
    applyColorsToRoot(newColors);
    
    // Apply to all sections and navbar to ensure consistency
    const navbar = document.getElementById('navbar');
    if (navbar && activeSection === 'navbar') {
      applyColorsToElement(navbar, newColors);
    }
    
    const allSections = document.querySelectorAll('section[id], footer[id]');
    allSections.forEach((section) => {
      const sectionColors = getLocalColorsForSection(section.id);
      applyColorsToElement(section as HTMLElement, sectionColors);
    });
  };

  const handleHeroImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroImageFile(file);
      setHeroImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveHeroImage = async () => {
    if (!heroImageFile) return;

    setIsUploadingHeroImage(true);
    try {
      await uploadHeroImage(heroImageFile);
      
      toast({
        title: "Berhasil! ✅",
        description: "Gambar hero berhasil diupload ke Supabase dan disimpan di database.",
        duration: 5000,
      });
      
      setHeroImagePreview(null);
      setHeroImageFile(null);
    } catch (error) {
      console.error('Failed to save image:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan gambar';
      toast({
        title: "Error! ❌",
        description: errorMessage,
        duration: 5000,
        variant: "destructive",
      });
    } finally {
      setIsUploadingHeroImage(false);
    }
  };

  if (!isAdmin || !activeSection) return null;

  const currentConfig = sectionColorConfig[activeSection] || defaultColorConfig;

  if (isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 left-4 bg-white p-3 rounded-full shadow-xl z-50 border border-gray-200 text-xl hover:scale-110 transition-transform flex items-center justify-center"
        title="Buka Editor Tema"
      >
        🎨
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white/95 p-4 rounded-xl shadow-xl z-50 border border-gray-200 text-left w-[calc(100vw-32px)] sm:w-64 transform transition-transform hover:scale-[1.02] max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          🎨 Edit: {activeSection}
        </h4>
        <button 
          onClick={() => setIsMinimized(true)}
          className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
          title="Sembunyikan"
        >
          ✕
        </button>
      </div>
      <div className="space-y-3">
        {currentConfig.map(({ key, label, title }) => (
          <label key={key} className="flex items-center justify-between text-xs text-gray-700 cursor-pointer">
            <span title={title}>{label}</span>
            <input
              type="color"
              value={themeColors[key]}
              onChange={(e) => handleColorChange(key, e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0"
            />
          </label>
        ))}
        
        <button
          onClick={() => { 
            const defaults = sectionDefaults[activeSection] || defaultThemeColors;
            setThemeColors(defaults); 
            saveLocalColorsForSection(activeSection, defaults);
            const el = document.getElementById(activeSection);
            if (el) applyColorsToElement(el, defaults);
            applyColorsToRoot(defaults);
          }}
          className="w-full mt-4 text-[10px] bg-red-50 text-red-600 hover:bg-red-100 py-1.5 rounded font-semibold transition-colors border border-red-200"
        >
          Reset ke Default
        </button>

        {activeSection === 'hero' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h5 className="text-xs font-bold text-gray-800 mb-2">Hero Background</h5>
            <div className="flex flex-col gap-2">
              {heroImagePreview && (
                <div className="relative w-full h-24 rounded overflow-hidden">
                  <img src={heroImagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleHeroImageSelect}
                className="text-[10px] w-full text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
              />
              {heroImageFile && (
                <button
                  onClick={handleSaveHeroImage}
                  disabled={isUploadingHeroImage}
                  className="w-full text-[10px] bg-green-50 text-green-600 hover:bg-green-100 py-1.5 rounded font-semibold transition-colors border border-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingHeroImage ? 'Mengunggah...' : 'Simpan Gambar'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

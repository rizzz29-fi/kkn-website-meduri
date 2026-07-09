import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAdmin } from '@/hooks/useAdmin';
import { Pencil, Trash2, Camera, MoveUp, MoveDown, ShieldAlert, ArrowUpDown } from 'lucide-react';
import { EditableText } from './EditableText';
import { getTextContent, saveTextContent, textCacheLoaded, loadAllTextContent } from '@/lib/storage';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  major: string;
  avatar_url: string | null;
  position?: number;
}

// Kompresi gambar sebelum upload
const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context not available'));
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = ev.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Key localStorage untuk simpan urutan lokal
const LOCAL_ORDER_KEY = 'kkn_team_order';

const getLocalOrder = (): number[] | null => {
  try {
    const synced = getTextContent('team_order');
    if (synced) return JSON.parse(synced);

    const stored = localStorage.getItem(LOCAL_ORDER_KEY);
    if (stored) {
      // Migrate old local storage to Supabase!
      saveTextContent('team_order', stored);
      return JSON.parse(stored);
    }
  } catch {}
  return null;
};

const saveLocalOrder = (ids: number[]) => {
  try {
    localStorage.setItem(LOCAL_ORDER_KEY, JSON.stringify(ids));
    saveTextContent('team_order', JSON.stringify(ids));
  } catch {}
};



// Division definitions (role keyword → display title)
const DIVISION_RULES: { keyword: string; title: string; sampleRole: string }[] = [
  { keyword: 'DOSEN',        title: 'LEADERS & SUPERVISORS',       sampleRole: 'DOSEN PEMBIMBING' },
  { keyword: 'PEMBIMBING',   title: 'LEADERS & SUPERVISORS',       sampleRole: 'DOSEN PEMBIMBING' },
  { keyword: 'KETUA',        title: 'LEADERS & SUPERVISORS',       sampleRole: 'KETUA' },
  { keyword: 'SEKRETARIS',   title: 'EXECUTIVE COMMITTEE',         sampleRole: 'SEKRETARIS' },
  { keyword: 'BENDAHARA',    title: 'EXECUTIVE COMMITTEE',         sampleRole: 'BENDAHARA' },
  { keyword: 'ACARA',        title: 'PROGRAM EXPERIENCE',          sampleRole: 'DIVISI ACARA' },
  { keyword: 'HUMAS',        title: 'STORYTELLER & MEDIA',         sampleRole: 'DIVISI HUMAS' },
  { keyword: 'KONSUMSI',     title: 'NUTRITION SPECIALIST',        sampleRole: 'DIVISI KONSUMSI' },
  { keyword: 'PDD',          title: 'DIRECTOR OF ADMINISTRATION',  sampleRole: 'DIVISI PDD' },
  { keyword: 'PERKAP',       title: 'LOGISTIC PROPERTI',           sampleRole: 'DIVISI PERKAP' },
  { keyword: 'MANAJERIAL',   title: 'LOGISTIC PROPERTI',           sampleRole: 'DIVISI MANAJERIAL' },
];

const UNIQUE_DIVISIONS = [
  { title: 'LEADERS & SUPERVISORS',      sampleRole: 'DOSEN PEMBIMBING' },
  { title: 'EXECUTIVE COMMITTEE',        sampleRole: 'SEKRETARIS' },
  { title: 'PROGRAM EXPERIENCE',         sampleRole: 'DIVISI ACARA' },
  { title: 'STORYTELLER & MEDIA',        sampleRole: 'DIVISI HUMAS' },
  { title: 'NUTRITION SPECIALIST',       sampleRole: 'DIVISI KONSUMSI' },
  { title: 'DIRECTOR OF ADMINISTRATION', sampleRole: 'DIVISI PDD' },
  { title: 'LOGISTIC PROPERTI',          sampleRole: 'DIVISI PERKAP' },
  { title: 'COMMUNITY RELATIONS',        sampleRole: 'ANGGOTA' },
];

export function Team() {
  const { isAdmin } = useAdmin();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [positionSupported, setPositionSupported] = useState(true);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [dragOverGroupIdx, setDragOverGroupIdx] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [uploadingMemberId, setUploadingMemberId] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  // movingMemberId: which card's division-picker popup is open
  const [movingMemberId, setMovingMemberId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoTargetIdRef = useRef<number | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // References for drag-to-scroll
  const sliderRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleSliderMouseDown = (e: React.MouseEvent, index: number) => {
    if (isAdmin) return; // Allow normal HTML5 drag-and-drop for admins
    const slider = sliderRefs.current[index];
    if (!slider) return;
    isDown.current = true;
    slider.style.cursor = 'grabbing';
    slider.style.userSelect = 'none';
    startX.current = e.pageX - slider.offsetLeft;
    scrollLeft.current = slider.scrollLeft;
  };

  const handleSliderMouseLeave = (index: number) => {
    if (isAdmin) return;
    isDown.current = false;
    const slider = sliderRefs.current[index];
    if (slider) {
      slider.style.cursor = 'grab';
      slider.style.removeProperty('user-select');
    }
  };

  const handleSliderMouseUp = (index: number) => {
    if (isAdmin) return;
    isDown.current = false;
    const slider = sliderRefs.current[index];
    if (slider) {
      slider.style.cursor = 'grab';
      slider.style.removeProperty('user-select');
    }
  };

  const handleSliderMouseMove = (e: React.MouseEvent, index: number) => {
    if (isAdmin || !isDown.current) return;
    e.preventDefault();
    const slider = sliderRefs.current[index];
    if (!slider) return;
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    slider.scrollLeft = scrollLeft.current - walk;
  };

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [loading]);


  // Urutkan member berdasarkan local order jika ada
  const applyLocalOrder = (data: TeamMember[]): TeamMember[] => {
    const localOrder = getLocalOrder();
    if (!localOrder || localOrder.length === 0) return data;

    const map = new Map<number, TeamMember>();
    data.forEach((m) => map.set(m.id, m));

    const ordered: TeamMember[] = [];
    localOrder.forEach((id) => {
      const member = map.get(id);
      if (member) {
        ordered.push(member);
        map.delete(id);
      }
    });
    // Tambahkan anggota baru yang belum ada di local order
    map.forEach((m) => ordered.push(m));
    return ordered;
  };

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      if (!textCacheLoaded) {
        await loadAllTextContent();
      }

      // Coba ambil dengan kolom position
      let res = await supabase
        .from('tim-kkn')
        .select('id,name,role,major,avatar_url,position')
        .order('position', { ascending: true })
        .order('id', { ascending: true });

      if (res.error) {
        const msg = String(res.error.message || res.error);
        if (/position/i.test(msg)) {
          setPositionSupported(false);
          const fallback = await supabase.from('tim-kkn').select('id,name,role,major,avatar_url');
          if (fallback.error) throw fallback.error;
          if (fallback.data) {
            // Gunakan urutan lokal sebagai fallback
            setMembers(applyLocalOrder(fallback.data as TeamMember[]));
          }
        } else {
          throw res.error;
        }
      } else {
        if (res.data) {
          setMembers(res.data as TeamMember[]);
        }
      }
    } catch (err: any) {
      console.error('Gagal mengambil data tim:', err);
      setFetchError(String(err.message || err));
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam, isAdmin]);

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // ── Simpan urutan (DB jika bisa, localStorage sebagai fallback) ──
  const persistOrder = async (reordered: TeamMember[]) => {
    // Selalu simpan ke localStorage sebagai backup
    saveLocalOrder(reordered.map((m) => m.id));

    if (!positionSupported) return;

    setIsSavingOrder(true);
    try {
      for (let i = 0; i < reordered.length; i++) {
        const res = await supabase.from('tim-kkn').update({ position: i }).eq('id', reordered[i].id);
        if (res.error) {
          const msg = String(res.error.message || '');
          if (/position/i.test(msg)) {
            setPositionSupported(false);
            return;
          }
          throw res.error;
        }
      }
    } catch (err) {
      console.error('Gagal menyimpan urutan ke DB:', err);
    } finally {
      setIsSavingOrder(false);
    }
  };

  // ── Drag handlers (admin only) ──
  const handleDragStart = (e: React.DragEvent, id: number) => {
    if (!isAdmin) return;
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  };

  const handleDragLeave = () => setDragOverId(null);

  const handleDrop = async (e: React.DragEvent, dropId: number) => {
    e.preventDefault();
    setDragOverId(null);
    if (!isAdmin || draggedId === null || draggedId === dropId) {
      setDraggedId(null);
      return;
    }

    const dragIdx = members.findIndex((m) => m.id === draggedId);
    const dropIdx = members.findIndex((m) => m.id === dropId);
    if (dragIdx === -1 || dropIdx === -1) {
      setDraggedId(null);
      return;
    }

    const reordered = [...members];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setMembers(reordered);
    setDraggedId(null);

    await persistOrder(reordered);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    setDragOverGroupIdx(null);
  };

  // Admin-only move helpers (within same group / global flat array)
  const handleMoveUp = async (index: number) => {
    if (!isAdmin || index === 0) return;
    const newMembers = [...members];
    [newMembers[index - 1], newMembers[index]] = [newMembers[index], newMembers[index - 1]];
    setMembers(newMembers);
    await persistOrder(newMembers);
  };

  const handleMoveDown = async (index: number) => {
    if (!isAdmin || index === members.length - 1) return;
    const newMembers = [...members];
    [newMembers[index + 1], newMembers[index]] = [newMembers[index], newMembers[index + 1]];
    setMembers(newMembers);
    await persistOrder(newMembers);
  };

  // ── Pindah member ke divisi lain ──
  // Mengubah role member agar cocok dengan keyword divisi tujuan
  const handleMoveToOtherGroup = async (member: TeamMember, targetSampleRole: string) => {
    setMovingMemberId(null);
    if (!isAdmin) return;

    // Tentukan role baru: ambil suffix jabatan (CO, KOORDINATOR, dll) dari role lama jika ada
    const oldRole = member.role.toUpperCase();
    const parenMatch = oldRole.match(/\(([^)]+)\)/);
    const suffix = parenMatch ? ` (${parenMatch[1]})` : '';
    const newRole = `${targetSampleRole}${suffix}`.toUpperCase();

    try {
      const { error } = await supabase
        .from('tim-kkn')
        .update({ role: newRole })
        .eq('id', member.id);
      if (error) throw error;

      setMembers(prev =>
        prev.map(m => m.id === member.id ? { ...m, role: newRole } : m)
      );
    } catch (err: any) {
      console.error('Gagal pindah divisi:', err);
      alert('Gagal memindahkan ke divisi lain: ' + (err.message || err));
    }
  };

  // ── Drop ke kolom divisi (cross-group drop) ──
  const handleDropOnGroup = async (e: React.DragEvent, targetSampleRole: string, groupIdx: number) => {
    e.preventDefault();
    setDragOverGroupIdx(null);
    if (!isAdmin || draggedId === null) { setDraggedId(null); return; }

    const member = members.find(m => m.id === draggedId);
    if (!member) { setDraggedId(null); return; }

    await handleMoveToOtherGroup(member, targetSampleRole);
    setDraggedId(null);
  };

  // ── Upload foto profil ──
  const handlePhotoClick = (memberId: number) => {
    if (!isAdmin) return;
    photoTargetIdRef.current = memberId;
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const memberId = photoTargetIdRef.current;
    if (!file || !memberId) return;

    setUploadingMemberId(memberId);
    try {
      // Kompres gambar
      const blob = await compressImage(file, 800, 0.8);

      // Upload ke Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('foto-profil')
        .upload(fileName, blob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('foto-profil').getPublicUrl(fileName);
      const newUrl = urlData.publicUrl;

      // Update database
      const { error: updateError } = await supabase
        .from('tim-kkn')
        .update({ avatar_url: newUrl })
        .eq('id', memberId);
      if (updateError) throw updateError;

      // Update state lokal
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, avatar_url: newUrl } : m))
      );
    } catch (err: any) {
      console.error('Gagal mengubah foto:', err);
      alert('Gagal mengubah foto: ' + (err.message || err));
    } finally {
      setUploadingMemberId(null);
      photoTargetIdRef.current = null;
      e.target.value = '';
    }
  };

  // ── Hapus foto profil ──
  const handleDeletePhoto = async (memberId: number, currentUrl: string | null) => {
    if (!isAdmin || !currentUrl) return;
    if (!confirm('Hapus foto profil anggota ini?')) return;

    try {
      // Hapus dari storage
      const parts = currentUrl.split('/');
      const fileNameInStorage = parts[parts.length - 1];
      await supabase.storage.from('foto-profil').remove([fileNameInStorage]);

      // Update database
      await supabase.from('tim-kkn').update({ avatar_url: null }).eq('id', memberId);

      // Update state lokal
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, avatar_url: null } : m))
      );
    } catch (err: any) {
      console.error('Gagal menghapus foto:', err);
      alert('Gagal menghapus foto: ' + (err.message || err));
    }
  };

  // ── Edit member inline ──
  const handleSaveEdit = async () => {
    if (!editingMember) return;
    try {
      const { error } = await supabase
        .from('tim-kkn')
        .update({
          name: editingMember.name,
          role: editingMember.role,
          major: editingMember.major,
        })
        .eq('id', editingMember.id);
      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
            ? { ...m, name: editingMember.name, role: editingMember.role, major: editingMember.major }
            : m
        )
      );
      setEditingMember(null);
    } catch (err: any) {
      console.error('Gagal menyimpan perubahan:', err);
      alert('Gagal menyimpan: ' + (err.message || err));
    }
  };

  // ── Hapus anggota ──
  const handleDeleteMember = async (memberId: number, avatarUrl: string | null) => {
    if (!isAdmin) return;
    if (!confirm('Hapus anggota ini? Tindakan ini tidak dapat dibatalkan.')) return;

    try {
      const { error } = await supabase.from('tim-kkn').delete().eq('id', memberId);
      if (error) throw error;

      // Hapus foto dari storage jika ada
      if (avatarUrl) {
        const parts = avatarUrl.split('/');
        const fileNameInStorage = parts[parts.length - 1];
        await supabase.storage.from('foto-profil').remove([fileNameInStorage]);
      }

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      // Update local order
      saveLocalOrder(members.filter((m) => m.id !== memberId).map((m) => m.id));
    } catch (err: any) {
      console.error('Gagal menghapus anggota:', err);
      alert('Gagal menghapus: ' + (err.message || err));
    }
  };

  // ── Formatter untuk role ──
  const formatRole = (role: string) => {
    const words = role.trim().split(' ');
    if (words.length <= 1) return <span className="block">{role}</span>;
    
    // Kata terakhir dibuat font sans dan lebih kecil
    const lastWord = words.pop();
    return (
      <>
        {words.join(' ')}{' '}
        <span className="block text-xl tracking-widest font-sans opacity-90 mt-1">{lastWord}</span>
      </>
    );
  };

  // ── Card renderer ──
  const renderCard = (member: TeamMember) => {
    const isDragging = draggedId === member.id;
    const isOver = dragOverId === member.id && draggedId !== member.id;
    const index = members.findIndex((m) => m.id === member.id);
    const isUploading = uploadingMemberId === member.id;

    return (
      <div
        key={member.id}
        draggable={isAdmin}
        onDragStart={(e) => handleDragStart(e, member.id)}
        onDragOver={(e) => handleDragOver(e, member.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, member.id)}
        onDragEnd={handleDragEnd}
        className={[
          'relative w-[280px] md:w-[320px] h-[400px] md:h-[450px] rounded-[2rem] overflow-hidden shrink-0 snap-center group shadow-xl',
          'transition-all duration-300',
          isAdmin ? 'cursor-grab active:cursor-grabbing select-none' : '',
          isDragging ? 'opacity-30 scale-95 border-2 border-kkn-accent-1' : 'bg-kkn-card',
          isOver ? 'border-4 scale-[1.04] shadow-2xl border-kkn-text-primary' : 'border border-kkn-text-primary/10',
        ].join(' ')}
      >
        {isAdmin && (
          <>
            <span className="absolute top-4 right-4 z-30 text-[10px] font-bold px-3 py-1 rounded-full bg-black/60 backdrop-blur text-white pointer-events-none select-none border border-white/20">
              ⠿ GESER
            </span>
            {/* Left/Right within division */}
            <div className="absolute top-4 left-4 flex gap-1 z-30">
              <button onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }} title="Pindah ke kiri" className="bg-black/60 border border-white/20 text-white text-xs p-2 rounded-full hover:bg-white hover:text-black transition-colors"><MoveUp className="w-3 h-3 -rotate-90" /></button>
              <button onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }} title="Pindah ke kanan" className="bg-black/60 border border-white/20 text-white text-xs p-2 rounded-full hover:bg-white hover:text-black transition-colors"><MoveDown className="w-3 h-3 -rotate-90" /></button>
            </div>
            {/* Up/Down = change division */}
            <div className="absolute bottom-4 left-4 z-30">
              <button
                onClick={(e) => { e.stopPropagation(); setMovingMemberId(movingMemberId === member.id ? null : member.id); }}
                title="Pindah ke divisi lain"
                className="bg-black/60 border border-white/20 text-white text-xs p-2 rounded-full hover:bg-white hover:text-black transition-colors flex items-center gap-1"
              >
                <ArrowUpDown className="w-3 h-3" />
              </button>
              {/* Division picker popup */}
              {movingMemberId === member.id && (
                <div
                  className="absolute bottom-10 left-0 bg-kkn-bg-dark border border-white/20 rounded-xl shadow-2xl p-2 min-w-[200px] z-50 backdrop-blur-sm"
                  onClick={e => e.stopPropagation()}
                >
                  <p className="text-[9px] text-white/40 px-2 py-1 uppercase tracking-widest font-sans mb-1">Pindah ke divisi:</p>
                  {UNIQUE_DIVISIONS.map(div => (
                    <button
                      key={div.title}
                      onClick={(e) => { e.stopPropagation(); handleMoveToOtherGroup(member, div.sampleRole); }}
                      className={`w-full text-left px-3 py-2 text-[10px] uppercase tracking-wide rounded-lg transition-colors font-sans ${
                        member.role.toUpperCase().includes(div.sampleRole.split(' ')[1] || div.sampleRole)
                          ? 'bg-white/20 text-white cursor-default'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {div.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Full Card Background Image */}
        <div 
          className={`absolute inset-0 w-full h-full z-0 ${isAdmin ? 'cursor-pointer' : ''}`}
          onClick={() => isAdmin && handlePhotoClick(member.id)}
          title={isAdmin ? 'Klik untuk ganti foto' : undefined}
        >
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
          {member.avatar_url ? (
            <>
              <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
              {isAdmin && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 text-white" />
                    <span className="text-white text-xs font-bold tracking-widest">GANTI FOTO</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-full h-full bg-gradient-to-br from-kkn-bg-primary to-kkn-accent-1 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-kkn-text-primary/10 font-serif">{getInitials(member.name)}</span>
              </div>
              {isAdmin && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 text-white" />
                    <span className="text-white text-xs font-bold tracking-widest">TAMBAH FOTO</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Gradient Overlay & Text */}
        <div 
          className="absolute inset-0 pointer-events-none z-10" 
          style={{ background: 'linear-gradient(to top, var(--kkn-team-gradient, #1F2E23) 0%, transparent 80%)' }}
        />
        
        <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end pointer-events-none z-20">
          <p className="text-[10px] md:text-xs font-mono tracking-widest text-white/70 mb-2 uppercase drop-shadow-md">
            {member.name}
          </p>
          <h3 className="text-3xl md:text-4xl font-serif font-bold text-white leading-[0.9] uppercase drop-shadow-lg tracking-tighter">
            {formatRole(member.role)}
          </h3>
          <p className="text-[10px] text-white/50 font-mono mt-4 uppercase tracking-widest border-t border-white/20 pt-3">
            {member.major}
          </p>
        </div>

        {/* Admin Action Buttons (Edit, Delete, dll) */}
        {isAdmin && (
          <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setEditingMember({ ...member }); }}
              className="p-2 rounded-full bg-black/60 backdrop-blur text-white hover:bg-white hover:text-black transition-colors border border-white/20"
              title="Edit Data"
            >
              <Pencil className="w-4 h-4" />
            </button>
            {member.avatar_url && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeletePhoto(member.id, member.avatar_url); }}
                className="p-2 rounded-full bg-black/60 backdrop-blur text-white hover:bg-red-500 hover:text-white transition-colors border border-white/20"
                title="Hapus Foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.id, member.avatar_url); }}
              className="p-2 rounded-full bg-black/60 backdrop-blur text-red-400 hover:bg-red-600 hover:text-white transition-colors border border-red-500/30"
              title="Hapus Anggota"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] bg-kkn-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kkn-text-primary"></div>
      </div>
    );
  }

  // ── Grouping ──
  const leaders = members.filter(
    (m) => {
      const r = (m.role || '').toUpperCase();
      return r.includes('DOSEN') || r.includes('PEMBIMBING') || r === 'KETUA';
    }
  );
  const coreTeam = members.filter(
    (m) => {
      const r = (m.role || '').toUpperCase();
      return r.includes('SEKRETARIS') || r.includes('BENDAHARA');
    }
  );
  const acaraTeam = members.filter((m) => (m.role || '').toUpperCase().includes('ACARA'));
  const humasTeam = members.filter((m) => (m.role || '').toUpperCase().includes('HUMAS'));
  const konsumsiTeam = members.filter((m) => (m.role || '').toUpperCase().includes('KONSUMSI'));
  const pddTeam = members.filter((m) => (m.role || '').toUpperCase().includes('PDD'));
  const perkkapTeam = members.filter(
    (m) => {
      const r = (m.role || '').toUpperCase();
      return r.includes('PERKAP') || r.includes('MANAJERIAL');
    }
  );
  const others = members.filter(
    (m) => {
      const r = (m.role || '').toUpperCase();
      return (
        !r.includes('DOSEN') &&
        !r.includes('PEMBIMBING') &&
        r !== 'KETUA' &&
        !r.includes('SEKRETARIS') &&
        !r.includes('BENDAHARA') &&
        !r.includes('ACARA') &&
        !r.includes('HUMAS') &&
        !r.includes('KONSUMSI') &&
        !r.includes('PDD') &&
        !r.includes('PERKAP') &&
        !r.includes('MANAJERIAL')
      );
    }
  );

  const groupedDivisions = [
    { title: "LEADERS & SUPERVISORS", members: leaders },
    { title: "EXECUTIVE COMMITTEE", members: coreTeam },
    { title: "PROGRAM EXPERIENCE", members: acaraTeam },
    { title: "STORYTELLER & MEDIA", members: humasTeam },
    { title: "NUTRITION SPECIALIST", members: konsumsiTeam },
    { title: "DIRECTOR OF ADMINISTRATION", members: pddTeam },
    { title: "LOGISTIC PROPERTI", members: perkkapTeam },
    { title: "COMMUNITY RELATIONS", members: others }
  ].filter(group => group.members.length > 0);

  return (
    <section
      id="team"
      ref={sectionRef}
      className={`relative min-h-screen py-32 bg-kkn-bg-primary text-kkn-text-primary overflow-hidden transition-opacity duration-1000 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />

      <div className="container mx-auto px-4 md:px-8 relative z-10 mb-16">
        <EditableText
          as="h2"
          id="team_heading"
          defaultText="MEET THE TEAM"
          className="text-4xl md:text-5xl font-serif font-bold uppercase tracking-tighter text-kkn-text-primary"
        />
        <div className="w-20 h-1 bg-kkn-accent-1 mt-6 mb-8"></div>
        <EditableText
          as="p"
          id="team_description"
          defaultText="Mahasiswa-mahasiswi berdedikasi yang siap mengabdi dan belajar bersama masyarakat Desa Meduri, Kecamatan Margomulyo, Kabupaten Bojonegoro."
          className="text-kkn-text-primary/60 max-w-2xl text-sm md:text-base font-mono tracking-wide leading-relaxed"
        />

        {isAdmin && (
          <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl max-w-2xl">
            <p className="text-xs text-red-400 font-mono tracking-widest animate-pulse flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              ADMIN MODE ACTIVE
            </p>
            <p className="text-xs text-white/50 mt-2 font-mono">
              Seret kartu atau klik tombol panah untuk mengubah urutan. Klik area foto untuk mengganti gambar.
              {isSavingOrder && ' · Menyimpan urutan...'}
              {!positionSupported && ' · (urutan disimpan lokal)'}
            </p>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        {fetchError ? (
          <div className="py-8">
            <p className="text-red-500 font-mono mb-4 border border-red-500/20 bg-red-500/5 p-4 rounded-lg">Error: {fetchError}</p>
            <button onClick={() => fetchTeam()} className="px-6 py-3 bg-kkn-text-primary text-kkn-bg-primary font-bold uppercase tracking-widest text-xs hover:opacity-80 transition-opacity">Muat Ulang</button>
          </div>
        ) : members.length === 0 ? (
          <div className="py-8">
            <p className="text-kkn-text-primary/40 italic font-mono mb-4">Belum ada data anggota tim.</p>
            <button onClick={() => fetchTeam()} className="px-6 py-3 bg-kkn-text-primary text-kkn-bg-primary font-bold uppercase tracking-widest text-xs hover:opacity-80 transition-opacity">Muat Ulang</button>
          </div>
        ) : (
          <div className="space-y-16">
            {groupedDivisions.map((group, gi) => {
              // Find the sampleRole for this group to enable cross-group drop
              const divisionDef = UNIQUE_DIVISIONS.find(d => d.title === group.title);
              const sampleRole = divisionDef?.sampleRole ?? group.members[0]?.role ?? '';
              const isGroupDragOver = dragOverGroupIdx === gi;

              return (
              <div
                key={gi}
                className="w-full"
                onDragOver={isAdmin ? (e) => { e.preventDefault(); setDragOverGroupIdx(gi); } : undefined}
                onDragLeave={isAdmin ? () => setDragOverGroupIdx(null) : undefined}
                onDrop={isAdmin ? (e) => handleDropOnGroup(e, sampleRole, gi) : undefined}
              >
                {/* Scrollable container that contains the Division Title and cards */}
                <div 
                  ref={el => sliderRefs.current[gi] = el}
                  className={`flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 pt-0 items-center w-full ${!isAdmin ? 'cursor-grab' : ''}`} 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  onMouseDown={(e) => handleSliderMouseDown(e, gi)}
                  onMouseLeave={() => handleSliderMouseLeave(gi)}
                  onMouseUp={() => handleSliderMouseUp(gi)}
                  onMouseMove={(e) => handleSliderMouseMove(e, gi)}
                >
                  {/* Division Title — now inside the slider, sticky on desktop, snaps on mobile */}
                  <div className={`shrink-0 w-[280px] h-[400px] md:w-[280px] md:h-[450px] flex flex-col justify-center border-l-2 pl-8 pr-6 space-y-4 bg-kkn-bg-primary z-40 overflow-hidden transition-all duration-200 snap-center md:snap-align-none md:sticky md:left-0 ${
                    isGroupDragOver && isAdmin
                      ? 'border-kkn-text-primary bg-kkn-text-primary/10 scale-[1.01]'
                      : 'border-kkn-accent-1'
                  }`}>
                    {isGroupDragOver && isAdmin && (
                      <div className="text-xs text-kkn-text-primary/70 font-sans font-bold animate-pulse px-1 py-1 rounded bg-kkn-text-primary/10 text-center">
                        ↓ Lepas di sini
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-kkn-accent-1"></div>
                      <EditableText
                        as="p"
                        id={`team_div_label_${gi}`}
                        defaultText="DIVISION"
                        className="text-[10px] font-mono text-kkn-text-primary/50 tracking-widest uppercase"
                      />
                    </div>
                    <EditableText
                      as="h3"
                      id={`team_div_title_${gi}`}
                      defaultText={group.title}
                      className="text-2xl md:text-3xl font-serif font-bold text-kkn-text-primary uppercase leading-[0.95] tracking-tighter break-words"
                    />
                  </div>

                  {group.members.map(renderCard)}
                  <div className="w-4 shrink-0 pointer-events-none"></div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Edit Anggota */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setEditingMember(null)}>
          <div className="bg-kkn-card w-full max-w-md rounded-2xl p-8 border border-kkn-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-serif font-bold mb-6 text-kkn-text-primary uppercase tracking-wider">Edit Anggota</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-white/50 mb-2 uppercase tracking-widest">Nama Lengkap</label>
                <input
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg uppercase text-white focus:outline-none focus:border-white/40 font-mono text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-white/50 mb-2 uppercase tracking-widest">Posisi / Jabatan</label>
                <input
                  value={editingMember.role}
                  onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg uppercase text-white focus:outline-none focus:border-white/40 font-mono text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-white/50 mb-2 uppercase tracking-widest">Jurusan / Fakultas</label>
                <input
                  value={editingMember.major}
                  onChange={(e) => setEditingMember({ ...editingMember, major: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg uppercase text-white focus:outline-none focus:border-white/40 font-mono text-sm transition-colors"
                />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
                <button
                  onClick={() => setEditingMember(null)}
                  className="px-6 py-3 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-3 rounded-lg bg-white text-black hover:bg-gray-200 transition-colors font-bold font-mono text-xs uppercase tracking-widest"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { useAdmin } from "@/hooks/useAdmin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronUp, ChevronDown, GripVertical, ArrowLeft } from "lucide-react";

type Member = {
  id?: number;
  name: string;
  role: string;
  major: string;
  avatar_url?: string;
  position?: number;
};

// Simple client-side image compression used for uploads
const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context not available"));
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Failed to create blob"));
          const newFileReader = new FileReader();
          newFileReader.onload = () => resolve(newFileReader.result as string);
          newFileReader.readAsDataURL(blob);
        }, "image/jpeg", quality);
      };
      img.onerror = reject;
      img.src = ev.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function AdminTeam() {
  const { isAdmin, loading, logoutAdmin, loginAdmin } = useAdmin();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [draggedMember, setDraggedMember] = useState<Member | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [showLoginForm, setShowLoginForm] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoading(true);
    try {
      // Query tanpa order by position dulu untuk compatibility
      const { data, error } = await supabase.from("tim-kkn").select("*");
      if (error) throw error;
      
      // Sort by position if exists, else by id
      const sortedData = (data || []).sort((a: any, b: any) => {
        const posA = a.position ?? a.id ?? 0;
        const posB = b.position ?? b.id ?? 0;
        return posA - posB;
      });
      
      setMembers(sortedData as Member[]);
    } catch (err) {
      console.error("Gagal mengambil anggota:", err);
      alert("Gagal mengambil anggota dari server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleUploadToStorage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = fileName;

    // compress and convert to Blob
    try {
      const dataUrl = await compressImage(file, 1200, 0.8);
      // convert dataUrl to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const { error: uploadError } = await supabase.storage.from("foto-profil").upload(filePath, blob, { contentType: blob.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("foto-profil").getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (err) {
      console.error("Gagal mengunggah file ke storage:", err);
      throw err;
    }
  };

  const handleAdd = async (m: Member, file?: File | null) => {
    if (!isSupabaseConfigured) {
      // local fallback: push into state with fake id
      setMembers((prev) => {
        const next = [...prev, { ...m, id: Date.now() }];
        return next;
      });
      return;
    }

    try {
      setIsLoading(true);
      let avatar_url: string | undefined = undefined;
      if (file) {
        avatar_url = await handleUploadToStorage(file);
      }

      const { data, error } = await supabase.from("tim-kkn").insert([{ name: m.name, role: m.role, major: m.major, avatar_url }]).select().single();
      if (error) throw error;
      setMembers((prev) => [...prev, data]);
      setShowForm(false);
      setSelectedFile(null);
    } catch (err: any) {
      console.error(err);
      alert("Gagal menambah anggota: " + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (m: Member, file?: File | null) => {
    if (!isSupabaseConfigured) {
      setMembers((prev) => prev.map((it) => (it.id === m.id ? m : it)));
      setEditing(null);
      return;
    }

    try {
      setIsLoading(true);
      let avatar_url = m.avatar_url;
      if (file) {
        avatar_url = await handleUploadToStorage(file);
      }

      const { error } = await supabase.from("tim-kkn").update({ name: m.name, role: m.role, major: m.major, avatar_url }).eq("id", m.id);
      if (error) throw error;
      await fetchMembers();
      setEditing(null);
      setSelectedFile(null);
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengubah anggota: " + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id?: number, photoUrl?: string) => {
    if (!confirm("Hapus anggota ini? Tindakan ini tidak dapat dibatalkan.")) return;
    if (!id) return;
    try {
      setIsLoading(true);
      const { error } = await supabase.from("tim-kkn").delete().eq("id", id);
      if (error) throw error;
      // remove file from storage if present
      if (photoUrl) {
        const parts = photoUrl.split("/");
        const fileNameInStorage = parts[parts.length - 1];
        await supabase.storage.from("foto-profil").remove([fileNameInStorage]);
      }
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      console.error(err);
      alert("Gagal menghapus anggota: " + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newMembers = [...members];
    [newMembers[index], newMembers[index - 1]] = [newMembers[index - 1], newMembers[index]];
    setMembers(newMembers);
    
    // Update positions in database
    try {
      for (let i = 0; i < newMembers.length; i++) {
        if (newMembers[i].id) {
          await supabase.from("tim-kkn").update({ position: i }).eq("id", newMembers[i].id).throwOnError();
        }
      }
    } catch (err) {
      console.error("Gagal mengupdate posisi:", err);
      // Revert on error
      await fetchMembers();
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === members.length - 1) return;
    const newMembers = [...members];
    [newMembers[index], newMembers[index + 1]] = [newMembers[index + 1], newMembers[index]];
    setMembers(newMembers);
    
    // Update positions in database
    try {
      for (let i = 0; i < newMembers.length; i++) {
        if (newMembers[i].id) {
          await supabase.from("tim-kkn").update({ position: i }).eq("id", newMembers[i].id).throwOnError();
        }
      }
    } catch (err) {
      console.error("Gagal mengupdate posisi:", err);
      // Revert on error
      await fetchMembers();
    }
  };

  const handleDragStart = (m: Member) => {
    setDraggedMember(m);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (dropMember: Member) => {
    if (!draggedMember || draggedMember.id === dropMember.id) {
      setDraggedMember(null);
      return;
    }

    const draggedIndex = members.findIndex((m) => m.id === draggedMember.id);
    const dropIndex = members.findIndex((m) => m.id === dropMember.id);

    if (draggedIndex === -1 || dropIndex === -1) {
      setDraggedMember(null);
      return;
    }

    const newMembers = [...members];
    [newMembers[draggedIndex], newMembers[dropIndex]] = [newMembers[dropIndex], newMembers[draggedIndex]];
    setMembers(newMembers);

    // Update positions in database
    try {
      for (let i = 0; i < newMembers.length; i++) {
        if (newMembers[i].id) {
          await supabase.from("tim-kkn").update({ position: i }).eq("id", newMembers[i].id).throwOnError();
        }
      }
    } catch (err) {
      console.error("Gagal mengupdate posisi:", err);
      // Revert on error
      await fetchMembers();
    }

    setDraggedMember(null);
  };

  if (loading) return <div className="py-12 text-center">Memeriksa akses admin...</div>;
  if (!isAdmin) return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-md mx-auto">
        <div className="bg-card rounded-lg shadow-md p-6 border border-border">
          <h2 className="text-2xl font-bold mb-4 text-center">Login Admin</h2>
          <p className="text-muted-foreground mb-6 text-center">Masukkan password untuk akses mode admin.</p>
          
          {!showLoginForm ? (
            <button
              onClick={() => setShowLoginForm(true)}
              className="w-full px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 mb-3"
            >
              Login Admin
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Password Admin</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full px-3 py-2 border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      loginAdmin(adminPassword);
                      setAdminPassword("");
                      setShowLoginForm(false);
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    loginAdmin(adminPassword);
                    setAdminPassword("");
                    setShowLoginForm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setShowLoginForm(false);
                    setAdminPassword("");
                  }}
                  className="flex-1 px-4 py-2 bg-muted rounded hover:bg-muted/80"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <h2 className="text-2xl font-bold">Manajemen Anggota KKN (Admin)</h2>
            <div className="flex items-center gap-2">
              <Link href="/">
                <button className="flex items-center gap-1 px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/80">
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Website
                </button>
              </Link>
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                onClick={() => logoutAdmin()}
              >
                Logout Admin
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              onClick={() => { setShowForm(true); setEditing(null); }}
            >
              Tambah Anggota
            </button>
            <button className="px-3 py-2 bg-muted rounded" onClick={() => fetchMembers()}>
              Muat Ulang
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {members.map((m, index) => (
            <div
              key={m.id}
              draggable
              onDragStart={() => handleDragStart(m)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(m)}
              className={`bg-card p-4 rounded-lg shadow-sm text-center border-2 cursor-move transition-all ${draggedMember?.id === m.id ? "border-primary opacity-60 bg-primary/5" : "border-border hover:border-primary"}`}
            >
              <div className="flex justify-center items-center gap-2 mb-3">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Avatar className="h-28 w-28">
                  <AvatarImage src={m.avatar_url || ""} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{m.name ? m.name.split(" ").map((s) => s[0]).slice(0,2).join("") : "--"}</AvatarFallback>
                </Avatar>
              </div>
              <div className="font-semibold">{m.name}</div>
              <div className="text-sm text-primary">{m.role}</div>
              <div className="text-xs text-muted-foreground mb-3">{m.major}</div>
              
              <div className="flex items-center justify-center gap-1 mb-3">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="px-2 py-1 bg-accent/10 rounded text-sm hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Pindah ke atas"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === members.length - 1}
                  className="px-2 py-1 bg-accent/10 rounded text-sm hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Pindah ke bawah"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button onClick={() => { setEditing(m); setShowForm(true); }} className="px-3 py-1 bg-accent/10 rounded text-sm hover:bg-accent/20">Edit</button>
                <button onClick={() => handleDelete(m.id, m.avatar_url)} className="px-3 py-1 bg-destructive/10 rounded text-sm hover:bg-destructive/20">Hapus</button>
              </div>
            </div>
          ))}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-card w-full max-w-lg rounded-lg p-6 border border-border">
              <h3 className="text-lg font-bold mb-4">{editing ? "Edit Anggota" : "Tambah Anggota"}</h3>
              <MemberForm
                initial={editing}
                onCancel={() => { setShowForm(false); setEditing(null); setSelectedFile(null); }}
                onSave={async (payload, file) => {
                  if (editing) await handleUpdate({ ...editing, ...payload }, file || null);
                  else await handleAdd(payload, file || null);
                }}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MemberForm({ initial, onCancel, onSave, isLoading }: { initial?: Member | null; onCancel: () => void; onSave: (m: Member, file?: File | null) => Promise<void>; isLoading?: boolean; }) {
  const [name, setName] = useState((initial?.name || "").toUpperCase());
  const [role, setRole] = useState((initial?.role || "").toUpperCase());
  const [major, setMajor] = useState((initial?.major || "").toUpperCase());
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-muted-foreground mb-1">Nama Lengkap</label>
        <input value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="w-full px-3 py-2 bg-background border border-border rounded uppercase" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Inisial tidak diperlukan — dihitung otomatis dari nama */}
        <div>
          <label className="block text-sm text-muted-foreground mb-1">Posisi</label>
          <input value={role} onChange={(e) => setRole(e.target.value.toUpperCase())} className="w-full px-3 py-2 bg-background border border-border rounded uppercase" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-muted-foreground mb-1">Jurusan / Fakultas</label>
        <input value={major} onChange={(e) => setMajor(e.target.value.toUpperCase())} className="w-full px-3 py-2 bg-background border border-border rounded uppercase" />
      </div>
      <div>
        <label className="block text-sm text-muted-foreground mb-1">Foto Profil (opsional)</label>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>
      <div className="flex justify-end gap-3 mt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded bg-muted">Batal</button>
        <button
          onClick={() => onSave({ name, role, major }, file)}
          disabled={isLoading || !name}
          className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-60"
        >
          {isLoading ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}

export default AdminTeam;

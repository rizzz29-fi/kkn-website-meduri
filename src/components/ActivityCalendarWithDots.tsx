import { useState, useEffect, useCallback, useMemo } from "react";
import { X, Upload, Save, Trash2 } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

type Activity = {
  tanggal: string;
  judul?: string;
  deskripsi?: string;
  foto_url?: string;
};

const parsePhotos = (urlStr?: string | null): string[] => {
  if (!urlStr) return [];
  try {
    const parsed = JSON.parse(urlStr);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    if (urlStr.includes(',')) return urlStr.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [urlStr];
};

const compressImage = async (
  file: File,
  maxWidth = 1200,
  quality = 0.7
): Promise<Blob> => {
  try {
    const bitmap = await createImageBitmap(file);
    let w = bitmap.width;
    let h = bitmap.height;
    if (w > maxWidth) {
      h = Math.round((h * maxWidth) / w);
      w = maxWidth;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Cannot get canvas context");
    ctx.drawImage(bitmap, 0, 0, w, h);
    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Failed to compress image")),
        "image/jpeg",
        quality
      )
    );
  } catch (e) {
    return await new Promise((resolve, reject) => {
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
          if (!ctx) return reject(new Error("Cannot get canvas context"));
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("Failed to compress image"));
              resolve(blob);
            },
            "image/jpeg",
            quality
          );
        };
        img.src = ev.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};

const ACW_STYLES = `
@keyframes acw-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes acw-backdrop-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes acw-modal-in { from { opacity: 0; transform: translateY(24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes acw-modal-out { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(16px) scale(0.97); } }
@keyframes acw-content-fade-out { from { opacity: 1; } to { opacity: 0.3; } }
@keyframes acw-confirm-in { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
.acw-backdrop-enter { animation: acw-backdrop-in 0.2s ease-out forwards; will-change: opacity; }
.acw-backdrop-exit { animation: acw-backdrop-out 0.2s ease-in forwards; will-change: opacity; }
.acw-modal-enter { animation: acw-modal-in 0.25s cubic-bezier(0.16,1,0.3,1) forwards; will-change: transform, opacity; }
.acw-modal-exit { animation: acw-modal-out 0.2s cubic-bezier(0.16,1,0.3,1) forwards; will-change: transform, opacity; }
.acw-content-deleting { animation: acw-content-fade-out 0.3s ease forwards; }
.acw-confirm-enter { animation: acw-confirm-in 0.2s cubic-bezier(0.16,1,0.3,1) forwards; }
`;

export default function ActivityCalendarWithDots() {
  const { isAdmin } = useAdmin();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [modalClosing, setModalClosing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  const months = useMemo(
    () => [
      { year: 2026, month: 6 },
      { year: 2026, month: 7 },
    ],
    []
  );

  const buildMonthGrid = useCallback((year: number, month: number) => {
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDay; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1)
      cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }, []);

  const activityMap = useMemo(() => {
    const map = new Map<string, Activity>();
    activities.forEach((activity) => map.set(activity.tanggal, activity));
    return map;
  }, [activities]);

  const fetchActivities = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from("aktivitas_kkn")
        .select("tanggal, judul, deskripsi, foto_url");
      if (error) {
        console.error("Error fetching activities:", error);
        return;
      }
      setActivities((data || []) as Activity[]);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const openModal = useCallback(
    (dateStr: string) => {
      const activity = activityMap.get(dateStr) || null;
      setSelectedDate(dateStr);
      setSelectedActivity(activity);
      setEditTitle(activity?.judul || "");
      setEditDescription(activity?.deskripsi || "");
      setSelectedFiles([]);
      setShowDeleteConfirm(false);
      setIsDeleting(false);
      setPhotoToDelete(null);
      setModalClosing(false);
    },
    [activityMap]
  );

  const closeModal = useCallback(() => {
    setModalClosing(true);
    setTimeout(() => {
      setSelectedDate(null);
      setSelectedActivity(null);
      setModalClosing(false);
      setShowDeleteConfirm(false);
      setPhotoToDelete(null);
      setIsDeleting(false);
      setSelectedFiles([]);
    }, 250);
  }, []);

  const handleUploadPhoto = useCallback(async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const blob = await compressImage(file, 1200, 0.8);

    const { error: uploadError } = await supabase.storage
      .from("foto-aktivitas")
      .upload(fileName, blob, { contentType: blob.type });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("foto-aktivitas")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }, []);

  const handleSaveActivity = useCallback(async () => {
    if (!selectedDate || !isAdmin) return;
    setIsSaving(true);

    try {
      let existingPhotos = parsePhotos(selectedActivity?.foto_url);

      if (selectedFiles.length > 0) {
        setIsUploading(true);
        try {
          const newPhotos = await Promise.all(selectedFiles.map(f => handleUploadPhoto(f)));
          existingPhotos = [...existingPhotos, ...newPhotos];
        } finally {
          setIsUploading(false);
        }
      }

      const foto_url_to_save = existingPhotos.length > 0 ? JSON.stringify(existingPhotos) : null;

      const payload = {
        tanggal: selectedDate,
        judul: editTitle || null,
        deskripsi: editDescription || null,
        foto_url: foto_url_to_save,
      };

      const { data, error } = await supabase
        .from("aktivitas_kkn")
        .upsert(payload, { onConflict: 'tanggal' })
        .select();

      if (error) throw error;

      console.log("Activity saved successfully:", data);
      await fetchActivities();
      closeModal();
    } catch (error) {
      console.error("Gagal menyimpan dokumentasi:", error);
      alert("Gagal menyimpan dokumentasi aktivitas.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
      setSelectedFiles([]);
    }
  }, [
    selectedDate,
    isAdmin,
    selectedActivity,
    selectedFiles,
    editTitle,
    editDescription,
    handleUploadPhoto,
    fetchActivities,
    closeModal,
  ]);

  const handleDeletePhoto = useCallback(async (urlToDelete: string) => {
    if (!selectedDate || !isAdmin || !selectedActivity) return;
    setIsDeletingPhoto(true);

    try {
      // Hapus foto dari storage
      const fileName = urlToDelete.split("/").pop();

      if (fileName) {
        const { error: deleteStorageError } = await supabase.storage
          .from("foto-aktivitas")
          .remove([fileName]);

        if (deleteStorageError) {
          console.error("Delete storage error:", deleteStorageError);
          // continue to remove from DB even if storage delete fails
        }
      }

      // Update database: set foto_url to null
      let existingPhotos = parsePhotos(selectedActivity.foto_url);
      existingPhotos = existingPhotos.filter(u => u !== urlToDelete);
      const new_foto_url = existingPhotos.length > 0 ? JSON.stringify(existingPhotos) : null;

      const { error: updateError } = await supabase
        .from("aktivitas_kkn")
        .update({ foto_url: new_foto_url })
        .eq("tanggal", selectedDate);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      await fetchActivities();
      setPhotoToDelete(null);
      console.log("Photo deleted successfully");
    } catch (error) {
      console.error("Gagal menghapus foto:", error);
      console.error("Detail Error Lengkap:", error);
      alert("Gagal menghapus foto dokumentasi.");
    } finally {
      setIsDeletingPhoto(false);
    }
  }, [selectedActivity, selectedDate, isAdmin, fetchActivities]);

  const handleDeleteActivity = useCallback(async () => {
    if (!selectedDate || !isAdmin || !selectedActivity) return;
    setIsDeleting(true);

    try {
      // Hapus foto dari storage jika ada
      const photos = parsePhotos(selectedActivity.foto_url);
      for (const url of photos) {
        const fileName = url.split("/").pop();
        if (fileName) {
          const { error: deleteStorageError } = await supabase.storage
            .from("foto-aktivitas")
            .remove([fileName]);

          if (deleteStorageError) {
            console.error("Delete storage error:", deleteStorageError);
          }
        }
      }

      // Hapus record dari database
      const { error: deleteDbError } = await supabase
        .from("aktivitas_kkn")
        .delete()
        .eq("tanggal", selectedDate);

      if (deleteDbError) {
        console.error("Delete database error:", deleteDbError);
        throw deleteDbError;
      }

      await fetchActivities();
      closeModal();
    } catch (error) {
      console.error("Gagal menghapus dokumentasi:", error);
      console.error("Detail Error Lengkap:", error);
      alert("Gagal menghapus dokumentasi aktivitas.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [selectedDate, isAdmin, selectedActivity, fetchActivities, closeModal]);

  useEffect(() => {
    const id = "acw-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = ACW_STYLES;
      document.head.appendChild(s);
    }
    return () => {
      const el = document.getElementById("acw-styles");
      if (el) el.remove();
    };
  }, []);

  return (
    <div className="mb-10 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-kkn-text-primary">
            Kalender Aktivitas
          </h3>
          <p className="text-base text-kkn-text-primary font-medium mt-1">
            Ketuk pada tanggal untuk melihat atau mengelola dokumentasi aktivitas. Admin bisa mengunggah foto dan menyimpan catatan.
          </p>
        </div>
      </div>

      {useMemo(
        () => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {months.map(({ year, month }) => {
              const weeks = buildMonthGrid(year, month);
              const monthName = new Date(year, month, 1).toLocaleString(
                "id-ID",
                { month: "long" }
              );
              return (
                <div
                  key={`${year}-${month}`}
                  className="bg-kkn-card rounded-2xl shadow-sm border border-kkn-border p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-bold text-kkn-text-light">
                      {monthName} {year}
                    </div>
                    <div className="h-1 w-20 bg-kkn-accent-1 rounded-full" />
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-center text-xs text-kkn-bg-primary/70 mb-3 font-semibold uppercase tracking-wider">
                    {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                      (d) => (
                        <div key={d}>{d}</div>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {weeks.map((week, wi) => (
                      <div key={wi} className="contents">
                        {week.map((date, di) => {
                          if (!date) return <div key={di} className="p-2" />;
                          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                          const activity = activityMap.get(dateStr);
                          const hasData = !!activity;
                          const photos = parsePhotos(activity?.foto_url);
                          const hasPhoto = photos.length > 0;
                          const firstPhoto = photos[0];
                          return (
                            <button
                              key={di}
                              onClick={() => openModal(dateStr)}
                              style={hasPhoto ? {
                                backgroundImage: `url(${firstPhoto})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center"
                              } : {}}
                              className={`p-2 rounded-xl text-sm border font-medium relative cursor-pointer hover:shadow-md hover:scale-105 transition-all overflow-hidden flex flex-col items-center justify-center min-h-[44px] ${hasData && !hasPhoto
                                ? "bg-kkn-text-light text-kkn-text-primary border-kkn-text-light shadow-[0_0_15px_color-mix(in_srgb,var(--kkn-text-light)_40%,transparent)]"
                                : "bg-kkn-text-light text-kkn-text-primary border-kkn-text-light"
                                } ${hasPhoto ? "border-transparent shadow-md" : ""}`}
                            >
                              {hasPhoto && (
                                <div className="absolute inset-0 bg-black/40 z-0"></div>
                              )}
                              <div className={`relative z-10 ${hasPhoto ? "text-white font-bold drop-shadow-md text-base" : ""}`}>
                                {date.getDate()}
                              </div>
                              {hasData && !hasPhoto && (
                                <div className="flex justify-center gap-1 mt-1 relative z-10">
                                  <div className="w-1.5 h-1.5 bg-kkn-bg-dark rounded-full" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ),
        [months, buildMonthGrid, activityMap, openModal]
      )}

      {selectedDate && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto ${modalClosing ? "acw-backdrop-exit" : "acw-backdrop-enter"
            }`}
          style={{ backgroundColor: "color-mix(in srgb, var(--kkn-bg-dark) 85%, transparent)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className={`rounded-2xl max-w-2xl w-full p-6 shadow-xl my-8 border ${modalClosing ? "acw-modal-exit" : "acw-modal-enter"
              }`}
            style={{ backgroundColor: 'var(--kkn-card-light)', borderColor: 'var(--kkn-border)' }}
          >
            <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid var(--kkn-border)' }}>
              <h4 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--kkn-text-primary)' }}>
                Dokumentasi:{" "}
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h4>
              <button
                onClick={closeModal}
                className="p-2 rounded-full transition-colors"
                style={{ color: 'var(--kkn-text-primary)', opacity: 0.6, transition: "all 0.15s ease" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className={`space-y-6 ${isDeleting ? "acw-content-deleting" : ""}`}
              style={{ transition: "opacity 0.3s ease" }}
            >
              {isAdmin ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--kkn-text-primary)' }}>
                      Judul Kegiatan
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Contoh: Rapat Koordinasi Desa"
                      className="w-full rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
                      style={{ background: 'var(--kkn-bg-primary)', color: 'var(--kkn-text-primary)', border: '1px solid var(--kkn-border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--kkn-text-primary)' }}>
                      Deskripsi Singkat
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Tuliskan catatan atau deskripsi kegiatan di hari ini..."
                      rows={4}
                      className="w-full rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
                      style={{ background: 'var(--kkn-bg-primary)', color: 'var(--kkn-text-primary)', border: '1px solid var(--kkn-border)' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedActivity ? (
                    <>
                      <h5 className="text-lg font-bold text-foreground">
                        {selectedActivity.judul || "Kegiatan KKN"}
                      </h5>
                      {selectedActivity.deskripsi ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2 leading-relaxed">
                          {selectedActivity.deskripsi}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">
                          Belum ada dokumentasi aktivitas untuk hari ini.
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Belum ada dokumentasi aktivitas untuk hari ini.
                    </div>
                  )}
                </div>
              )}

              {isAdmin && (
                <div className="border-t border-border pt-6">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Unggah Foto Kegiatan
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) =>
                        setSelectedFiles(Array.from(e.target.files || []))
                      }
                      className="hidden"
                      id={`upload-${selectedDate}`}
                    />
                    <label
                      htmlFor={`upload-${selectedDate}`}
                      className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:bg-muted/50"
                    >
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground text-center">
                        Klik atau pilih foto kegiatan untuk diunggah (bisa lebih dari satu)
                      </span>
                      {selectedFiles.length > 0 && (
                        <span className="text-xs text-foreground font-semibold">
                          {selectedFiles.length} file dipilih
                        </span>
                      )}
                      {isUploading && (
                        <span className="text-xs text-muted-foreground mt-2">
                          Mengunggah...
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {parsePhotos(selectedActivity?.foto_url).length > 0 ? (
                <div className="pt-4 border-t border-border mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h6 className="text-sm font-bold text-foreground">
                      Foto Dokumentasi ({parsePhotos(selectedActivity?.foto_url).length})
                    </h6>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {parsePhotos(selectedActivity?.foto_url).map((url, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-border shadow-sm group bg-muted">
                        <img
                          src={url}
                          alt={`Foto dokumentasi ${idx + 1}`}
                          className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        {isAdmin && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            {photoToDelete !== url ? (
                              <button
                                onClick={(e) => { e.preventDefault(); setPhotoToDelete(url); }}
                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transform hover:scale-110 transition-transform"
                                title="Hapus Foto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <div className="flex flex-col gap-2 items-center bg-background/95 p-3 rounded-xl shadow-xl">
                                <span className="text-xs font-bold text-red-500">Hapus?</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => { e.preventDefault(); handleDeletePhoto(url); }}
                                    className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-md hover:bg-red-700 disabled:opacity-50"
                                    disabled={isDeletingPhoto}
                                  >
                                    Ya
                                  </button>
                                  <button
                                    onClick={(e) => { e.preventDefault(); setPhotoToDelete(null); }}
                                    className="px-3 py-1 bg-muted text-muted-foreground text-xs font-bold rounded-md hover:bg-muted-foreground hover:text-white"
                                  >
                                    Batal
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {isAdmin && (
                <div className="flex flex-col gap-3 pt-6 border-t border-border">
                  <button
                    onClick={handleSaveActivity}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Menyimpan..." : "Simpan Dokumentasi"}
                  </button>
                  {selectedActivity && (
                    <>
                      {!showDeleteConfirm ? (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
                        >
                          <Trash2 className="w-4 h-4" />
                          Hapus Dokumentasi
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 acw-confirm-enter">
                          <span className="text-xs text-red-400 font-medium">
                            Yakin hapus?
                          </span>
                          <button
                            onClick={handleDeleteActivity}
                            disabled={isDeleting}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted text-muted-foreground hover:bg-muted/80"
                          >
                            Batal
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

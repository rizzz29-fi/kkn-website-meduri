import { useState, useEffect, useCallback } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ActivityCalendarWithDots from "./ActivityCalendarWithDots";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabaseClient";
import { EditableText } from "./EditableText";

type Photo = {
  id?: number;
  src: string;
  alt: string;
  className: string;
};

export function Gallery() {
  const { isAdmin } = useAdmin();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);

  // 1. Ambil data foto dari database Supabase saat halaman dibuka
  const fetchPhotos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("galeri")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Bungkus data dari Supabase sesuai format komponen UI
        const mappedPhotos = data.map((item: any) => ({
          id: item.id,
          src: item.image_url,
          alt: item.title || "Dokumentasi KKN",
          className: "col-span-1 row-span-1",
        }));
        setPhotos(mappedPhotos);
      } else {
        setPhotos([]);
      }
    } catch (err) {
      console.error("Gagal mengambil data galeri:", err);
      setPhotos([]);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();

    // Tutup lightbox dengan tombol Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fetchPhotos]);

  // 2. Fungsi Upload Foto Baru ke Supabase Storage & Database
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      try {
        for (const file of Array.from(files)) {
          // Buat nama file unik agar tidak bentrok di storage Supabase
          const fileExt = file.name.split(".").pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          // A. Upload file gambar asli ke Supabase Storage Bucket 'galeri-kkn'
          const { error: uploadError } = await supabase.storage
            .from("galeri-kkn")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // B. Ambil link URL publik dari gambar yang barusan di-upload
          const { data: urlData } = supabase.storage
            .from("galeri-kkn")
            .getPublicUrl(filePath);

          const publicUrl = urlData.publicUrl;

          // Tanya user via popup browser untuk judul fotonya
          const titleInput = prompt("Masukkan judul/keterangan untuk foto ini:", "Kegiatan KKN Desa Meduri");
          const photoTitle = titleInput || "Dokumentasi KKN";

          // C. Simpan link gambar dan judulnya ke dalam tabel 'galeri'
          const { error: insertError } = await supabase
            .from("galeri")
            .insert([{ title: photoTitle, image_url: publicUrl }]);

          if (insertError) throw insertError;
        }

        // Ambil data terbaru dari server agar tampilan langsung berubah otomatis
        await fetchPhotos();
        alert("Foto berhasil diunggah ke database KKN!");
      } catch (err: any) {
        console.error("Error upload:", err);
        alert(`Gagal mengunggah foto: ${err.message || err}`);
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    },
    [fetchPhotos]
  );

  // 3. Fungsi Hapus Foto dari Database Supabase
  const handleDeleteImage = useCallback(
    async (photoId: number | undefined, imageSrc: string, e: React.MouseEvent) => {
      e.stopPropagation();

      if (!photoId) {
        alert("Foto bawaan awal tidak bisa dihapus dari database server.");
        return;
      }

      const konfirmasi = confirm("Apakah kamu yakin ingin menghapus foto kegiatan ini?");
      if (!konfirmasi) return;

      try {
        // A. Hapus data baris dari tabel 'galeri' berdasarkan ID
        const { error: dbError } = await supabase
          .from("galeri")
          .delete()
          .eq("id", photoId);

        if (dbError) throw dbError;

        // B. Ekstrak nama file asli dari URL untuk menghapusnya juga dari Storage
        // Contoh URL: .../storage/v1/object/public/galeri-kkn/namafile.jpg
        const parts = imageSrc.split("/");
        const fileNameInStorage = parts[parts.length - 1];

        await supabase.storage
          .from("galeri-kkn")
          .remove([fileNameInStorage]);

        // Muat ulang daftar foto terbaru
        await fetchPhotos();
        alert("Foto berhasil dihapus!");
      } catch (err: any) {
        console.error("Gagal menghapus foto:", err);
        alert(`Gagal menghapus: ${err.message}`);
      }
    },
    [fetchPhotos]
  );

  return (
    <section id="gallery" className="py-24 bg-kkn-bg-primary text-kkn-text-primary">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <EditableText
            as="h2"
            id="gallery_title"
            defaultText="Galeri Kegiatan"
            className="text-3xl md:text-4xl font-serif font-bold text-kkn-text-primary block"
          />
          <div className="w-20 h-1 bg-kkn-text-primary mx-auto rounded-full"></div>
          <EditableText
            as="p"
            id="gallery_desc"
            defaultText="Momen-momen berharga selama kami mengabdi di Desa Meduri."
            className="text-base md:text-lg text-kkn-text-primary font-medium block"
          />
        </motion.div>

        <ActivityCalendarWithDots />

        {isAdmin && (
          <div className="flex justify-center mt-4 mb-12">
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="upload-gallery"
                disabled={isUploading}
              />
              <label
                htmlFor="upload-gallery"
                className="flex items-center gap-2 px-6 py-3 bg-kkn-card text-kkn-text-light font-semibold rounded-full shadow-md hover:bg-kkn-card/90 cursor-pointer transition-all"
              >
                <Upload className="h-5 w-5" />
                {isUploading ? "Mengunggah ke Server..." : "Tambah Foto Galeri"}
              </label>
            </div>
          </div>
        )}

        {photos.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 bg-kkn-text-primary/10 rounded-full flex items-center justify-center mb-6 text-kkn-text-primary">
              <Upload className="h-8 w-8 text-kkn-text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-kkn-text-primary mb-2">
              Belum Ada Foto
            </h3>
            <p className="text-kkn-text-primary/80 max-w-md">
              Foto-foto kegiatan KKN akan muncul di sini setelah diunggah oleh admin.
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: "-100px" }}
            transition={{ duration: 0.8, staggerChildren: 0.1 }}
          >
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id || i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative overflow-hidden rounded-xl cursor-pointer group ${photo.className}`}
                onClick={() => setSelectedImage(photo.src)}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white font-medium px-4 text-center">
                    {photo.alt}
                  </span>
                </div>
                {isAdmin && photo.id && (
                  <button
                    onClick={(e) => handleDeleteImage(photo.id, photo.src, e)}
                    title="Hapus foto ini"
                    className="absolute top-3 right-3 bg-red-500/90 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 hover:bg-red-600 shadow-lg"
                    style={{ transition: "all 0.2s ease" }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[101]"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-8 w-8" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={selectedImage}
              alt="Momen kegiatan"
              className="max-w-full max-h-[90vh] object-contain rounded-md"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
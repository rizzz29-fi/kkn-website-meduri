import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/lib/supabaseClient';
import { ImagePlus, Loader2 } from 'lucide-react';

interface EditableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  id: string;
  defaultSrc: string;
}

export function EditableImage({ 
  id, 
  defaultSrc, 
  className = '',
  ...props 
}: EditableImageProps) {
  const { isAdmin } = useAdmin();
  const [src, setSrc] = useState<string>(defaultSrc);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ambil gambar dari Supabase Storage saat komponen dimuat
  useEffect(() => {
    let isMounted = true;
    
    const fetchImage = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('galeri-kkn')
          .list('editable', { search: id });
          
        if (error) throw error;

        // Cari file yang namanya dimulai dengan id komponen ini
        const file = data?.find(f => f.name.startsWith(id));
        
        if (file && isMounted) {
          const { data: urlData } = supabase.storage
            .from('galeri-kkn')
            .getPublicUrl(`editable/${file.name}`);
            
          // Tambahkan timestamp untuk menghindari browser cache jika gambar diganti
          const timestamp = new Date(file.updated_at || '').getTime();
          setSrc(`${urlData.publicUrl}?t=${timestamp}`);
        }
      } catch (err) {
        console.error('Error fetching image:', err);
      }
    };

    fetchImage();
    
    return () => { isMounted = false; };
  }, [id]);

  const handleImageClick = (e: React.MouseEvent) => {
    if (!isAdmin || isUploading) return;
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Hapus file lama di bucket (jika ada) agar tidak terjadi penumpukan storage
      const { data: existingFiles } = await supabase.storage
        .from('galeri-kkn')
        .list('editable', { search: id });
        
      if (existingFiles && existingFiles.length > 0) {
        const filesToRemove = existingFiles
          .filter(f => f.name.startsWith(id))
          .map(f => `editable/${f.name}`);
        if (filesToRemove.length > 0) {
          await supabase.storage.from('galeri-kkn').remove(filesToRemove);
        }
      }

      // 2. Upload file baru dengan nama yang spesifik dan ekstensi aslinya
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}.${fileExt}`;
      const filePath = `editable/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('galeri-kkn')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 3. Dapatkan URL publik yang baru
      const { data: urlData } = supabase.storage
        .from('galeri-kkn')
        .getPublicUrl(filePath);

      const timestamp = new Date().getTime();
      setSrc(`${urlData.publicUrl}?t=${timestamp}`);
      
    } catch (err: any) {
      console.error('Error upload:', err);
      alert(`Gagal mengunggah foto: ${err.message || err}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isAdmin) {
    return (
      <img 
        src={src} 
        className={className} 
        {...props} 
        onError={(e) => { e.currentTarget.src = defaultSrc; }} 
      />
    );
  }

  return (
    <>
      <div 
        className={`absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-pointer ${isUploading ? 'opacity-100' : ''}`}
        onClick={handleImageClick}
      >
        {isUploading ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : (
          <div className="flex flex-col items-center text-white">
            <ImagePlus className="w-8 h-8 mb-2 drop-shadow-md" />
            <span className="text-sm font-semibold drop-shadow-md">Ubah Gambar</span>
          </div>
        )}
      </div>
      <img 
        src={src} 
        className={`${className} ${isAdmin ? 'relative z-10' : ''}`} 
        {...props} 
        onError={(e) => { e.currentTarget.src = defaultSrc; }} 
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </>
  );
}

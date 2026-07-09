import { useState, useMemo, useEffect } from "react";
import { EditableText } from "./EditableText";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Leaf, Users, Target, Navigation } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { getTextContent, saveTextContent } from "@/lib/storage";
export type Kegiatan = {
  nama: string;
  tahapan: string[];
  kolaborasi?: string;
  sasaran?: string;
  arahProgram?: string;
  status?: "belum_dimulai" | "berjalan" | "selesai";
};

export type Proker = {
  potensi: string;
  namaProker: string;
  deskripsiProker?: string;
  kegiatan: Kegiatan[];
};

const INITIAL_PROGRAMS: Proker[] = [
  {
    potensi: "Jagung",
    namaProker: "JAGUNG EMAS",
    deskripsiProker: "Jagung Ekonomi Mandiri dan Sustainable",
    kegiatan: [
      {
        nama: "Diversifikasi produk",
        tahapan: [
          "Sosialisasi terkait olahan jagung",
          "Pelatihan Pembuatan produk yaitu briket dan makanan olahan jagung"
        ],
        kolaborasi: "P4S/BCH",
        sasaran: "Karang taruna, PKK",
        status: "belum_dimulai"
      },
      {
        nama: "Ekspansi Pemasaran",
        tahapan: [
          "Pembuatan Google Bussines di UMKM olahan jagung",
          "Distribusi penjualan produk olahan jagung",
          "Pembuatan marketplace dan sosial media UMKM olahan jagung"
        ],
        sasaran: "UMKM",
        arahProgram: "Pertanian, UMKM, Kemiskinan, Pemberdayaan Masyarakat",
        status: "belum_dimulai"
      },
      {
        nama: "Perizinan terkait produk",
        tahapan: [
          "Pendataan UMKM di Desa Meduri",
          "Pembuatan NIB"
        ],
        sasaran: "Pelaku UMKM di Desa Meduri",
        status: "belum_dimulai"
      }
    ]
  },
  {
    potensi: "Kesenian",
    namaProker: "NGLARAS",
    deskripsiProker: "Nguri Nguri lan Regenerasi Seni Gembrung",
    kegiatan: [
      {
        nama: "Regenerasi",
        tahapan: [
          "Pembuatan video pengenalan alat musik",
          "Pengenalan alat musik",
          "Pelatihan dan Berkunjung ke Kelompok Gembrung"
        ],
        sasaran: "Siswa siswi SD",
        arahProgram: "Wisata dan Potensi Lokal",
        status: "belum_dimulai"
      }
    ]
  },
  {
    potensi: "Kebencanaan dan Kekeringan",
    namaProker: "MEDURI LESTARI",
    deskripsiProker: "Melestarikan Ekosistem Desa melalui Edukasi, Resiliensi dan Aksi Konservasi",
    kegiatan: [
      {
        nama: "Penanaman Pohon",
        tahapan: ["Menanam pohon bersama di lokasi yang sudah ditentukan"],
        sasaran: "perangkat desa dan masyarakat",
        status: "belum_dimulai"
      },
      {
        nama: "Biopori",
        tahapan: ["Sosialisasi dan pembuatan biopori untuk mencegah kekeringan"],
        sasaran: "masyarakat",
        arahProgram: "Kebencanaan dan Kekeringan, Hayati",
        status: "belum_dimulai"
      },
      {
        nama: "Peta Rawan Bencana",
        tahapan: ["Pembuatan peta rawan bencana"],
        status: "belum_dimulai"
      },
      {
        nama: "Buku tentang Flora Fauna Meduri",
        tahapan: ["Pembuatan buku tentang flora dan fauna lokal"],
        sasaran: "masyarakat dan anak-anak SD",
        status: "belum_dimulai"
      }
    ]
  },
  {
    potensi: "Kemiskinan",
    namaProker: "AKSARA",
    deskripsiProker: "Aksi sadar Pendidikan",
    kegiatan: [
      {
        nama: "Sosialisasi Pentingnya Pendidikan",
        tahapan: [],
        sasaran: "siswa siswi SD",
        arahProgram: "Kemiskinan",
        status: "belum_dimulai"
      }
    ]
  }
];


function KegiatanStatusBadge({ 
  defaultStatus, 
  statusId 
}: { 
  defaultStatus: "belum_dimulai" | "berjalan" | "selesai", 
  statusId: string 
}) {
  const { isAdmin } = useAdmin();
  const [status, setStatus] = useState<"belum_dimulai" | "berjalan" | "selesai">(defaultStatus);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const cached = getTextContent(statusId);
    if (cached === "belum_dimulai" || cached === "berjalan" || cached === "selesai") {
      setStatus(cached as "belum_dimulai" | "berjalan" | "selesai");
    }
  }, [statusId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as "belum_dimulai" | "berjalan" | "selesai";
    setStatus(newStatus);
    saveTextContent(statusId, newStatus);
  };

  if (!isClient) return null;

  if (isAdmin) {
    return (
      <select 
        value={status} 
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()} 
        className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider outline-none cursor-pointer ${
          status === 'selesai' ? 'bg-green-100 text-green-700 border border-green-200' :
          status === 'berjalan' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
          'bg-slate-100 text-slate-600 border border-slate-200'
        }`}
      >
        <option value="belum_dimulai">Belum Dimulai</option>
        <option value="berjalan">Sedang Berjalan</option>
        <option value="selesai">Selesai</option>
      </select>
    );
  }

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap ${
      status === 'selesai' ? 'bg-green-100 text-green-700 border border-green-200' :
      status === 'berjalan' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
      'bg-slate-100 text-slate-600 border border-slate-200'
    }`}>
      {status === 'selesai' ? 'Selesai' : status === 'berjalan' ? 'Sedang Berjalan' : 'Belum Dimulai'}
    </span>
  );
}

export function Programs() {
  const [activePotensi, setActivePotensi] = useState("Semua");
  
  // Use INITIAL_PROGRAMS directly as there is no admin status edit anymore
  const programs = INITIAL_PROGRAMS;

  const potensiList = ["Semua", "Jagung", "Kesenian", "Kebencanaan dan Kekeringan", "Kemiskinan"];

  const filteredPrograms = useMemo(() => {
    if (activePotensi === "Semua") return programs;
    return programs.filter(p => p.potensi === activePotensi);
  }, [activePotensi, programs]);

  return (
    <section id="programs" className="py-24 bg-kkn-bg-primary text-kkn-text-primary">
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
            id="programs_title"
            defaultText="Program Kerja"
            className="text-3xl md:text-4xl font-serif font-bold text-kkn-text-light block"
          />
          <div className="w-20 h-1 bg-kkn-accent-2 mx-auto rounded-full"></div>
          <EditableText
            as="p"
            id="programs_desc"
            defaultText="Inisiatif dan kegiatan yang kami lakukan untuk mengoptimalkan potensi Desa Meduri di berbagai bidang."
            className="text-kkn-text-light/90 block"
          />
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-12">
          {/* Left Sidebar (Tabs) */}
          <div className="w-full lg:w-1/4 flex flex-row overflow-x-auto gap-2 pb-4 scrollbar-none shrink-0 lg:flex-col lg:space-y-2 lg:overflow-x-visible lg:pb-0">
            {potensiList.map((potensi) => (
              <button
                key={potensi}
                onClick={() => setActivePotensi(potensi)}
                className={`text-center lg:text-left px-4 py-3 lg:px-6 lg:py-4 rounded-xl font-bold transition-all whitespace-nowrap text-sm lg:text-base border-2 ${
                  activePotensi === potensi
                    ? "bg-kkn-bg-dark text-kkn-text-light border-transparent shadow-md"
                    : "bg-kkn-card-light text-kkn-text-primary/70 border-transparent hover:bg-kkn-card-light/80 hover:text-kkn-text-primary hover:border-kkn-accent-1/30"
                }`}
              >
                {potensi}
              </button>
            ))}
          </div>

          {/* Right Content Area */}
          <div className="w-full lg:w-3/4">
            <motion.div layout className="flex flex-col gap-6">
              <AnimatePresence mode="popLayout">
                {filteredPrograms.map((proker, i) => (
                  <motion.div
                    key={`${proker.namaProker}-${i}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-kkn-card-light rounded-2xl p-6 md:p-8 border border-kkn-accent-1/20 shadow-sm"
                  >
                    <div className="mb-6 border-b border-black/5 pb-6">
                      <span className="text-xs font-bold uppercase tracking-widest text-kkn-accent-1 mb-2 block">
                        Potensi: {proker.potensi}
                      </span>
                      <h3 className="text-2xl md:text-3xl font-bold text-kkn-text-primary mb-2 leading-tight">
                        {proker.namaProker}
                      </h3>
                      {proker.deskripsiProker && (
                        <p className="text-base text-kkn-text-primary/70 font-medium">
                          {proker.deskripsiProker}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-lg text-kkn-bg-dark flex items-center gap-2">
                        <Leaf className="w-5 h-5 text-kkn-accent-2" />
                        Daftar Kegiatan
                      </h4>
                      <Accordion type="single" collapsible className="w-full space-y-3">
                        {proker.kegiatan.map((keg, idx) => (
                          <AccordionItem
                            key={idx}
                            value={`item-${idx}`}
                            className="bg-white/50 border border-black/5 rounded-xl px-4 data-[state=open]:bg-white data-[state=open]:shadow-sm transition-all"
                          >
                            <AccordionTrigger className="hover:no-underline py-4 text-left font-bold text-base md:text-lg text-kkn-text-primary">
                              <div className="flex items-center gap-3">
                                <span>{keg.nama}</span>
                                <KegiatanStatusBadge 
                                  defaultStatus={keg.status || 'belum_dimulai'} 
                                  statusId={`status_${proker.namaProker.replace(/\s+/g, '_')}_${keg.nama.replace(/\s+/g, '_')}`} 
                                />
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-4 pt-1 text-kkn-text-primary/80 space-y-4">
                              {keg.tahapan && keg.tahapan.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-xs font-bold uppercase tracking-widest text-kkn-accent-1 flex items-center gap-1.5">
                                    Tahapan Kegiatan
                                  </div>
                                  <ul className="list-decimal list-inside space-y-1 ml-1">
                                    {keg.tahapan.map((t, tIdx) => (
                                      <li key={tIdx} className="text-sm">{t}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              <div className="flex flex-wrap gap-4 pt-2">
                                {keg.sasaran && (
                                  <div className="flex-1 min-w-[200px] bg-kkn-bg-primary/50 p-3 rounded-lg border border-black/5">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-kkn-text-primary/50 flex items-center gap-1 mb-1">
                                      <Target className="w-3 h-3" /> Sasaran
                                    </div>
                                    <div className="text-sm font-medium">{keg.sasaran}</div>
                                  </div>
                                )}
                                
                                {keg.kolaborasi && (
                                  <div className="flex-1 min-w-[200px] bg-kkn-bg-primary/50 p-3 rounded-lg border border-black/5">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-kkn-text-primary/50 flex items-center gap-1 mb-1">
                                      <Users className="w-3 h-3" /> Kolaborasi
                                    </div>
                                    <div className="text-sm font-medium">{keg.kolaborasi}</div>
                                  </div>
                                )}
                                
                                {keg.arahProgram && (
                                  <div className="flex-1 min-w-[200px] bg-kkn-bg-primary/50 p-3 rounded-lg border border-black/5">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-kkn-text-primary/50 flex items-center gap-1 mb-1">
                                      <Navigation className="w-3 h-3" /> Arah Program
                                    </div>
                                    <div className="text-sm font-medium">{keg.arahProgram}</div>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

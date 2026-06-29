import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditableText } from "./EditableText";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/hooks/useAdmin";

export type Program = {
  title: string;
  division: string;
  description: string;
  status: string;
  statusColor: string;
};

const INITIAL_PROGRAMS: Program[] = [
  {
    title: "Pelatihan Digital Marketing UMKM",
    division: "Ekonomi",
    description:
      "Membantu warga desa yang memiliki usaha kecil untuk memasarkan produknya melalui media sosial dan e-commerce.",
    status: "Selesai",
    statusColor:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    title: "Bazar Produk Desa",
    division: "Ekonomi",
    description:
      "Penyelenggaraan bazar mingguan untuk mempromosikan hasil pertanian dan kerajinan lokal.",
    status: "Berjalan",
    statusColor:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    title: "Bimbingan Belajar Gratis",
    division: "Pendidikan",
    description:
      "Pendampingan belajar untuk siswa SD dan SMP setiap sore di balai desa.",
    status: "Berjalan",
    statusColor:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    title: "Pojok Literasi Desa",
    division: "Pendidikan",
    description:
      "Pembuatan perpustakaan mini dengan donasi buku untuk meningkatkan minat baca anak-anak.",
    status: "Belum Dimulai",
    statusColor:
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  },
  {
    title: "Cek Kesehatan Gratis",
    division: "Kesehatan",
    description:
      "Bekerja sama dengan puskesmas setempat untuk pemeriksaan tensi, gula darah, dan kolesterol warga lansia.",
    status: "Selesai",
    statusColor:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    title: "Penyuluhan Gizi Seimbang",
    division: "Kesehatan",
    description:
      "Edukasi tentang pentingnya gizi seimbang untuk mencegah stunting pada balita.",
    status: "Belum Dimulai",
    statusColor:
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  },
  {
    title: "Renovasi Papan Jalan Desa",
    division: "Infrastruktur",
    description:
      "Pembuatan dan pengecatan ulang papan penunjuk jalan di setiap pertigaan desa.",
    status: "Selesai",
    statusColor:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    title: "Pemasangan Lampu Jalan",
    division: "Infrastruktur",
    description:
      "Pemasangan lampu penerangan bertenaga surya di titik-titik rawan.",
    status: "Berjalan",
    statusColor:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
];

export function Programs() {
  const [activeTab, setActiveTab] = useState("semua");
  const { isAdmin } = useAdmin();
  const [programs, setPrograms] = useState<Program[]>(() => {
    try {
      const stored = localStorage.getItem("kkn_programs");
      if (stored) return JSON.parse(stored) as Program[];
    } catch {}
    return INITIAL_PROGRAMS;
  });

  const handleStatusClick = useCallback((title: string) => {
    setPrograms((prev) => {
      const updated = prev.map((p) => {
        if (p.title === title) {
          let newStatus = p.status;
          let newColor = p.statusColor;
          
          if (p.status === "Belum Dimulai") {
            newStatus = "Berjalan";
            newColor = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
          } else if (p.status === "Berjalan") {
            newStatus = "Selesai";
            newColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
          } else {
            newStatus = "Belum Dimulai";
            newColor = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
          }
          
          return { ...p, status: newStatus, statusColor: newColor };
        }
        return p;
      });
      localStorage.setItem("kkn_programs", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const filteredPrograms =
    activeTab === "semua"
      ? programs
      : programs.filter((p) => p.division.toLowerCase() === activeTab);

  const divisions = ["semua", "ekonomi", "pendidikan", "kesehatan", "infrastruktur"];

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
            defaultText="Inisiatif dan kegiatan yang kami lakukan untuk memajukan Desa Meduri di berbagai bidang."
            className="text-kkn-text-light/90 block"
          />
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12 mt-16">
          {/* Left Sidebar (Tabs) - Horizontal Scroll on mobile, vertical sidebar on desktop */}
          <div className="w-full lg:w-1/4 flex flex-row overflow-x-auto gap-2 pb-4 scrollbar-none shrink-0 lg:flex-col lg:space-y-2 lg:overflow-x-visible lg:pb-0">
            {divisions.map((div) => (
              <button
                key={div}
                onClick={() => setActiveTab(div)}
                className={`text-center lg:text-left px-4 py-2.5 lg:px-6 lg:py-4 rounded-xl font-bold transition-all whitespace-nowrap text-sm lg:text-base ${
                  activeTab === div
                    ? "bg-kkn-bg-dark text-kkn-text-light shadow-md"
                    : "bg-kkn-card-light text-kkn-text-primary/70 hover:bg-kkn-card-light/80 hover:text-kkn-text-primary"
                }`}
              >
                {div.charAt(0).toUpperCase() + div.slice(1)}
              </button>
            ))}
          </div>

          {/* Right Content Area */}
          <div className="w-full lg:w-3/4">
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredPrograms.map((program, i) => (
                  <motion.div
                    key={`${program.title}-${i}`}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <div className="bg-kkn-card-light rounded-2xl p-8 border border-kkn-accent-1/20 h-full flex flex-col justify-between hover:shadow-lg transition-shadow group">
                      <div>
                        <div className="flex justify-between items-start mb-4 gap-4">
                          <span className="text-xs font-bold uppercase tracking-widest text-kkn-accent-1">
                            {program.division}
                          </span>
                          {isAdmin ? (
                            <button
                              onClick={() => handleStatusClick(program.title)}
                              className={`text-xs px-3 py-1.5 rounded-full font-bold cursor-pointer hover:opacity-80 transition-opacity ${program.statusColor}`}
                              title="Klik untuk mengubah status"
                            >
                              {program.status}
                            </button>
                          ) : (
                            <span
                              className={`text-xs px-3 py-1.5 rounded-full font-bold ${program.statusColor}`}
                            >
                              {program.status}
                            </span>
                          )}
                        </div>
                        <EditableText
                          as="h3"
                          id={`prog_card_title_${i}`}
                          defaultText={program.title}
                          className="text-2xl font-bold text-kkn-text-primary mb-3 leading-tight group-hover:text-kkn-bg-dark transition-colors block"
                        />
                        <EditableText
                          as="p"
                          id={`prog_card_desc_${i}`}
                          defaultText={program.description}
                          className="text-base text-kkn-text-primary/80 font-medium block"
                        />
                      </div>
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

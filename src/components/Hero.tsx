import { Button } from "@/components/ui/button";
import { ArrowDown, MoveRight } from "lucide-react";
import { EditableText } from "./EditableText";
import { useState, useEffect } from "react";
import { getHeroImage, getHeroImageSync } from "@/lib/storage";

export function Hero() {
  // getHeroImageSync() now reads from localStorage — instant on refresh
  const [heroBg, setHeroBg] = useState(getHeroImageSync());

  useEffect(() => {
    let cancelled = false;

    // Fetch from Supabase in background and update if different
    const fetchHeroImage = async () => {
      try {
        const imageUrl = await getHeroImage();
        if (!cancelled && imageUrl !== heroBg) {
          setHeroBg(imageUrl);
        }
      } catch (error) {
        console.error('Failed to fetch hero image:', error);
      }
    };

    fetchHeroImage();

    // Listen for updates from admin editor
    const handleStorageChange = async () => {
      try {
        const imageUrl = await getHeroImage();
        if (!cancelled) {
          setHeroBg(imageUrl);
        }
      } catch (error) {
        console.error('Failed to update hero image:', error);
      }
    };

    window.addEventListener('heroBgUpdated', handleStorageChange);
    return () => {
      cancelled = true;
      window.removeEventListener('heroBgUpdated', handleStorageChange);
    };
  }, []);

  const scrollToPrograms = () => {
    const element = document.getElementById("programs");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const dataPoints = [
    { id: "01", text: "PENGEMBANGAN UMKM" },
    { id: "02", text: "PELESTARIAN BUDAYA" },
    { id: "03", text: "KONSERVASI ALAM" },
    { id: "04", text: "EDUKASI & LITERASI" },
  ];

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] flex flex-col justify-end pb-24 overflow-hidden"
    >
      {/* Background Image with Dark Gradient Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={heroBg}
          alt="Desa Meduri Landscape"
          className="w-full h-full object-cover opacity-80 scale-105"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-kkn-bg-dark via-kkn-bg-dark/50 to-transparent" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 md:px-12 w-full mt-16 sm:mt-32">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8 lg:gap-16">
          
          {/* Main Title - Left */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <EditableText
              as="h1"
              id="hero_title"
              multiline={true}
              defaultText="KKN DESA<br />MEDURI<br />2026"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[7rem] font-sans font-bold tracking-tighter text-white leading-[0.95] uppercase drop-shadow-2xl"
            />
            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <EditableText
                as="p"
                id="hero_subtitle"
                defaultText="Sustainable Forest, Sustainable Life: Pemberdayaan Masyarakat di Kawasan Hutan Selatan."
                className="text-xs sm:text-sm md:text-base text-white/70 max-w-sm font-medium tracking-wide"
              />
              <Button
                variant="outline"
                size="lg"
                onClick={scrollToPrograms}
                className="rounded-none border-white/30 text-white hover:bg-white hover:text-black tracking-widest text-xs h-12 px-6 sm:px-8 uppercase bg-transparent transition-colors w-fit"
              >
                SWIPE
                <ArrowDown className="ml-2 sm:ml-3 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Data Points - Right */}
          <div className="flex flex-col space-y-8 sm:space-y-12 lg:max-w-xs w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 min-w-0">
            <div className="flex flex-col space-y-4 sm:space-y-6">
              {dataPoints.map((point) => (
                <div key={point.id} className="flex items-center justify-between group cursor-pointer border-b border-white/10 pb-3 sm:pb-4 gap-2 min-w-0">
                  <span className="text-xs font-mono font-bold text-white/50 group-hover:text-white transition-colors flex-shrink-0">
                    {point.id}
                  </span>
                  <EditableText
                    as="span"
                    id={`hero_point_${point.id}`}
                    defaultText={point.text}
                    className="text-xs font-bold tracking-widest text-white/90 uppercase group-hover:text-kkn-accent-2 transition-colors flex-1 text-right truncate sm:truncate-none"
                  />
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4 text-xs text-white/50 font-mono">
              <div className="h-[1px] bg-white/20 flex-1"></div>
              <EditableText
                as="span"
                id="hero_est"
                defaultText="EST. 2026"
                className="flex-shrink-0"
              />
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

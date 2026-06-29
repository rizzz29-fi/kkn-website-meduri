import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/hooks/useAdmin";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const { isAdmin, loginAdmin, logoutAdmin } = useAdmin();
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = () => {
    scrollToSection("hero");
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1000);
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      if (isAdmin) {
        if (window.confirm("Apakah Anda ingin keluar dari mode admin?")) {
          logoutAdmin();
        }
      } else {
        const pw = window.prompt("Masukkan password admin:");
        if (pw) loginAdmin(pw);
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  const navLinks = [
    { name: "Beranda", href: "hero" },
    { name: "Profil Desa", href: "about" },
    { name: "Tim KKN", href: "team" },
    { name: "Program Kerja", href: "programs" },
    { name: "Galeri", href: "gallery" },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      id="navbar"
      className="fixed top-0 w-full z-50 transition-all duration-300 py-3 sm:py-6 bg-kkn-bg-primary shadow-md"
    >
      <div className="container mx-auto px-4 sm:px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Logo - Always fully visible */}
          <div className="shrink-0 flex items-center w-full md:w-auto justify-center md:justify-start">
            <span
              className="font-sans text-lg sm:text-lg md:text-2xl font-bold tracking-tight cursor-pointer text-kkn-text-primary flex items-center gap-2 select-none"
              onClick={handleLogoClick}
            >
              KKN <span className="font-light">Meduri</span>
              {isAdmin && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-kkn-text-primary text-kkn-bg-primary px-2 py-0.5 rounded-full uppercase tracking-wider leading-none border border-kkn-text-primary/10">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  Admin
                </span>
              )}
            </span>
          </div>

          {/* Nav Links — scrollable single row on mobile, normal on desktop */}
          <div
            className="w-full md:flex-1 flex items-center justify-start md:justify-end overflow-x-auto md:overflow-x-visible gap-3 sm:gap-6 md:gap-8 py-1 md:py-1.5"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                className={`text-[11px] sm:text-sm md:text-base font-semibold md:font-medium transition-colors hover:text-kkn-text-primary/70 px-1.5 py-0.5 shrink-0 whitespace-nowrap ${
                  activeSection === link.href
                    ? "text-kkn-text-primary border-b-2 border-kkn-text-primary"
                    : "text-kkn-text-primary/80"
                }`}
              >
                {link.name}
              </button>
            ))}
            {isAdmin && (
              <Link href="/admin" className="shrink-0">
                <button className="text-[10px] sm:text-xs md:text-sm font-semibold transition-colors px-3 py-1 bg-kkn-bg-dark text-kkn-text-light rounded-full hover:opacity-90 whitespace-nowrap">
                  Dashboard
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

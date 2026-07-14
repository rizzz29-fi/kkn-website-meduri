import { ShieldAlert } from "lucide-react";
import { SiTiktok, SiInstagram, SiYoutube } from "react-icons/si";
import { EditableText } from "./EditableText";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer id="footer" className="relative bg-kkn-bg-dark text-kkn-text-light pt-24 pb-12 border-t border-kkn-border/20 overflow-hidden">
      {/* Full-width dark photo background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/balai_desa.png"
          alt="Desa Meduri Footer Background"
          className="w-full h-full object-cover grayscale opacity-20 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-kkn-bg-dark via-kkn-bg-dark/90 to-kkn-bg-dark/40"></div>
      </div>

      <div className="container relative z-10 mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 items-start">
          
          <div className="space-y-6 lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-600"></div>
              <EditableText
                as="h3"
                id="footer_title"
                defaultText="KKN MEDURI"
                className="text-2xl font-sans font-bold uppercase tracking-widest text-white block"
              />
            </div>
            <EditableText
              as="p"
              id="footer_desc"
              defaultText="Sustainable Forest, Sustainable Life: Pemberdayaan Masyarakat di Kawasan Hutan Selatan Bojonegoro. Tim Kuliah Kerja Nyata Universitas Bojonegoro di Desa Meduri."
              className="text-white/60 leading-relaxed text-sm max-w-md font-mono tracking-wide block"
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600/50"></div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/80">
                EXPLORE
              </h4>
            </div>
            <ul className="space-y-3 font-mono text-xs tracking-widest">
              {['Beranda', 'Profil Desa', 'Tim KKN', 'Program Kerja', 'Galeri'].map((item) => {
                let linkId = '';
                if (item === 'Profil Desa') linkId = 'about';
                else if (item === 'Beranda') linkId = 'hero';
                else if (item === 'Tim KKN') linkId = 'team';
                else if (item === 'Program Kerja') linkId = 'programs';
                else if (item === 'Galeri') linkId = 'gallery';
                return (
                  <li key={item}>
                    <a href={`#${linkId}`} className="text-white/50 hover:text-white transition-colors uppercase flex items-center gap-2 group">
                      <span className="w-0 h-[1px] bg-white group-hover:w-3 transition-all duration-300"></span>
                      {item}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600/50"></div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/80">
                CONNECT
              </h4>
            </div>
            <ul className="space-y-4 font-mono text-xs tracking-wide text-white/50">
              <li>
                <a href="https://www.instagram.com/kkntk20unigoro2026?igsh=eG52bmlmdWZndXY=" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-3">
                  <SiInstagram className="h-4 w-4" />
                  INSTAGRAM
                </a>
              </li>
              <li>
                <a href="https://www.tiktok.com/@kkntk20.unigoro26?_r=1&_t=ZS-97sV7vftR6z" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-3">
                  <SiTiktok className="h-4 w-4" />
                  TIKTOK
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center gap-3">
                  <SiYoutube className="h-4 w-4" />
                  YOUTUBE
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-white/40 font-mono text-[10px] tracking-widest uppercase">
          <p>&copy; 2026 KKN DESA MEDURI. ALL RIGHTS RESERVED.</p>
          <button
            onClick={scrollToTop}
            className="hover:text-white transition-colors flex items-center gap-2"
          >
            BACK TO TOP
            <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
          </button>
        </div>
      </div>
    </footer>
  );
}

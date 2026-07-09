import { MapPin, ArrowRight, Users, TreePine, Landmark, BookOpen, Heart, ShoppingBag, Camera, Zap } from "lucide-react";
import { useState } from "react";
import { EditableText } from "./EditableText";
import { EditableImage } from "./EditableImage";

export function About() {
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const programs = [
    {
      priority: "1st priority",
      title: "Developing UMKM",
      img: "/balai_desa.png",
    },
    {
      priority: "2nd priority",
      title: "Forest Sustainability",
      img: "/balai_desa.png",
    },
    {
      priority: "3rd priority",
      title: "Agro-Tourism",
      img: "/balai_desa.png",
    },
    {
      priority: "4th priority",
      title: "Community Innovation",
      img: "/balai_desa.png",
    },
  ];

  const profileSections = [
    { 
      id: "sejarah", title: "Sejarah Desa", defaultText: "Sejarah dan asal usul desa serta perkembangannya hingga saat ini...", category: "Overview", img: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=800",
      icon: Landmark
    },
    { 
      id: "budaya", title: "Potensi Budaya", defaultText: "Kesenian, tradisi, dan kebudayaan lokal yang dilestarikan...", category: "Culture", img: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=400",
      icon: Users
    },
    { 
      id: "pertanian", title: "Pertanian & Kehutanan", defaultText: "Hasil bumi, komoditas utama, dan pengelolaan sumber daya hutan...", category: "Agriculture", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=400",
      icon: TreePine
    },
    { 
      id: "sumberdaya", title: "Sumber Daya", defaultText: "Kekayaan alam murni dan potensi sumber daya manusia...", category: "Resources", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400",
      icon: Zap
    },
    { 
      id: "infrastruktur", title: "Infrastruktur & Lingkungan", defaultText: "Fasilitas jalan, ketersediaan air bersih, dan kondisi lingkungan...", category: "Infrastructure", img: "https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&q=80&w=400",
      icon: Landmark
    },
    { 
      id: "pendidikan", title: "Pendidikan", defaultText: "Fasilitas pendidikan dasar hingga menengah dan program literasi...", category: "Education", img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=400",
      icon: BookOpen
    },
    { 
      id: "kesehatan", title: "Kesehatan", defaultText: "Layanan kesehatan terpadu, posyandu, dan sanitasi desa...", category: "Health", img: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=400",
      icon: Heart
    },
    { 
      id: "umkm", title: "UMKM & Ekonomi", defaultText: "Industri rumah tangga, kerajinan lokal, dan perputaran ekonomi...", category: "Economy", img: "https://images.unsplash.com/photo-1556740749-887f6717dea1?auto=format&fit=crop&q=80&w=400",
      icon: ShoppingBag
    },
    { 
      id: "wisata", title: "Potensi Wisata", defaultText: "Destinasi wisata alam yang asri, wisata budaya, maupun buatan...", category: "Tourism", img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800",
      icon: Camera
    },
    { 
      id: "pemuda", title: "Pemberdayaan Pemuda", defaultText: "Kegiatan kepemudaan, inovasi karang taruna, dan olahraga...", category: "Youth", img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=400",
      icon: Users
    },
  ];

  return (
    <section id="about" className="about-section">
      
      {/* ========== SECTION 1: About Us (White/Light BG) ========== */}
      <div className="about-hero-section">
        <div className="about-container">
          
          {/* Badge */}
          <div className="about-badge-row">
            <span className="about-badge">
              <span className="about-badge-dot"></span>
              Tentang Desa
            </span>
          </div>

          {/* Heading */}
          <div className="about-heading-row">
            <EditableText
              as="h2"
              id="about_title"
              multiline={true}
              defaultText="Sekilas Tentang<br />Desa Meduri"
              className="about-main-heading"
            />
          </div>

          {/* Top Row: Images Left + Map Right */}
          <div className="about-two-col">
            {/* Left: Image Collage */}
            <div className="about-images-col">
              <div className="about-img-collage">
                <div className="about-img-large">
                  <EditableImage
                    id="about_prog_img_0"
                    defaultSrc={programs[0].img}
                    alt="Program Utama"
                    className="about-img-fill"
                  />
                </div>
                <div className="about-img-stack">
                  <div className="about-img-small">
                    <EditableImage
                      id="about_prog_img_1"
                      defaultSrc={programs[1].img}
                      alt="Program 2"
                      className="about-img-fill"
                    />
                  </div>
                  <div className="about-img-small">
                    <EditableImage
                      id="about_prog_img_2"
                      defaultSrc={programs[2].img}
                      alt="Program 3"
                      className="about-img-fill"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Map Widget */}
            <div className="about-map-col">
              <div className="about-map-widget">
                <div className="about-map-frame">
                  {!isMapLoaded && (
                    <div className="about-map-loader">
                      <MapPin className="about-map-loader-icon" />
                    </div>
                  )}
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31644.855548053213!2d111.5143!3d-7.318682!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e79de837b2fd347%3A0x535a729f217b004d!2sMeduri%2C%20Margomulyo%2C%20Bojonegoro%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1716428612345!5m2!1sen!2sid" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={false} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    onLoad={() => setIsMapLoaded(true)}
                    className={`about-map-iframe ${isMapLoaded ? 'loaded' : ''}`}
                  ></iframe>
                </div>
                <div className="about-map-label">
                  <MapPin className="about-map-pin" />
                  <span>Desa Meduri, Margomulyo, Bojonegoro</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Text Content */}
          <div className="about-bottom-content-grid" style={{ alignItems: 'flex-start' }}>
            <div className="about-bottom-text">
              <EditableText
                as="h3"
                id="about_bottom_title"
                defaultText="Tentang Desa Meduri"
                className="about-bottom-title"
              />
              <EditableText
                as="p"
                id="about_desc_1"
                defaultText="Desa Meduri merupakan salah satu desa terluas yang terletak di wilayah administrasi Kecamatan Margomulyo, Kabupaten Bojonegoro, Provinsi Jawa Timur. Secara geografis, desa ini berada di kawasan yang asri dan dikelilingi oleh area perhutanan, menjadikannya sebuah wilayah yang kaya akan potensi alam dan kental dengan nilai-nilai kearifan lokal."
                className="about-desc-text"
                multiline={true}
              />
              
              <div style={{ marginTop: '32px' }}>
                <EditableText
                  as="h4"
                  id="about_bottom_subtitle_1"
                  defaultText="Potensi & Sosial Budaya"
                  className="about-bottom-title"
                  style={{ fontSize: '1.4rem', marginBottom: '16px' }}
                />
                <EditableText
                  as="p"
                  id="about_desc_2"
                  defaultText="Sebagian besar masyarakat Desa Meduri menggantungkan mata pencaharian mereka pada sektor pertanian, perkebunan, dan pemanfaatan hasil bumi. Kehidupan sosial di desa ini masih memegang teguh tradisi gotong royong, adat istiadat Jawa, dan prinsip guyub rukun. Hal ini tercermin dari aktifnya kegiatan kemasyarakatan, mulai dari pengelolaan lingkungan, agenda pelestarian budaya, hingga sinergi warga dalam pembangunan desa."
                  className="about-desc-text"
                  multiline={true}
                  style={{ marginBottom: '16px' }}
                />
                <EditableText
                  as="p"
                  id="about_desc_3"
                  defaultText="Melalui semangat kebersamaan dan keterbukaan terhadap inovasi—termasuk program kolaborasi seperti Kuliah Kerja Nyata (KKN)—Desa Meduri terus berbenah menuju desa yang mandiri, sejahtera, dan melek digital tanpa kehilangan identitas budayanya."
                  className="about-desc-text"
                  multiline={true}
                />
              </div>
            </div>

            <div className="about-bottom-features p-5 sm:p-8" style={{ background: 'color-mix(in srgb, var(--kkn-accent-1) 15%, transparent)', borderRadius: '20px', border: '1px solid color-mix(in srgb, var(--kkn-accent-1) 30%, transparent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '8px', background: 'var(--kkn-accent-1)', borderRadius: '10px', color: 'var(--kkn-bg-primary)' }}>
                  <MapPin size={20} />
                </div>
                <EditableText
                  as="h4"
                  id="about_dusun_title"
                  defaultText="Pembagian Wilayah"
                  className="about-bottom-title"
                  style={{ fontSize: '1.4rem', marginBottom: '0' }}
                />
              </div>
              
              <EditableText
                as="p"
                id="about_dusun_desc"
                defaultText="Dengan luas wilayah ± 67,16 Km², Desa Meduri memiliki struktur administrasi yang unik dengan jumlah dusun yang cukup banyak:"
                className="about-desc-text"
                multiline={true}
                style={{ marginBottom: '24px' }}
              />
              
              {/* Dusun Grid */}
              <div className="about-dusun-grid">
                {[
                  "Meduri",
                  "Kunir",
                  "Pucanganom",
                  "Kenongodengkol",
                  "Keren",
                  "Kalidogol",
                  "Besali",
                  "Kijing",
                  "Kaligede",
                  "Pleret"
                ].map((dusun, i) => (
                  <div key={i} className="hover-elevate" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'var(--kkn-card-light)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--kkn-border)', cursor: 'default', overflow: 'hidden' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--kkn-accent-1)', flexShrink: 0, marginTop: '4px' }} />
                    <EditableText
                      as="span"
                      id={`about_dusun_${i}`}
                      defaultText={`Dusun ${dusun}`}
                      style={{ fontSize: '13px', fontWeight: 600, color: 'var(--kkn-text-primary)', display: 'block', lineHeight: '1.4', minWidth: 0, width: '100%' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== SECTION 2: Sejarah Desa ========== */}
      <div className="about-sejarah-section">
        <div className="about-container">
          <div className="about-two-col" style={{ alignItems: 'flex-start' }}>
            {/* Left: Text Content */}
            <div className="about-text-col" style={{ paddingRight: '5%', paddingTop: '4rem', paddingBottom: '2rem' }}>
              <EditableText
                as="h2"
                id="about_sejarah_title"
                multiline={true}
                defaultText="Transform <i style='font-family: serif; font-style: italic; font-weight: 400;'>Your</i><br /><i style='font-family: serif; font-style: italic; font-weight: 400;'>Body</i> and Mind"
                className="about-sejarah-heading"
                style={{ fontSize: 'clamp(48px, 6vw, 76px)', color: '#0f2615', lineHeight: '1', marginBottom: '24px', letterSpacing: '-0.03em' }}
              />
              <EditableText
                as="p"
                id="about_sejarah_desc"
                multiline={true}
                defaultText="Join us in transforming your body and mind through our comprehensive yoga and fitness programs."
                className="about-desc-text"
                style={{ color: '#2e3a31', marginBottom: '40px', fontSize: '1.1rem', maxWidth: '400px' }}
              />
            </div>

            {/* Right: Image */}
            <div className="about-images-col">
              <div style={{ width: '100%', height: '100%', minHeight: '480px', borderRadius: '24px', overflow: 'hidden' }}>
                <EditableImage
                  id="about_sejarah_img"
                  defaultSrc="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&q=80&w=800"
                  alt="Sejarah Desa"
                  className="about-img-fill"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== SECTION 3: Sektor Unggulan (Light BG) ========== */}
      <div className="about-sectors-section">
        <div className="about-container">
          
          {/* Two-column: Content Left + Image Right */}
          <div className="about-two-col about-two-col-reverse">
            {/* Left: Content */}
            <div className="about-text-col">
              <span className="about-badge">
                <span className="about-badge-dot"></span>
                Sektor Unggulan
              </span>
              <EditableText
                as="h2"
                id="about_profile_sectors_title"
                multiline={true}
                defaultText="Menggali Potensi<br />Unggulan Desa"
                className="about-sector-heading"
              />
              <EditableText
                as="p"
                id="about_mission_desc"
                defaultText="Desa Meduri - Kec. Margomulyo, Kab. Bojonegoro. Meningkatkan kesadaran masyarakat akan potensi agrowisata lokal serta edukasi untuk pengembangan UMKM desa yang terintegrasi secara digital."
                className="about-desc-text"
              />

              {/* Sector mini cards */}
              <div className="about-sector-mini-grid">
                {profileSections.slice(4, 8).map((section, idx) => {
                  const IconComponent = section.icon;
                  return (
                    <div key={idx} className="about-sector-mini-card">
                      <div className="about-sector-mini-icon">
                        <IconComponent className="about-mini-icon-svg" />
                      </div>
                      <EditableText
                        as="span"
                        id={`about_prof_${section.id}_title`}
                        defaultText={section.title}
                        className="about-sector-mini-title"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Featured Image + Map */}
            <div className="about-images-col">
              <div className="about-featured-image">
                <EditableImage
                  id={`about_prof_${profileSections[8].id}_img`}
                  defaultSrc={profileSections[8].img}
                  alt={profileSections[8].title}
                  className="about-img-fill about-img-featured"
                />
                <div className="about-featured-overlay">
                  <span className="about-featured-tag">{profileSections[8].category}</span>
                  <EditableText
                    as="h3"
                    id={`about_prof_${profileSections[8].id}_title`}
                    defaultText={profileSections[8].title}
                    className="about-featured-title"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== SECTION 4: Sorotan Utama / Highlight (Dark BG) ========== */}
      <div className="about-highlight-section">
        <div className="about-container">
          
          <div className="about-highlight-header">
            <span className="about-badge about-badge-dark">
              <span className="about-badge-dot"></span>
              Sorotan Utama
            </span>
            <EditableText
              as="h2"
              id="about_profile_highlight_title"
              multiline={true}
              defaultText="Inovasi & Pemberdayaan<br />Untuk Masa Depan"
              className="about-dark-heading"
            />
          </div>

          <div className="about-highlight-grid">
            {/* Large Feature Card */}
            <div className="about-highlight-feature group">
              <EditableImage
                id={`about_prof_${profileSections[8].id}_img`}
                defaultSrc={profileSections[8].img}
                alt={profileSections[8].title}
                className="about-img-fill about-highlight-feature-img"
              />
              <div className="about-highlight-feature-overlay">
                <span className="about-highlight-feature-tag">{profileSections[8].category}</span>
                <EditableText
                  as="h3"
                  id={`about_prof_wisata_highlight_title`}
                  defaultText={profileSections[8].title}
                  className="about-highlight-feature-title"
                />
                <EditableText
                  as="p"
                  id={`about_prof_wisata_highlight_desc`}
                  defaultText={profileSections[8].defaultText}
                  className="about-highlight-feature-desc"
                />
                <button className="about-highlight-btn">
                  Lihat Galeri
                  <ArrowRight className="about-arrow-icon-sm" />
                </button>
              </div>
            </div>

            {/* Side cards */}
            <div className="about-highlight-side">
              {profileSections.slice(8, 10).map((section, idx) => {
                const IconComponent = section.icon;
                return (
                  <div key={idx} className="about-highlight-side-card">
                    <div className="about-highlight-side-img">
                      <EditableImage
                        id={`about_prof_${section.id}_highlight_img`}
                        defaultSrc={section.img}
                        alt={section.title}
                        className="about-img-fill"
                      />
                    </div>
                    <div className="about-highlight-side-body">
                      <div className="about-highlight-side-icon">
                        <IconComponent className="about-mini-icon-svg" />
                      </div>
                      <EditableText
                        as="h4"
                        id={`about_prof_${section.id}_highlight_title`}
                        defaultText={section.title}
                        className="about-highlight-side-title"
                      />
                      <EditableText
                        as="p"
                        id={`about_prof_${section.id}_highlight_desc`}
                        defaultText={section.defaultText}
                        className="about-highlight-side-desc"
                      />
                    </div>
                  </div>
                );
              })}


            </div>
          </div>
        </div>
      </div>

    </section>
  );
}

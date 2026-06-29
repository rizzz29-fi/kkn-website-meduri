import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Team } from "@/components/Team";
import { Programs } from "@/components/Programs";
import { Gallery } from "@/components/Gallery";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground overflow-x-hidden w-full">
      <Navbar />
      <main className="w-full overflow-x-hidden">
        <Hero />
        <About />
        <Team />
        <Programs />
        <Gallery />
      </main>
      <Footer />
    </div>
  );
}

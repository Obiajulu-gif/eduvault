import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TopSharedMaterials from "@/components/TopSharedMaterials";
import HowItWorks from "@/components/HowItWorks";
import DiscoverMaterials from "@/components/DiscoverMaterials";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <TopSharedMaterials />
      <HowItWorks />
      <DiscoverMaterials />
      <Footer />
    </main>
  );
}

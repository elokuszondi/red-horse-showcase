
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturedCars from "@/components/FeaturedCars";
import Heritage from "@/components/Heritage";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <FeaturedCars />
      <Heritage />
      <Footer />
    </div>
  );
};

export default Index;

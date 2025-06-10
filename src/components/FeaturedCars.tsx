
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FeaturedCars = () => {
  const cars = [
    {
      id: 1,
      name: "F8 Tributo",
      category: "V8",
      power: "710 HP",
      acceleration: "2.9s",
      image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80",
      description: "The F8 Tributo is the new mid-rear-engined sports car that represents the highest expression of the Prancing Horse's classic two-seater berlinetta."
    },
    {
      id: 2,
      name: "SF90 Stradale",
      category: "Hybrid",
      power: "1000 HP",
      acceleration: "2.5s",
      image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80",
      description: "Ferrari's first series production PHEV represents the highest expression of Ferrari's technological excellence."
    },
    {
      id: 3,
      name: "812 Superfast",
      category: "V12",
      power: "800 HP",
      acceleration: "2.9s",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
      description: "The 812 Superfast is the most powerful and fastest Ferrari in the marque's history."
    }
  ];

  return (
    <section id="models" className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-ferrari-red">Legendary</span> Performance
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover our latest collection of supercars, each embodying decades of racing expertise and Italian craftsmanship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cars.map((car, index) => (
            <Card 
              key={car.id} 
              className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={car.image}
                  alt={car.name}
                  className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Badge 
                  className="absolute top-4 left-4 bg-ferrari-red text-white border-0"
                >
                  {car.category}
                </Badge>
              </div>
              
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-2 text-ferrari-black">{car.name}</h3>
                <p className="text-muted-foreground mb-4 line-clamp-3">{car.description}</p>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-ferrari-red">{car.power}</div>
                    <div className="text-sm text-muted-foreground">Power</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-ferrari-red">{car.acceleration}</div>
                    <div className="text-sm text-muted-foreground">0-100 km/h</div>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-ferrari-red hover:bg-ferrari-dark-red text-white transition-all duration-300 group-hover:bg-ferrari-dark-red"
                >
                  Explore Details
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCars;

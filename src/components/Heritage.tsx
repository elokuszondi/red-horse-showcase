
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Zap } from "lucide-react";

const Heritage = () => {
  const achievements = [
    {
      icon: Trophy,
      number: "240+",
      label: "Grand Prix Victories",
      description: "Unmatched success in Formula 1 racing"
    },
    {
      icon: Calendar,
      number: "75+",
      label: "Years of Excellence",
      description: "Decades of automotive innovation"
    },
    {
      icon: Zap,
      number: "16",
      label: "Constructor Championships",
      description: "Dominating the pinnacle of motorsport"
    }
  ];

  return (
    <section id="heritage" className="py-20 ferrari-gradient text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <Badge className="bg-ferrari-yellow text-ferrari-black mb-4 text-sm px-4 py-2">
            RACING HERITAGE
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Born from <span className="text-ferrari-yellow">Racing</span>
          </h2>
          <p className="text-xl text-red-100 max-w-3xl mx-auto">
            Every Ferrari carries the DNA of our racing legacy. From the first 125 S in 1947 to today's cutting-edge supercars, 
            racing has always been at the heart of what we do.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {achievements.map((achievement, index) => {
            const IconComponent = achievement.icon;
            return (
              <div 
                key={index}
                className="text-center group"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-ferrari-yellow group-hover:text-ferrari-black transition-all duration-500">
                  <IconComponent className="h-10 w-10" />
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-2 text-ferrari-yellow">
                  {achievement.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{achievement.label}</h3>
                <p className="text-red-100">{achievement.description}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold">The Prancing Horse Legacy</h3>
            <p className="text-lg text-red-100 leading-relaxed">
              Founded by Enzo Ferrari in 1939, Scuderia Ferrari began as a racing team before evolving into the world's most 
              iconic automotive brand. Our commitment to excellence, innovation, and the pursuit of speed has created legends 
              that continue to inspire generations of enthusiasts.
            </p>
            <p className="text-lg text-red-100 leading-relaxed">
              From Maranello's workshops to the world's most prestigious racetracks, every Ferrari tells a story of passion, 
              precision, and the relentless pursuit of perfection.
            </p>
          </div>
          
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80"
              alt="Ferrari Factory"
              className="rounded-lg shadow-2xl transform hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-ferrari-black/50 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Heritage;

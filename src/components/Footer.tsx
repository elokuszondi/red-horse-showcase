
import { Separator } from "@/components/ui/separator";
import { Facebook, Twitter, Instagram, Youtube, Zap } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Models",
      links: ["SF90 Stradale", "F8 Tributo", "812 Superfast", "Roma", "Portofino M"]
    },
    {
      title: "Company",
      links: ["About Ferrari", "Careers", "Heritage", "News", "Investors"]
    },
    {
      title: "Support",
      links: ["Customer Care", "Service", "Warranty", "Financing", "Contact"]
    },
    {
      title: "Experience",
      links: ["Ferrari World", "Driving Courses", "Events", "Museum", "Store"]
    }
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "YouTube" }
  ];

  return (
    <footer className="bg-ferrari-black text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-ferrari-red rounded-lg flex items-center justify-center">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">FERRARI</div>
                <div className="text-sm text-gray-400">The Prancing Horse</div>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Experience the pinnacle of automotive excellence. Every Ferrari embodies our racing heritage 
              and commitment to innovation, delivering uncompromising performance and Italian elegance.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 bg-gray-800 hover:bg-ferrari-red rounded-lg flex items-center justify-center transition-colors duration-300"
                  >
                    <IconComponent className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index} className="space-y-4">
              <h3 className="text-lg font-semibold text-ferrari-red">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href="#"
                      className="text-gray-300 hover:text-white transition-colors duration-300"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="bg-gray-800 mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-gray-400 text-sm">
            © {currentYear} Ferrari S.p.A. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
              Terms of Use
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
              Cookies
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
              Legal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

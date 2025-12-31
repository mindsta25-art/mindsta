import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Youtube,
  Heart,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { siteConfig } from "@/config/siteConfig";

export const HomeFooter = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const currentYear = new Date().getFullYear();

  const handleNewsletterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    // TODO: Implement newsletter subscription API
    toast({
      title: "Subscribed!",
      description: "You've been added to our newsletter",
    });
    setEmail("");
  };

  const quickLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Learning", href: "/my-learning" },
    { label: "Browse Courses", href: "/browse" },
    { label: "My Cart", href: "/cart" },
    { label: "Wishlist", href: "/wishlist" },
    { label: "Progress", href: "/progress" },
  ];
  const supportLinks = [
    { label: "Help Center", href: "/help" },
    { label: "Contact Support", href: "/support" },
    { label: "FAQs", href: "/faq" },
    { label: "Report Issue", href: "/report" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Admin Login", href: "/admin-auth" },
    { label: "Referral Login", href: "/referral-auth" },
  ];

  const subjects = [
    { label: "Mathematics", href: "/subjects/mathematics" },
    { label: "English", href: "/subjects/english" },
    { label: "Science", href: "/subjects/science" },
    { label: "Social Studies", href: "/subjects/social-studies" },
    { label: "Computer Studies", href: "/subjects/computer-studies" },
    { label: "Creative Arts", href: "/subjects/creative-arts" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
  ];

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-primary-700 to-slate-900 text-white mt-12 sm:mt-16">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex flex-col items-center mb-2">
              <img src="/mindsta2.png" alt="Mindsta Logo" className="h-14 w-auto block mb-2" />
            </div>
            <p className="text-sm text-gray-300 mb-4 sm:mb-6 leading-relaxed">
              Empowering students with quality education. Access thousands of lessons, 
              track your progress, and achieve your academic goals with our comprehensive 
              learning platform.
            </p>
            
            {/* Newsletter */}
            <div className="mb-4 sm:mb-6">
              <h4 className="text-sm font-semibold mb-2 sm:mb-3">Subscribe to our newsletter</h4>
              <form onSubmit={handleNewsletterSubscribe} className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-primary-400 text-sm"
                />
                <Button type="submit" className="bg-primary-600 hover:bg-primary-700 whitespace-nowrap">
                  Subscribe
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${siteConfig.contact.supportEmail}`} className="hover:text-primary-400 transition-colors">
                  {siteConfig.contact.supportEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+2341234567890" className="hover:text-primary-400 transition-colors">
                  +234 123 456 7890
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Lagos, Nigeria</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-300 hover:text-primary-400 transition-colors flex items-center gap-1 group"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Subjects */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Popular Subjects</h4>
            <ul className="space-y-2">
              {subjects.map((subject) => (
                <li key={subject.href}>
                  <Link
                    to={subject.href}
                    className="text-sm text-gray-300 hover:text-purple-400 transition-colors flex items-center gap-1 group"
                  >
                    <span>{subject.label}</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-300 hover:text-purple-400 transition-colors flex items-center gap-1 group"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-6 sm:my-8 bg-white/10" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-sm text-gray-300 text-center md:text-left">
            <p className="flex items-center gap-1 justify-center md:justify-start flex-wrap">
              © {currentYear} Mindsta. Made with 
              <Heart className="w-4 h-4 text-red-500 fill-current" /> 
              for students
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3 sm:gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/10 rounded-full hover:bg-primary-600 transition-all hover:scale-110"
                aria-label={social.label}
              >
                <social.icon className="w-4 h-4" />
              </a>
            ))}
          </div>

          {/* Additional Links */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs text-gray-400 flex-wrap justify-center">
            <Link to="/privacy" className="hover:text-primary-400 transition-colors">
              Privacy
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link to="/terms" className="hover:text-primary-400 transition-colors">
              Terms
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link to="/cookies" className="hover:text-primary-400 transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Accent Bar */}
      <div className="h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500"></div>
    </footer>
  );
};

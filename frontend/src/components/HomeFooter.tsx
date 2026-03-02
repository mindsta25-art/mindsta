import { Link } from "react-router-dom";
import { memo, useState } from "react";
import { 
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
import { BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { siteConfig } from "@/config/siteConfig";
import { subscribeToNewsletter } from "@/api/newsletter";
import { useContactSettings } from "@/contexts/ContactSettingsContext";

const HomeFooterComponent = () => {
  const { toast } = useToast();
  const { contactSettings } = useContactSettings();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubscribing(true);
    try {
      const response = await subscribeToNewsletter(email, 'home');
      toast({
        title: "Subscribed!",
        description: response.message || "You've been added to our newsletter",
      });
      setEmail("");
    } catch (error: any) {
      toast({
        title: "Subscription failed",
        description: error.response?.data?.error || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Contact Support", href: "/support" },
  ];

  const companyLinks = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
  ];

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white mt-12 border-t border-slate-700">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">Mindsta</span>
                <span className="text-[10px] block text-gray-400 leading-tight">... Every Child Can Do Well</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-6 max-w-md leading-relaxed">
              Empowering minds through quality education. Access comprehensive lessons, 
              track your learning journey, and achieve academic excellence.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-400 mb-6">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${contactSettings.supportEmail}`} className="hover:text-indigo-400 transition-colors">
                  {contactSettings.supportEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href={`tel:${contactSettings.phone}`} className="hover:text-indigo-400 transition-colors">
                  {contactSettings.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{contactSettings.city}, {contactSettings.country}</span>
              </div>
            </div>

            {/* Newsletter Subscription - Professional Design */}
            <div>
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg flex-shrink-0">
                    <Mail className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold mb-1 text-white">Stay Updated</h4>
                    <p className="text-xs text-gray-300 leading-relaxed">Get the latest lessons, tips, and exclusive offers delivered to your inbox.</p>
                  </div>
                </div>
                <form onSubmit={handleNewsletterSubscribe} className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubscribing}
                      className="bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/50 text-sm pl-10 h-11 transition-all"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubscribing}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-medium shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all h-11"
                  >
                    {isSubscribing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Subscribing...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Subscribe Now
                      </>
                    )}
                  </Button>
                </form>
                <p className="text-xs text-gray-400 mt-2 text-center">🔒 We respect your privacy. Unsubscribe anytime.</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-400 hover:text-indigo-400 transition-colors inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-400 hover:text-indigo-400 transition-colors inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-slate-700" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-sm text-gray-400 text-center md:text-left">
            <p className="flex items-center gap-1 justify-center md:justify-start">
              © {currentYear} Mindsta. All rights reserved.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-800 rounded-full hover:bg-indigo-600 transition-all hover:scale-110"
                aria-label={social.label}
              >
                <social.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Accent Bar */}
      <div className="h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500"></div>
    </footer>
  );
};

// Memoize to prevent unnecessary re-renders
export const HomeFooter = memo(HomeFooterComponent);

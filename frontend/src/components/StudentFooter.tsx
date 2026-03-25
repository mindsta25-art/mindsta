import { Link } from "react-router-dom";
import { memo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Heart,
  CheckCircle,
  Shield,
  Award,
  BookOpen,
  Users,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { siteConfig } from "@/config/siteConfig";
import { subscribeToNewsletter, getNewsletterStatus } from "@/api/newsletter";
import { useContactSettings } from "@/contexts/ContactSettingsContext";

const StudentFooterComponent = () => {
  const { toast } = useToast();
  const { contactSettings } = useContactSettings();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      getNewsletterStatus(user.email)
        .then((res) => { if (res?.subscribed) setIsSubscribed(true); })
        .catch(() => {});
    }
  }, [user?.email]);

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email address", variant: "destructive" });
      return;
    }
    setIsSubscribing(true);
    try {
      const response = await subscribeToNewsletter(email, 'student');
      toast({ title: "Subscribed!", description: response.message || "You've been added to our newsletter" });
      setEmail("");
      setIsSubscribed(true);
    } catch (error: any) {
      toast({ title: "Subscription failed", description: error.response?.data?.error || "Please try again later", variant: "destructive" });
    } finally {
      setIsSubscribing(false);
    }
  };

  const quickLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Learning", href: "/my-learning" },
    { label: "Browse lessonss", href: "/browse" },
    { label: "My Cart", href: "/cart" },
    { label: "Wishlist", href: "/wishlist" },
    { label: "Settings", href: "/settings" },
  ];

  const supportLinks = [
    { label: "Help Center", href: "/help" },
    { label: "FAQs", href: "/faq" },
    { label: "Contact Support", href: "/support" },
    { label: "Report Issue", href: "/report" },
  ];

  const legalLinks = [
    { label: "About Us", href: "/about" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ];

  const socialLinks = [
    { icon: Facebook,  href: "https://facebook.com",  label: "Facebook" },
    { icon: Twitter,   href: "https://twitter.com",   label: "Twitter" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: Youtube,   href: "https://youtube.com",   label: "YouTube" },
  ];

  const stats = [
    { icon: Users,    value: "5,000+",  label: "Students Enrolled" },
    { icon: BookOpen, value: "200+",    label: "Quality Lessons" },
    { icon: Award,    value: "6",       label: "Grade Levels" },
    { icon: Zap,      value: "98%",     label: "Satisfaction Rate" },
  ];

  return (
    <footer className="bg-gradient-to-br from-purple-950 via-slate-900 to-pink-950 text-white mt-12 border-t border-purple-900/50">

      {/* ── Stats Bar ── */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-white/10">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3 md:px-6 first:pl-0 last:pr-0">
                <div className="p-2.5 bg-purple-500/20 rounded-xl shrink-0">
                  <Icon className="w-5 h-5 text-pink-300" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white leading-tight">{value}</div>
                  <div className="text-xs text-slate-400">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg group-hover:shadow-purple-500/30 transition-shadow">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">Mindsta</span>
                <span className="text-[10px] block text-slate-400 leading-tight">... Every Child Can Do Well</span>
              </div>
            </Link>

            <p className="text-sm text-slate-400 mb-6 max-w-md leading-relaxed">
              Empowering young minds through quality, curriculum-aligned education.
              Access comprehensive lessons, track your progress, and achieve academic excellence — all in one place.
            </p>

            {/* Contact */}
            <div className="space-y-2 text-sm text-slate-400 mb-6">
              <a href={`mailto:${contactSettings.supportEmail}`} className="flex items-center gap-2 hover:text-pink-400 transition-colors w-fit">
                <Mail className="w-4 h-4 shrink-0" />{contactSettings.supportEmail}
              </a>
              <a href={`tel:${contactSettings.phone}`} className="flex items-center gap-2 hover:text-pink-400 transition-colors w-fit">
                <Phone className="w-4 h-4 shrink-0" />{contactSettings.phone}
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />{contactSettings.city}, {contactSettings.country}
              </div>
            </div>

            {/* Newsletter — Desktop */}
            <div className="hidden lg:block bg-white/5 rounded-2xl p-5 border border-white/10">
              <h4 className="text-sm font-semibold text-white mb-1">Stay Updated</h4>
              <p className="text-xs text-slate-400 mb-3">Get the latest lessons, tips, and exclusive offers.</p>
              <form onSubmit={handleNewsletterSubscribe} className="flex gap-2">
                {user ? (
                  <div className="flex items-center gap-2 flex-1 bg-white/10 border border-white/20 rounded-lg px-3 h-10">
                    <Mail className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                    <span className="text-xs text-white/80 truncate">{user.email}</span>
                  </div>
                ) : (
                  <Input type="email" placeholder="your.email@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} disabled={isSubscribing}
                    className="flex-1 h-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-xs focus:border-purple-400" />
                )}
                <Button type="submit" disabled={isSubscribing || isSubscribed} size="sm"
                  className={`h-10 px-4 shrink-0 text-xs font-semibold ${isSubscribed ? 'bg-green-600 hover:bg-green-600' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'}`}>
                  {isSubscribed ? <><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Done</> : <><ArrowRight className="w-3.5 h-3.5 mr-1.5" />Subscribe</>}
                </Button>
              </form>
              <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1"><Shield className="w-3 h-3" />No spam. Unsubscribe anytime.</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-slate-400 hover:text-purple-400 transition-colors inline-flex items-center gap-1.5 group">
                    <span className="w-0 group-hover:w-2 overflow-hidden transition-all duration-200 text-purple-400">›</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white">Support</h4>
            <ul className="space-y-2.5 mb-6">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-slate-400 hover:text-purple-400 transition-colors inline-flex items-center gap-1.5 group">
                    <span className="w-0 group-hover:w-2 overflow-hidden transition-all duration-200 text-purple-400">›</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="text-sm font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-slate-400 hover:text-pink-400 transition-colors inline-flex items-center gap-1.5 group">
                    <span className="w-0 group-hover:w-2 overflow-hidden transition-all duration-200 text-pink-400">›</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter — Mobile/Tablet */}
        <div className="lg:hidden mt-8 bg-white/5 rounded-2xl p-5 border border-white/10">
          <h4 className="text-sm font-semibold text-white mb-1">Stay Updated</h4>
          <p className="text-xs text-slate-400 mb-3">Get the latest lessons, tips, and exclusive offers.</p>
          <form onSubmit={handleNewsletterSubscribe} className="space-y-2">
            {user ? (
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 h-11">
                <Mail className="w-4 h-4 text-purple-300 shrink-0" />
                <span className="text-sm text-white/80 truncate flex-1">{user.email}</span>
              </div>
            ) : (
              <Input type="email" placeholder="your.email@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={isSubscribing}
                  className="h-11 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-purple-400" />
            )}
            <Button type="submit" disabled={isSubscribing || isSubscribed}
              className={`w-full h-11 font-semibold ${isSubscribed ? 'bg-green-600 hover:bg-green-600' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'}`}>
              {isSubscribed
                ? <><CheckCircle className="w-4 h-4 mr-2" />Subscribed!</>
                : isSubscribing
                ? <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Subscribing...</>
                : <><Mail className="w-4 h-4 mr-2" />Subscribe Now</>}
            </Button>
          </form>
          <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1"><Shield className="w-3 h-3" />No spam. Unsubscribe anytime.</p>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 py-5 border-t border-b border-white/10">
          {[
            { icon: Shield,       label: "Secure & Encrypted" },
            { icon: CheckCircle,  label: "Verified Curriculum" },
            { icon: Award,        label: "Quality Assured" },
            { icon: Heart,        label: "Student-First Design" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-slate-400 text-xs">
              <Icon className="w-4 h-4 text-purple-400" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            © {currentYear} Mindsta. All rights reserved. Made with <Heart className="w-3 h-3 inline text-red-400" /> for students everywhere.
          </p>
          <div className="flex items-center gap-2">
            {socialLinks.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer"
                className="p-2 bg-white/10 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 rounded-full transition-all hover:scale-110 duration-200"
                aria-label={social.label}>
                <social.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Accent */}
      <div className="h-1 bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600" />
    </footer>
  );
};

// Memoize to prevent unnecessary re-renders
export const StudentFooter = memo(StudentFooterComponent);

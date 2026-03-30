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
  Star,
  GraduationCap,
  Sparkles,
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
    { label: "Browse Lessons", href: "/browse" },
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

  const stats = [
    { icon: Users,       value: "5,000+", label: "Students Enrolled" },
    { icon: BookOpen,    value: "200+",   label: "Quality Lessons" },
    { icon: Award,       value: "6",      label: "Grade Levels" },
    { icon: Zap,         value: "98%",    label: "Satisfaction Rate" },
  ];

  return (
    <footer className="bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white mt-12 border-t border-purple-900/30">

      {/* ── Newsletter CTA Banner ── */}
      <div className="border-b border-white/10 bg-gradient-to-r from-purple-900/40 via-pink-900/20 to-purple-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-pink-400">Stay Ahead</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Get lesson updates &amp; study tips</h3>
              <p className="text-sm text-slate-400 mt-1">Free weekly insights delivered straight to your inbox.</p>
            </div>
            <form onSubmit={handleNewsletterSubscribe} className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:min-w-[380px] md:max-w-full">
              {user ? (
                <div className="flex items-center gap-2 flex-1 bg-white/10 border border-white/20 rounded-xl px-4 h-12">
                  <Mail className="w-4 h-4 text-purple-300 shrink-0" />
                  <span className="text-sm text-white/80 truncate">{user.email}</span>
                </div>
              ) : (
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubscribing}
                  className="flex-1 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm focus:border-purple-400 rounded-xl"
                />
              )}
              <Button
                type="submit"
                disabled={isSubscribing || isSubscribed}
                className={`h-12 px-6 font-semibold rounded-xl shrink-0 ${
                  isSubscribed
                    ? 'bg-green-600 hover:bg-green-600 cursor-default'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg hover:shadow-purple-500/30'
                } transition-all`}
              >
                {isSubscribed ? (
                  <><CheckCircle className="w-4 h-4 mr-2" />Subscribed!</>
                ) : isSubscribing ? (
                  <><svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Subscribing…</>
                ) : (
                  <><ArrowRight className="w-4 h-4 mr-2" />Subscribe Free</>
                )}
              </Button>
            </form>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5 justify-center md:justify-start">
            <Shield className="w-3 h-3 shrink-0" />No spam, ever. Unsubscribe with one click.
          </p>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4 md:divide-x md:divide-white/10">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3 md:px-6 first:pl-0 last:pr-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-pink-300" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-white tracking-tight leading-none">{value}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8">

          {/* ── Brand Column ── */}
          <div className="md:col-span-4 lg:col-span-4">
            <Link to="/" className="flex items-center gap-3 mb-3 group w-fit">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/40 transition-shadow duration-300">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-extrabold text-white tracking-tight">{siteConfig.company.name || 'Mindsta'}</span>
                <span className="block text-[10px] text-slate-400 leading-tight">Every Child Can Do Well</span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed mb-4 max-w-xs">
              Empowering young minds with curriculum-aligned lessons. Learn at your pace, track your progress, and unlock your full potential.
            </p>

            {/* Star rating testimonial */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-0.5 mb-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-2 text-xs font-semibold text-white">4.9/5</span>
              </div>
              <p className="text-xs text-slate-400 italic leading-relaxed">"My grades went from average to top of class in just one term!"</p>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">— Alisha T., Grade 5 student</p>
            </div>

            {/* Contact info */}
            <div className="space-y-2">
              <a href={`mailto:${contactSettings.supportEmail}`} className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-pink-400 transition-colors w-fit group">
                <div className="w-7 h-7 rounded-lg bg-white/8 group-hover:bg-pink-600/20 flex items-center justify-center transition-colors shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                {contactSettings.supportEmail}
              </a>
              <a href={`tel:${contactSettings.phone}`} className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-pink-400 transition-colors w-fit group">
                <div className="w-7 h-7 rounded-lg bg-white/8 group-hover:bg-pink-600/20 flex items-center justify-center transition-colors shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                {contactSettings.phone}
              </a>
              <div className="flex items-center gap-2.5 text-xs text-slate-400">
                <div className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                {contactSettings.city}, {contactSettings.country}
              </div>
            </div>
          </div>

          {/* ── Quick Links ── */}
          <div className="md:col-span-2 lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-2.5">Explore</h4>
            <ul className="space-y-1.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 group-hover:bg-pink-400 transition-colors shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Support ── */}
          <div className="md:col-span-2 lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-2.5">Support</h4>
            <ul className="space-y-1.5 mb-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 group-hover:bg-pink-400 transition-colors shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-2.5">Legal</h4>
            <ul className="space-y-1.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 group-hover:bg-pink-300 transition-colors shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Social & Trust ── */}
          <div className="md:col-span-4 lg:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-2.5">Follow Us</h4>
            <div className="flex gap-2 mb-4">
              {[
                { icon: Facebook,  href: "https://facebook.com",  label: "Facebook",  color: "hover:bg-blue-600" },
                { icon: Twitter,   href: "https://twitter.com",   label: "Twitter",   color: "hover:bg-sky-500" },
                { icon: Instagram, href: "https://instagram.com", label: "Instagram", color: "hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-600" },
                { icon: Youtube,   href: "https://youtube.com",   label: "YouTube",   color: "hover:bg-red-600" },
              ].map(({ icon: Icon, href, label, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center ${color} hover:border-transparent hover:scale-110 transition-all duration-200`}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Trust Badges */}
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-2.5">Our Commitment</h4>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: Shield,      label: "SSL Encrypted",       sub: "Your data is safe" },
                { icon: CheckCircle, label: "Curriculum Aligned",  sub: "CSEC & local boards" },
                { icon: Award,       label: "Quality Assured",     sub: "Expert-reviewed content" },
                { icon: Heart,       label: "Student-First",       sub: "Designed for learners" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="bg-white/5 border border-white/8 rounded-xl p-3 flex flex-col gap-1 hover:border-purple-500/30 transition-colors">
                  <Icon className="w-4 h-4 text-purple-400" />
                  <p className="text-[11px] font-semibold text-white leading-tight">{label}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500 text-center sm:text-left">
              © {currentYear} {siteConfig.company.name || 'Mindsta'}. All rights reserved. Made with{' '}
              <Heart className="w-3 h-3 inline text-red-400 fill-red-400" /> for every learner.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {[
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
                { label: "Cookies", href: "/cookies" },
              ].map((l) => (
                <Link key={l.href} to={l.href} className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Accent Line ── */}
      <div className="h-0.5 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600" />
    </footer>
  );
};

// Memoize to prevent unnecessary re-renders
export const StudentFooter = memo(StudentFooterComponent);

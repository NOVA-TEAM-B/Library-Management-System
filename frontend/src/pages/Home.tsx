import React, { useState, useEffect } from 'react';
import { Sparkles, Bot, Zap, Shield, TrendingUp, Search as SearchIcon, ArrowRight, BookOpen, Clock, Activity, MessageSquare, ChevronRight, Flame, CheckCircle, Mail, HelpCircle, Cpu, Menu as MenuIcon, X as XIcon, Users } from 'lucide-react';

interface HomeProps {
  onEnterPortal: () => void;
  onLoginSuccess: (user: any) => void;
}

export default function Home({ onEnterPortal, onLoginSuccess }: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);

  // Scroll and Nav states
  const [activeSection, setActiveSection] = useState('hero');
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // OTP Login states
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [homeOtpIdentifier, setHomeOtpIdentifier] = useState('');
  const [homeOtpCode, setHomeOtpCode] = useState('');
  const [homeOtpStep, setHomeOtpStep] = useState<1 | 2>(1);
  const [homeOtpTimer, setHomeOtpTimer] = useState(0);
  const [homeOtpLoading, setHomeOtpLoading] = useState(false);
  const [homeOtpError, setHomeOtpError] = useState('');
  const [homeOtpSuccess, setHomeOtpSuccess] = useState('');

  const handleQuickLogin = async (usr: string, pass: string) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usr, password: pass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Login failed');

      localStorage.setItem('nova_jwt_token', data.token);
      const userObj = { 
        ...data.user, 
        org_name: data.organization?.name, 
        org_logo: data.organization?.logo_url,
        fine_rate: data.organization?.fine_rate
      };
      localStorage.setItem('nova_user', JSON.stringify(userObj));
      onLoginSuccess(userObj);
    } catch (err: any) {
      alert(`Demo login failed: ${err.message}`);
    }
  };

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Section observer for active highlights
  useEffect(() => {
    const sections = ['hero', 'features', 'services', 'pricing', 'testimonials', 'faq', 'contact', 'about'];
    
    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -45% 0px',
      threshold: 0
    };
    
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };
    
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, []);

  // Timer countdown hook for Home OTP
  useEffect(() => {
    if (homeOtpTimer <= 0) return;
    const interval = setInterval(() => {
      setHomeOtpTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [homeOtpTimer]);

  // Smooth Scroll Easing function (easeInOutQuad)
  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    
    const headerHeight = 80;
    const targetPosition = id === 'hero' ? 0 : target.getBoundingClientRect().top + window.scrollY - headerHeight;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const duration = 800; // 800ms
    let start: number | null = null;
    
    const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t + b;
      t--;
      return (-c / 2) * (t * (t - 2) - 1) + b;
    };
    
    const animation = (currentTime: number) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        window.scrollTo(0, targetPosition);
      }
    };
    
    requestAnimationFrame(animation);
  };

  const handleSimulatedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResult(null);

    setTimeout(() => {
      setSearching(false);
      setSearchResult({
        query: searchQuery,
        intent: 'Book Search & Categorization',
        extractedKeywords: searchQuery.toLowerCase().replace(/find|books|on|search|for/g, '').trim(),
        mockMatches: [
          { title: `Advanced Concepts in ${searchQuery}`, author: 'Dr. Evelyn Carter', category: 'Research', match: '98%' },
          { title: `Foundations of ${searchQuery} & Systems`, author: 'Prof. Marcus Vance', category: 'Academic', match: '91%' },
          { title: `${searchQuery} Handbook for Engineers`, author: 'Sarah Jenkins', category: 'Practical Guide', match: '87%' }
        ]
      });
    }, 1200);
  };

  const handleHomeGenerateOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeOtpIdentifier.trim()) {
      setHomeOtpError('Email or Mobile number is required.');
      return;
    }
    setHomeOtpLoading(true);
    setHomeOtpError('');
    setHomeOtpSuccess('');

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_or_phone: homeOtpIdentifier })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || data.msg || 'Server Error');

      setHomeOtpStep(2);
      setHomeOtpTimer(30);
      setHomeOtpSuccess('OTP sent successfully. Please check: Inbox, Spam, Promotions, Updates.');
    } catch (err: any) {
      setHomeOtpError('Unable to send OTP. Reason: ' + err.message);
    } finally {
      setHomeOtpLoading(false);
    }
  };

  const handleHomeVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeOtpCode.trim()) {
      setHomeOtpError('Verification code is required.');
      return;
    }
    setHomeOtpLoading(true);
    setHomeOtpError('');
    setHomeOtpSuccess('');

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_or_phone: homeOtpIdentifier, otp_code: homeOtpCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'OTP validation failed');

      localStorage.setItem('nova_jwt_token', data.token);
      const userObj = { 
        ...data.user, 
        org_name: data.organization?.name, 
        org_logo: data.organization?.logo_url,
        fine_rate: data.organization?.fine_rate
      };
      localStorage.setItem('nova_user', JSON.stringify(userObj));
      setHomeOtpSuccess('Verification successful! Initiating redirect...');
      setTimeout(() => {
        setOtpModalOpen(false);
        onLoginSuccess(userObj);
      }, 1000);
    } catch (err: any) {
      setHomeOtpError(err.message);
    } finally {
      setHomeOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200 relative">
      
      {/* Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 z-50 transition-all duration-100 animate-pulse" style={{ width: `${scrollProgress}%` }} />

      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900/10 blur-[180px] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[150px] pointer-events-none" />

      {/* STICKY NAV BAR */}
      <header className={`sticky top-0 z-40 w-full border-b transition-all duration-300 ${isScrolled ? 'bg-slate-950/95 border-white/10 shadow-xl shadow-slate-950/50 backdrop-blur-lg' : 'bg-transparent border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <img src="/logo.svg" className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-lg shadow-blue-500/10" alt="Nova Logo" />
            <div>
              <h1 className="text-sm font-extrabold m-0 tracking-wide text-white uppercase">NOVA LIBRARY</h1>
              <span className="text-[7px] text-yellow-400 font-bold tracking-wider block uppercase">Smart Library Management System</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-[11px] font-semibold text-white/70">
            <button onClick={() => scrollToSection('hero')} className={`hover:text-white transition-colors cursor-pointer bg-transparent border-none ${activeSection === 'hero' ? 'text-cyan-400 font-bold' : ''}`}>Home</button>
            <button onClick={() => scrollToSection('features')} className={`hover:text-white transition-colors cursor-pointer bg-transparent border-none ${activeSection === 'features' ? 'text-cyan-400 font-bold' : ''}`}>Features</button>
            <button onClick={() => scrollToSection('services')} className={`hover:text-white transition-colors cursor-pointer bg-transparent border-none ${activeSection === 'services' ? 'text-cyan-400 font-bold' : ''}`}>Services</button>
            <button onClick={() => scrollToSection('pricing')} className={`hover:text-white transition-colors cursor-pointer bg-transparent border-none ${activeSection === 'pricing' ? 'text-cyan-400 font-bold' : ''}`}>Pricing</button>
            <button onClick={() => scrollToSection('testimonials')} className={`hover:text-white transition-colors cursor-pointer bg-transparent border-none ${activeSection === 'testimonials' ? 'text-cyan-400 font-bold' : ''}`}>Testimonials</button>
            <button onClick={() => scrollToSection('faq')} className={`hover:text-white transition-colors cursor-pointer bg-transparent border-none ${activeSection === 'faq' ? 'text-cyan-400 font-bold' : ''}`}>FAQ</button>
            <button onClick={() => scrollToSection('contact')} className={`hover:text-white transition-colors cursor-pointer bg-transparent border-none ${activeSection === 'contact' ? 'text-cyan-400 font-bold' : ''}`}>Contact</button>
            <button onClick={() => scrollToSection('about')} className={`hover:text-white transition-colors cursor-pointer bg-transparent border-none ${activeSection === 'about' ? 'text-cyan-400 font-bold' : ''}`}>About</button>
          </nav>

          {/* Enter Platform CTA */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setOtpModalOpen(true)}
              className="px-4 py-2.5 rounded-full text-[10px] font-bold border border-cyan-500/30 text-cyan-300 bg-cyan-950/20 hover:bg-cyan-500 hover:text-slate-950 transition-all duration-300 cursor-pointer hidden sm:block"
            >
              Sign In via OTP
            </button>
            <button 
              onClick={onEnterPortal}
              className="group relative px-5 py-2.5 rounded-full text-[10px] font-bold bg-white text-slate-950 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-1.5 cursor-pointer"
            >
              Enter Portal
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Hamburger Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="block lg:hidden text-white hover:text-cyan-400 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
            >
              {mobileMenuOpen ? <XIcon className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-slate-950/98 backdrop-blur-xl lg:hidden animate-fade-in flex flex-col pt-24 px-8 space-y-6 text-sm font-semibold">
          <button 
            onClick={() => { scrollToSection('hero'); setMobileMenuOpen(false); }} 
            className="w-full text-left py-2 text-white/80 hover:text-white border-b border-white/5 bg-transparent border-none cursor-pointer"
          >
            Home
          </button>
          <button 
            onClick={() => { scrollToSection('features'); setMobileMenuOpen(false); }} 
            className="w-full text-left py-2 text-white/80 hover:text-white border-b border-white/5 bg-transparent border-none cursor-pointer"
          >
            Features
          </button>
          <button 
            onClick={() => { scrollToSection('services'); setMobileMenuOpen(false); }} 
            className="w-full text-left py-2 text-white/80 hover:text-white border-b border-white/5 bg-transparent border-none cursor-pointer"
          >
            Services
          </button>
          <button 
            onClick={() => { scrollToSection('pricing'); setMobileMenuOpen(false); }} 
            className="w-full text-left py-2 text-white/80 hover:text-white border-b border-white/5 bg-transparent border-none cursor-pointer"
          >
            Pricing
          </button>
          <button 
            onClick={() => { scrollToSection('testimonials'); setMobileMenuOpen(false); }} 
            className="w-full text-left py-2 text-white/80 hover:text-white border-b border-white/5 bg-transparent border-none cursor-pointer"
          >
            Testimonials
          </button>
          <button 
            onClick={() => { scrollToSection('faq'); setMobileMenuOpen(false); }} 
            className="w-full text-left py-2 text-white/80 hover:text-white border-b border-white/5 bg-transparent border-none cursor-pointer"
          >
            FAQ
          </button>
          <button 
            onClick={() => { scrollToSection('contact'); setMobileMenuOpen(false); }} 
            className="w-full text-left py-2 text-white/80 hover:text-white border-b border-white/5 bg-transparent border-none cursor-pointer"
          >
            Contact
          </button>
          <button 
            onClick={() => { scrollToSection('about'); setMobileMenuOpen(false); }} 
            className="w-full text-left py-2 text-white/80 hover:text-white border-b border-white/5 bg-transparent border-none cursor-pointer"
          >
            About
          </button>
          <div className="pt-6 flex flex-col gap-4">
            <button 
              onClick={() => { setOtpModalOpen(true); setMobileMenuOpen(false); }}
              className="w-full py-3 rounded-xl border border-cyan-500/30 text-cyan-300 bg-cyan-950/20 hover:bg-cyan-500 hover:text-slate-950 text-xs font-bold text-center cursor-pointer"
            >
              Sign In via OTP
            </button>
            <button 
              onClick={() => { onEnterPortal(); setMobileMenuOpen(false); }}
              className="w-full py-3 rounded-xl bg-white text-slate-950 text-xs font-bold text-center cursor-pointer"
            >
              Enter Portal
            </button>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section id="hero" className="relative pt-12 pb-24 md:pt-20 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Banner Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-8 animate-pulse">
          <Sparkles className="w-3 h-3 text-yellow-400" />
          Version 2.5: Venture-Scale Enterprise SaaS Node
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] max-w-4xl text-white mb-6">
          The Future of Academic Knowledge <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            Is Algorithmic & Intelligent
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-white/60 text-sm md:text-base max-w-2xl leading-relaxed mb-10">
          Welcome to Nova Library - Smart Library Management System. Integrating natural language AI librarians, 
          glassmorphic heatmaps, biometric scanning, and real-time WebSockets to compile a frictionless learning ecosystem.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-sm mb-16">
          <button 
            onClick={onEnterPortal}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-105 flex justify-center items-center gap-2.5 cursor-pointer"
          >
            Access Portal
            <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
          </button>
          <button 
            onClick={() => scrollToSection('ai-explorer')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-300 flex justify-center items-center gap-2 cursor-pointer"
          >
            Try AI Sandbox
          </button>
        </div>

        {/* Dashboard Mockup Showcase */}
        <div className="relative w-full max-w-5xl rounded-[30px] border border-white/10 bg-slate-900/30 p-2.5 backdrop-blur-2xl shadow-2xl shadow-blue-500/5">
          <div className="absolute -inset-1 rounded-[30px] bg-gradient-to-r from-blue-500/20 to-cyan-500/10 opacity-30 blur-xl -z-10" />
          <div className="rounded-[20px] overflow-hidden border border-white/5 relative bg-slate-950/80 aspect-[16/9] flex flex-col items-center justify-center p-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950/90 to-slate-950" />
            
            <div className="relative z-10 space-y-6 text-center max-w-lg">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 p-[2px] mx-auto shadow-2xl animate-pulse">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                  <Bot className="w-9 h-9 text-cyan-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Live AI Operations Console</h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Enter the portal with credentials <code className="text-yellow-400 font-mono px-1">admin / admin123</code> to access real-time circulation metrics, digital member badges, fines, and Power BI analytical graphs.
                </p>
              </div>
              <button 
                onClick={onEnterPortal}
                className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors mx-auto cursor-pointer"
              >
                Launch Live Interface <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK DEMO ACCESS SANDBOX */}
      <section id="demo-access" className="py-16 px-6 max-w-7xl mx-auto border-t border-white/5 relative">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block mb-2">Sandbox Gateway</span>
          <h2 className="text-3xl font-extrabold text-white">Direct Demo Portal Access</h2>
          <p className="text-white/60 text-xs mt-3 leading-relaxed">
            Select an enterprise tenant role below to instantly authenticate and launch their corresponding interface dashboards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Student */}
          <div 
            onClick={() => handleQuickLogin('john_doe', 'member123')}
            className="group relative rounded-3xl p-6 bg-slate-900/40 border border-white/10 hover:border-blue-500/30 transition-all duration-500 cursor-pointer hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(37,99,235,0.15)] flex flex-col justify-between min-h-[220px]"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-600/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500 mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-white text-base font-bold m-0 group-hover:text-blue-400 transition-colors">Student Member</h4>
              <p className="text-white/50 text-[11px] leading-relaxed mt-2">
                Check streaks, view achievements, search the AI catalog portal, and request reserves.
              </p>
            </div>
            <div className="relative z-10 flex justify-between items-center mt-4">
              <span className="text-[10px] font-bold text-blue-400 group-hover:underline">Launch Student Portal →</span>
              <span className="text-[9px] text-white/35 font-mono">john_doe</span>
            </div>
          </div>

          {/* Card 2: Staff */}
          <div 
            onClick={() => handleQuickLogin('librarian', 'lib123')}
            className="group relative rounded-3xl p-6 bg-slate-900/40 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 cursor-pointer hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] flex flex-col justify-between min-h-[220px]"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-600/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500 mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-white text-base font-bold m-0 group-hover:text-emerald-400 transition-colors">Staff Librarian</h4>
              <p className="text-white/50 text-[11px] leading-relaxed mt-2">
                Manage lending desks, issue/return books, check fine ledgers, and manage users.
              </p>
            </div>
            <div className="relative z-10 flex justify-between items-center mt-4">
              <span className="text-[10px] font-bold text-emerald-400 group-hover:underline">Launch Staff Portal →</span>
              <span className="text-[9px] text-white/35 font-mono">librarian</span>
            </div>
          </div>

          {/* Card 3: Organization Admin */}
          <div 
            onClick={() => handleQuickLogin('admin', 'admin123')}
            className="group relative rounded-3xl p-6 bg-slate-900/40 border border-white/10 hover:border-purple-500/30 transition-all duration-500 cursor-pointer hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(124,58,237,0.15)] flex flex-col justify-between min-h-[220px]"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-600/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-500 mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="text-white text-base font-bold m-0 group-hover:text-purple-400 transition-colors">Organization Admin</h4>
              <p className="text-white/50 text-[11px] leading-relaxed mt-2">
                Configure tenant rules, manage organization settings, customize branding and fine rates.
              </p>
            </div>
            <div className="relative z-10 flex justify-between items-center mt-4">
              <span className="text-[10px] font-bold text-purple-400 group-hover:underline">Launch Org Console →</span>
              <span className="text-[9px] text-white/35 font-mono">admin</span>
            </div>
          </div>

          {/* Card 4: Super Admin */}
          <div 
            onClick={() => handleQuickLogin('superadmin', 'admin123')}
            className="group relative rounded-3xl p-6 bg-slate-900/40 border border-white/10 hover:border-orange-500/30 transition-all duration-500 cursor-pointer hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)] flex flex-col justify-between min-h-[220px]"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-600/10 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-500 mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h4 className="text-white text-base font-bold m-0 group-hover:text-orange-400 transition-colors">Super Admin</h4>
              <p className="text-white/50 text-[11px] leading-relaxed mt-2">
                Monitor system global statistics, SaaS tenant node networks, CPU loads, and audit logs.
              </p>
            </div>
            <div className="relative z-10 flex justify-between items-center mt-4">
              <span className="text-[10px] font-bold text-orange-400 group-hover:underline">Launch SaaS System →</span>
              <span className="text-[9px] text-white/35 font-mono">superadmin</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRIDS */}
      <section id="features" className="py-24 px-6 border-t border-white/5 bg-slate-900/20 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block mb-2">Capabilities Core</span>
            <h2 className="text-3xl font-extrabold text-white">Designed for Next-Gen Learning Hubs</h2>
            <p className="text-white/60 text-xs mt-3 leading-relaxed">
              Nova Library X replaces archaic book databases with a modern dashboard inspired by notion, linear, and apex metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="glass-panel p-6 border-white/10 hover:border-white/20 transition-all duration-300 group hover:translate-y-[-4px] flex flex-col justify-between h-[230px]">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Bot className="w-5 h-5" />
                </div>
                <h4 className="text-white text-sm font-bold mb-2">NLP AI Librarian</h4>
                <p className="text-white/50 text-[11px] leading-relaxed">
                  Floating chatbot assistant powered by natural language matching. Finds catalog books and compiles overdue tasks instantly.
                </p>
              </div>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mt-4">Semantic Engine</span>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel p-6 border-white/10 hover:border-white/20 transition-all duration-300 group hover:translate-y-[-4px] flex flex-col justify-between h-[230px]">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:bg-cyan-600 group-hover:text-white transition-all">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="text-white text-sm font-bold mb-2">Secure OTP Lock</h4>
                <p className="text-white/50 text-[11px] leading-relaxed">
                  Secure two-factor OTP verification accessible directly from the Home Page for quick, password-less entry.
                </p>
              </div>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mt-4">Secure Nodes</span>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel p-6 border-white/10 hover:border-white/20 transition-all duration-300 group hover:translate-y-[-4px] flex flex-col justify-between h-[230px]">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:bg-amber-600 group-hover:text-white transition-all">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="text-white text-sm font-bold mb-2">Power BI Reports</h4>
                <p className="text-white/50 text-[11px] leading-relaxed">
                  Advanced charts illustrating circulation trends, category popularity, fine volumes, and exporting dynamic CSV formats.
                </p>
              </div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mt-4">Apex Analytics</span>
            </div>

            {/* Feature 4 */}
            <div className="glass-panel p-6 border-white/10 hover:border-white/20 transition-all duration-300 group hover:translate-y-[-4px] flex flex-col justify-between h-[230px]">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="text-white text-sm font-bold mb-2">WebSockets Channels</h4>
                <p className="text-white/50 text-[11px] leading-relaxed">
                  Real-time notification system dispatching ambient alerts, circulation updates, and payment requests instantly.
                </p>
              </div>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mt-4">Active Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI EXPLORER SANDBOX */}
      <section id="ai-explorer" className="py-24 px-6 max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest block">AI Search Sandbox</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Experience the NLP Chatbot Parsing Engine</h2>
            <p className="text-white/60 text-xs leading-relaxed">
              Nova Library contains a semantic scanner. Type a prompt like <code className="text-cyan-400 font-mono">"python"</code>, <code className="text-cyan-400 font-mono">"machine learning"</code>, or <code className="text-cyan-400 font-mono">"algorithms"</code> below to test the keyword extraction parser.
            </p>
            
            <form onSubmit={handleSimulatedSearch} className="flex gap-2 p-1.5 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-lg">
              <input 
                type="text" 
                placeholder="Type query (e.g. Find computer science books)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-white text-xs px-3 focus:ring-0"
              />
              <button 
                type="submit"
                disabled={searching}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {searching ? 'Parsing...' : 'Analyze'}
                <SearchIcon className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="flex items-center gap-3 text-[10px] text-white/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Connected to Sandbox AI Node</span>
            </div>
          </div>

          <div className="glass-panel p-6 border-white/10 min-h-[280px] bg-slate-900/30 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-32 h-32 rounded-full bg-blue-600/10 blur-2xl" />

            {!searchResult && !searching && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-3">
                <MessageSquare className="w-10 h-10 text-white/20" />
                <span className="text-xs text-white/40 font-medium">Ready for input. Submit a search query to activate parser.</span>
              </div>
            )}

            {searching && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-3">
                <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-cyan-400 font-bold animate-pulse">Running NLP Keyword Extraction...</span>
              </div>
            )}

            {searchResult && !searching && (
              <div className="space-y-4 animate-fade-in flex-grow">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">Intent: {searchResult.intent}</span>
                  <span className="text-[9px] text-white/40">Keywords: "{searchResult.extractedKeywords}"</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-white/50 block font-semibold">Simulated Match Results:</span>
                  {searchResult.mockMatches.map((book: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded bg-white/5 border border-white/5 text-[11px]">
                      <div>
                        <strong className="text-white block">{book.title}</strong>
                        <span className="text-[9px] text-white/40">{book.author} • {book.category}</span>
                      </div>
                      <span className="text-[10px] font-bold text-yellow-400">{book.match} Match</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300 leading-normal flex items-start gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-yellow-300 flex-shrink-0" />
                  <div>
                    <strong>Access Restricted</strong>: Authenticate your account to access real catalog databases, trigger holds, or issue items.
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-white/5 pt-4 mt-4 flex justify-between items-center">
              <span className="text-[9px] text-white/40">Platform Catalog Sandbox v2</span>
              <button 
                onClick={onEnterPortal}
                className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                Log In to Search Catalog <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="py-24 px-6 border-t border-white/5 bg-slate-950/30 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block mb-2">Core Services</span>
            <h2 className="text-3xl font-extrabold text-white">Full-Stack Enterprise Integration</h2>
            <p className="text-white/60 text-xs mt-3 leading-relaxed">
              Tailored services for scaling library operations, automating compliance, and deploying AI models.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-6 border-white/10 hover:border-cyan-500/20 transition-all duration-300">
              <h4 className="text-white text-base font-bold mb-2">RFID System Deployment</h4>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Connect physical smart-shelves and automated gates with real-time Flask WebSockets alerts.
              </p>
            </div>
            <div className="glass-panel p-6 border-white/10 hover:border-cyan-500/20 transition-all duration-300">
              <h4 className="text-white text-base font-bold mb-2">Speech-to-Text Search</h4>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Enable voice commands and suggestions across thousands of academic catalog nodes.
              </p>
            </div>
            <div className="glass-panel p-6 border-white/10 hover:border-cyan-500/20 transition-all duration-300">
              <h4 className="text-white text-base font-bold mb-2">Power BI Custom Reports</h4>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Create specific departmental data dashboards and automatically compile monthly CSV logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 border-t border-white/5 bg-slate-900/20 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block mb-2">Venture Tiers</span>
            <h2 className="text-3xl font-extrabold text-white">SaaS Subscription Models</h2>
            
            {/* Toggle */}
            <div className="inline-flex bg-white/5 border border-white/10 p-1 rounded-full mt-6 text-[10px]">
              <button 
                onClick={() => setPricingPeriod('monthly')}
                className={`px-4 py-1.5 rounded-full font-bold transition-all ${pricingPeriod === 'monthly' ? 'bg-blue-600 text-white' : 'text-white/60'}`}
              >
                Monthly Plan
              </button>
              <button 
                onClick={() => setPricingPeriod('yearly')}
                className={`px-4 py-1.5 rounded-full font-bold transition-all ${pricingPeriod === 'yearly' ? 'bg-blue-600 text-white' : 'text-white/60'}`}
              >
                Yearly Plan (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Tier 1 */}
            <div className="glass-panel p-6 border-white/10 flex flex-col justify-between h-[380px]">
              <div>
                <span className="text-[10px] text-white/50 uppercase block font-bold">Standard Node</span>
                <h3 className="text-3xl font-extrabold text-white mt-2">
                  ₹{pricingPeriod === 'monthly' ? '1,500' : '1,200'} <span className="text-xs text-white/40 font-normal">/ month</span>
                </h3>
                <ul className="space-y-2.5 text-[11px] text-white/60 mt-6 list-disc pl-4">
                  <li>Up to 1,000 Catalog Books</li>
                  <li>Basic Issue/Return Forms</li>
                  <li>Real-time WebSockets Alerts</li>
                  <li>Single Tenant Dashboard</li>
                </ul>
              </div>
              <button onClick={() => setOtpModalOpen(true)} className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer">
                Subscribe Standard
              </button>
            </div>

            {/* Tier 2 (Featured) */}
            <div className="glass-panel p-6 border-cyan-500/30 bg-gradient-to-b from-blue-950/40 to-slate-950/20 flex flex-col justify-between h-[400px] relative mt-[-10px] shadow-2xl">
              <span className="absolute top-3 right-4 text-[8px] bg-cyan-400 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">POPULAR</span>
              <div>
                <span className="text-[10px] text-cyan-400 uppercase block font-bold">Enterprise Core</span>
                <h3 className="text-3xl font-extrabold text-white mt-2">
                  ₹{pricingPeriod === 'monthly' ? '4,500' : '3,600'} <span className="text-xs text-white/40 font-normal">/ month</span>
                </h3>
                <ul className="space-y-2.5 text-[11px] text-white/80 mt-6 list-disc pl-4">
                  <li>Up to 10,000 Catalog Books</li>
                  <li>Power BI Dashboard Reports</li>
                  <li>Floating NLP AI Assistant</li>
                  <li>Member Reading Scores Tracker</li>
                  <li>Dedicated Support Node</li>
                </ul>
              </div>
              <button onClick={() => setOtpModalOpen(true)} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer">
                Deploy Enterprise Core
              </button>
            </div>

            {/* Tier 3 */}
            <div className="glass-panel p-6 border-white/10 flex flex-col justify-between h-[380px]">
              <div>
                <span className="text-[10px] text-white/50 uppercase block font-bold">Venture Cloud</span>
                <h3 className="text-3xl font-extrabold text-white mt-2">Custom</h3>
                <p className="text-white/50 text-[11px] mt-2">Customized setups for multi-campus networks and large government archives.</p>
                <ul className="space-y-2.5 text-[11px] text-white/60 mt-6 list-disc pl-4">
                  <li>Unlimited catalog items</li>
                  <li>Custom Branding configuration</li>
                  <li>Dedicated SLA & API Node</li>
                  <li>Database Migration Assistance</li>
                </ul>
              </div>
              <button onClick={() => setOtpModalOpen(true)} className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer">
                Contact Enterprise Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section id="testimonials" className="py-24 px-6 border-t border-white/5 bg-slate-950/20 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block mb-2">Reader Stories</span>
            <h2 className="text-3xl font-extrabold text-white">Trusted by Librarians & Students</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="glass-panel p-6 border-white/10 bg-slate-900/30">
              <p className="text-white/70 text-xs italic leading-relaxed">
                "The biometric Face ID simulation and real-time WebSockets have made library access completely frictionless. Our students love tracking their reading streaks!"
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div className="w-9 h-9 rounded-full bg-blue-600/20 flex items-center justify-center font-bold text-xs text-blue-400">Dr</div>
                <div>
                  <strong className="text-xs text-white block">Dr. Evelyn Carter</strong>
                  <span className="text-[9px] text-white/40">Dean of Academics, MIT Tech Institute</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 border-white/10 bg-slate-900/30">
              <p className="text-white/70 text-xs italic leading-relaxed">
                "We automated our monthly inventory checks completely using Nova's Power BI CSV exports. The NLP AI Assistant is exceptionally smart at finding titles."
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div className="w-9 h-9 rounded-full bg-cyan-600/20 flex items-center justify-center font-bold text-xs text-cyan-400">PL</div>
                <div>
                  <strong className="text-xs text-white block">Patricia Vance</strong>
                  <span className="text-[9px] text-white/40">Principal Librarian, Vance Business School</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 px-6 border-t border-white/5 bg-slate-950/50 relative">
        <div className="max-w-3xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block mb-2">Q&A</span>
            <h2 className="text-3xl font-extrabold text-white">Frequently Answered Queries</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "Is Nova Library multi-tenant?", a: "Yes, the system isolates database records, subscription rules, and branding settings completely based on organization parameters." },
              { q: "How does the AI Assistant chatbot work?", a: "The assistant processes queries semantically, analyzing keywords to extract intents and matches catalog titles accordingly." },
              { q: "Can we configure library fine rates?", a: "Absolutely. Organization admins can modify fine rates per day directly inside the general Settings panel." }
            ].map((faq, idx) => (
              <div key={idx} className="glass-panel border-white/10 overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left text-xs font-bold text-white hover:bg-white/5 flex justify-between items-center cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-cyan-400 text-lg">{openFaq === idx ? '-' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-[11px] text-white/60 border-t border-white/5 bg-white/5 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-24 px-6 border-t border-white/5 bg-slate-900/10 relative">
        <div className="max-w-xl mx-auto glass-panel p-8 border-white/10 bg-slate-900/30">
          <div className="text-center mb-8">
            <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block mb-2">Message Center</span>
            <h2 className="text-2xl font-extrabold text-white">Get in Touch With Us</h2>
            <p className="text-white/50 text-[10px] mt-2">Send an inquiry and our system node operators will respond shortly.</p>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); alert("Inquiry dispatched! Operational response node initialized."); }} className="space-y-4 text-xs">
            <div>
              <label className="text-white/60 block mb-1">Full Name</label>
              <input type="text" required placeholder="e.g. John Doe" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400" />
            </div>
            <div>
              <label className="text-white/60 block mb-1">Email Address</label>
              <input type="email" required placeholder="e.g. john@mits.edu" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400" />
            </div>
            <div>
              <label className="text-white/60 block mb-1">Message Content</label>
              <textarea rows={4} required placeholder="Describe your query..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"></textarea>
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-500/10 cursor-pointer">
              Dispatch Inquiry Node
            </button>
          </form>
        </div>
      </section>

      {/* STATS SECTION */}
      <section id="analytics" className="py-24 px-6 border-t border-white/5 bg-slate-900/10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block mb-2">Platform Pulse</span>
            <h2 className="text-3xl font-extrabold text-white">Platform-Wide Metrics Dashboard</h2>
            <p className="text-white/60 text-xs mt-3 leading-relaxed">
              Real-time monitoring stats aggregated across active college blocks and libraries.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 border-white/10 text-center relative overflow-hidden group">
              <div className="absolute top-[-10%] left-[-10%] w-16 h-16 rounded-full bg-blue-600/5 blur-xl group-hover:bg-blue-600/10 transition-colors" />
              <BookOpen className="w-6 h-6 text-blue-400 mx-auto mb-3" />
              <h3 className="text-3xl font-extrabold text-white tracking-tight">2,450+</h3>
              <span className="text-[10px] text-white/40 block mt-1 uppercase font-semibold">Active Volumes</span>
            </div>

            <div className="glass-panel p-6 border-white/10 text-center relative overflow-hidden group">
              <div className="absolute top-[-10%] left-[-10%] w-16 h-16 rounded-full bg-cyan-600/5 blur-xl group-hover:bg-cyan-600/10 transition-colors" />
              <Clock className="w-6 h-6 text-cyan-400 mx-auto mb-3" />
              <h3 className="text-3xl font-extrabold text-white tracking-tight">1,200+</h3>
              <span className="text-[10px] text-white/40 block mt-1 uppercase font-semibold">Smart Members</span>
            </div>

            <div className="glass-panel p-6 border-white/10 text-center relative overflow-hidden group">
              <div className="absolute top-[-10%] left-[-10%] w-16 h-16 rounded-full bg-amber-600/5 blur-xl group-hover:bg-amber-600/10 transition-colors" />
              <Activity className="w-6 h-6 text-amber-400 mx-auto mb-3" />
              <h3 className="text-3xl font-extrabold text-white tracking-tight">98.4%</h3>
              <span className="text-[10px] text-white/40 block mt-1 uppercase font-semibold">Uptime Metrics</span>
            </div>

            <div className="glass-panel p-6 border-white/10 text-center relative overflow-hidden group">
              <div className="absolute top-[-10%] left-[-10%] w-16 h-16 rounded-full bg-purple-600/5 blur-xl group-hover:bg-purple-600/10 transition-colors" />
              <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-3" />
              <h3 className="text-3xl font-extrabold text-white tracking-tight">96%</h3>
              <span className="text-[10px] text-white/40 block mt-1 uppercase font-semibold">AI Insights Match</span>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND FOOTER */}
      <footer id="about" className="py-12 border-t border-white/5 bg-slate-950 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" className="w-8 h-8 rounded-full object-cover border border-white/10" alt="Nova Logo" />
            <div>
              <span className="text-xs font-bold text-white block uppercase">NOVA LIBRARY</span>
              <span className="text-[8px] text-white/40 block">Smart Library Management System • Powered by Flask & React SPA Nodes</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-white/60">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">System Nodes: Stable</span>
            </div>
            <span className="text-[10px] text-white/30">© 2026 Nova Inc. All rights secured.</span>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {isScrolled && (
        <button
          onClick={() => scrollToSection('hero')}
          className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-500 border border-white/10 text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer font-bold text-sm"
        >
          ↑
        </button>
      )}

      {/* OTP LOGIN MODAL */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative glass-panel max-w-sm w-full p-8 border-white/20 bg-slate-900/90 rounded-[24px] shadow-2xl space-y-6">
            <button 
              onClick={() => { setOtpModalOpen(false); setHomeOtpStep(1); setHomeOtpCode(''); setHomeOtpError(''); setHomeOtpSuccess(''); }}
              className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer bg-transparent border-none text-sm font-bold"
            >
              ✕
            </button>
            <div className="text-center">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Secure OTP Login</h3>
              <p className="text-[10px] text-white/40 mt-1">Authenticate node via secure mobile/email OTP</p>
            </div>

            {homeOtpError && <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] text-center">{homeOtpError}</div>}
            {homeOtpSuccess && <div className="p-2.5 rounded bg-green-500/10 border border-green-500/20 text-green-300 text-[10px] text-center">{homeOtpSuccess}</div>}

            <form onSubmit={homeOtpStep === 1 ? handleHomeGenerateOTP : handleHomeVerifyOTP} className="space-y-4 text-xs">
              {homeOtpStep === 1 ? (
                <>
                  <div>
                    <label className="text-white/60 block mb-1 font-semibold">Email or Mobile Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. librarian@mits.edu" 
                      value={homeOtpIdentifier}
                      onChange={(e) => setHomeOtpIdentifier(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={homeOtpLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white font-bold transition-all shadow-lg cursor-pointer border-none text-xs"
                  >
                    {homeOtpLoading ? 'Generating...' : 'Get OTP Code'}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <span className="text-[9px] text-cyan-400 font-semibold block uppercase">Verify Code Sent to:</span>
                    <strong className="text-[11px] text-white mt-0.5 block">{homeOtpIdentifier}</strong>
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1 font-semibold text-center">6-Digit Verification Code</label>
                    <input 
                      type="text" 
                      maxLength={6} 
                      placeholder="e.g. 489201" 
                      value={homeOtpCode}
                      onChange={(e) => setHomeOtpCode(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-400 text-center font-mono tracking-widest text-base"
                    />
                    <div className="flex justify-between items-center text-[9px] mt-2">
                      {homeOtpTimer > 0 ? (
                        <span className="text-white/40">Resend in {homeOtpTimer}s</span>
                      ) : (
                        <button type="button" onClick={handleHomeGenerateOTP} className="text-yellow-400 hover:underline cursor-pointer bg-transparent border-none p-0">Resend OTP Code</button>
                      )}
                      <button type="button" onClick={() => { setHomeOtpStep(1); setHomeOtpCode(''); }} className="text-cyan-400 hover:underline cursor-pointer bg-transparent border-none p-0">Change Node</button>
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={homeOtpLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-teal-500 hover:to-emerald-600 text-white font-bold transition-all shadow-lg cursor-pointer border-none text-xs"
                  >
                    {homeOtpLoading ? 'Verifying...' : 'Verify & Log In'}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

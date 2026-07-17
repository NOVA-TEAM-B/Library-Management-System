import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, ArrowRight, Menu as MenuIcon, X as XIcon, ChevronUp, Send } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
  onEnterPortal: () => void;
  onOpenOtpModal: () => void;
}

export default function PublicLayout({ children, onEnterPortal, onOpenOtpModal }: PublicLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('hero');

  // Scroll detection for sticky navbar border & glow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to hash elements smoothly on path/hash updates
  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          const headerHeight = 80;
          const targetPosition = element.getBoundingClientRect().top + window.scrollY - headerHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    };

    scrollToHash();
    const timer = setTimeout(scrollToHash, 200);
    return () => clearTimeout(timer);
  }, [location.hash, location.pathname]);

  // Section observer to update activeState highlights during scroll
  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('');
      return;
    }

    const sections = ['hero', 'features', 'services', 'pricing', 'testimonials', 'faq', 'contact'];
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -65% 0px',
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
  }, [location.pathname]);

  // Back to top scroll handler
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSubscribed(false), 5000);
    }
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement | HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/#features' },
    { name: 'Services', path: '/#services' },
    { name: 'Pricing', path: '/#pricing' },
    { name: 'Testimonials', path: '/#testimonials' },
    { name: 'FAQ', path: '/#faq' },
    { name: 'Contact', path: '/#contact' },
    { name: 'About', path: '/about' }
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans overflow-x-hidden">
      {/* 1. PUBLIC HEADER NAVBAR */}
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-slate-950/80 border-b border-cyan-500/10 backdrop-blur-xl shadow-lg shadow-cyan-950/20' 
          : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo brand */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-all unselectable">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1.5px] shadow-lg shadow-blue-500/10">
              <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-extrabold m-0 tracking-wide text-white uppercase leading-none">NOVA LIBRARY</h1>
              <span className="text-[7px] text-yellow-400 font-bold tracking-wider block uppercase mt-1">Smart Library Management System</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-[11px] font-semibold text-white/70 unselectable">
            {navLinks.map((link) => {
              const isSectionActive = 
                (link.path === '/' && activeSection === 'hero') ||
                (link.path.startsWith('/#') && link.path.replace('/#', '') === activeSection) ||
                (location.pathname === link.path && !link.path.startsWith('/#'));

              return (
                <NavLink 
                  key={link.name}
                  to={link.path}
                  className={`hover:text-cyan-400 hover:drop-shadow-[0_0_6px_rgba(6,182,212,0.6)] transition-all duration-200 cursor-pointer ${
                    isSectionActive ? 'text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-white/70'
                  }`}
                >
                  {link.name}
                </NavLink>
              );
            })}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3 unselectable">
            <button 
              onClick={onOpenOtpModal}
              className="px-4 py-2 rounded-full text-[10px] font-bold border border-cyan-500/30 text-cyan-300 bg-cyan-950/20 hover:bg-cyan-500 hover:text-slate-950 hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all duration-300 cursor-pointer hidden sm:block"
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

            {/* Mobile Hamburger Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="block lg:hidden text-white hover:text-cyan-400 p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
            >
              {mobileMenuOpen ? <XIcon className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/98 backdrop-blur-xl lg:hidden animate-fade-in flex flex-col pt-24 px-8 space-y-6 text-sm font-semibold unselectable">
          {navLinks.map((link) => {
            const isSectionActive = 
              (link.path === '/' && activeSection === 'hero') ||
              (link.path.startsWith('/#') && link.path.replace('/#', '') === activeSection) ||
              (location.pathname === link.path && !link.path.startsWith('/#'));

            return (
              <NavLink 
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full text-left py-2 border-b border-white/5 transition-all cursor-pointer ${
                  isSectionActive ? 'text-cyan-400 font-bold pl-2 border-cyan-500/20' : 'text-white/80 hover:text-white'
                }`}
              >
                {link.name}
              </NavLink>
            );
          })}
          
          <div className="pt-6 flex flex-col gap-4">
            <button 
              onClick={() => { onOpenOtpModal(); setMobileMenuOpen(false); }}
              className="w-full py-3 rounded-xl border border-cyan-500/30 text-cyan-300 bg-cyan-950/20 hover:bg-cyan-500 hover:text-slate-950 text-xs font-bold text-center cursor-pointer"
            >
              Sign In via OTP
            </button>
            <button 
              onClick={() => { onEnterPortal(); setMobileMenuOpen(false); }}
              className="w-full py-3 rounded-xl bg-white text-slate-950 text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Enter Portal
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. BODY CONTENT */}
      <main className="flex-grow pt-20">
        {children}
      </main>

      {/* 3. PREMIUM FOOTER */}
      <footer className="border-t border-white/5 bg-slate-950 px-6 pt-16 pb-8 relative z-10 unselectable">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Logo & Company Description Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1.5px]">
                <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              </div>
              <span className="text-xs font-extrabold text-white tracking-widest uppercase">NOVA LIBRARY</span>
            </div>
            
            <p className="text-white/50 text-[11px] leading-relaxed max-w-sm">
              The next-generation library automation platform. Empowering academic and enterprise hubs with smart tracking, live RFID telemetry, and custom AI recommender nodes.
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-3">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-[#0A66C2] hover:drop-shadow-[0_0_8px_rgba(10,102,194,0.6)] transition-all duration-300 transform hover:scale-110 flex items-center justify-center w-8 h-8 rounded-full border border-white/5 bg-white/5 hover:bg-slate-900/50 cursor-pointer"
                title="LinkedIn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300 transform hover:scale-110 flex items-center justify-center w-8 h-8 rounded-full border border-white/5 bg-white/5 hover:bg-slate-900/50 cursor-pointer"
                title="GitHub"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-[#E4405F] hover:drop-shadow-[0_0_8px_rgba(228,64,95,0.6)] transition-all duration-300 transform hover:scale-110 flex items-center justify-center w-8 h-8 rounded-full border border-white/5 bg-white/5 hover:bg-slate-900/50 cursor-pointer"
                title="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-400 hover:text-[#1877F2] hover:drop-shadow-[0_0_8px_rgba(24,119,242,0.6)] transition-all duration-300 transform hover:scale-110 flex items-center justify-center w-8 h-8 rounded-full border border-white/5 bg-white/5 hover:bg-slate-900/50 cursor-pointer"
                title="Facebook"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>
          </div>

          {/* Product Links Column */}
          <div className="space-y-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5 text-[11px] text-white/50">
              <li><Link to="/features" className="hover:text-cyan-400 transition-colors">AI Features Grid</Link></li>
              <li><Link to="/services" className="hover:text-cyan-400 transition-colors">Services Engine</Link></li>
              <li><Link to="/pricing" className="hover:text-cyan-400 transition-colors">Pricing Packages</Link></li>
              <li><Link to="/testimonials" className="hover:text-cyan-400 transition-colors">Reader Testimonials</Link></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2.5 text-[11px] text-white/50">
              <li><Link to="/faq" className="hover:text-cyan-400 transition-colors">Knowledge Base FAQ</Link></li>
              <li><Link to="/about" className="hover:text-cyan-400 transition-colors">About System</Link></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">System Telemetry: Live</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">API Endpoint Specs</a></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="space-y-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Stay Synced</h4>
            <p className="text-white/50 text-[10px] leading-relaxed">
              Subscribe to receive core updates and roadmap feature telemetry reports.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="relative">
              <input 
                type="email" 
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="developer@nova.edu" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-10 py-2.5 text-[10px] text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
              <button 
                type="submit" 
                className="absolute right-1 top-1 bottom-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-2.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
              >
                {newsletterSubscribed ? <span className="text-[8px] font-bold">Done</span> : <Send className="w-3 h-3" />}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom copyright & telemetry sector */}
        <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-white/45">
          <div className="flex items-center gap-3">
            <span>© 2026 Nova Library Systems Inc. All rights secured.</span>
            <span className="text-white/15">|</span>
            <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
            <span className="text-white/15">|</span>
            <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-emerald-400 uppercase tracking-widest text-[9px]">SaaS Nodes Stable</span>
            </div>

            {/* Back to Top */}
            <button 
              onClick={scrollToTop} 
              className="bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title="Scroll to Top"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

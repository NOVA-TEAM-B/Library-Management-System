import React, { useState } from 'react';
import { Bot, ArrowRight, Sparkles, BookOpen, Search as SearchIcon, Cpu, Zap, Activity } from 'lucide-react';
import FeaturesPage from './public/FeaturesPage';
import ServicesPage from './public/ServicesPage';
import PricingPage from './public/PricingPage';
import TestimonialsPage from './public/TestimonialsPage';
import FAQPage from './public/FAQPage';
import ContactPage from './public/ContactPage';

interface HomeProps {
  onEnterPortal: () => void;
}

export default function Home({ onEnterPortal }: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
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

  return (
    <div className="space-y-24 pb-20 overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* 1. IMMERSIVE HERO SECTION */}
      <section className="relative pt-16 pb-24 md:pt-28 md:pb-36 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Background Grid & Beams Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_80%,transparent_100%)] opacity-30 z-0 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-600/10 to-cyan-500/10 blur-[130px] rounded-full z-0 pointer-events-none" />
        <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent z-0 pointer-events-none" />

        {/* Hero content wrapper */}
        <div className="relative z-10 max-w-3xl space-y-6">
          {/* Badge */}
          <span className="unselectable inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-950/20">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" /> System v2.4 Active
          </span>

          {/* Heading */}
          <h1 className="unselectable text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1] m-0 bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400">
            Automating Institutional <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
              Library Operations
            </span>
          </h1>

          {/* Subtitle */}
          <p className="unselectable text-slate-400 text-xs md:text-sm leading-relaxed max-w-xl mx-auto">
            A next-generation multi-tenant SaaS framework for modern campuses. Experience dynamic RFID check-ins, automated fine calculation nodes, and ambient NLP search pipelines.
          </p>

          {/* CTAs */}
          <div className="unselectable flex items-center justify-center gap-4 pt-4">
            <button 
              onClick={onEnterPortal}
              className="px-6 py-3 rounded-full text-xs font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white shadow-lg shadow-cyan-950/30 transition-all duration-300 hover:scale-105 flex items-center gap-1.5 cursor-pointer"
            >
              Access System Console <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dashboard Mockup Showcase (Interactive Mouse Glow) */}
        <div 
          onMouseMove={handleCardMouseMove}
          className="mouse-glow-card relative w-full max-w-4xl rounded-[30px] border border-white/10 bg-slate-900/30 p-2.5 backdrop-blur-2xl shadow-2xl shadow-blue-500/5 mt-16"
        >
          <div className="absolute -inset-1 rounded-[30px] bg-gradient-to-r from-blue-500/20 to-cyan-500/10 opacity-30 blur-xl -z-10" />
          
          <div className="rounded-[20px] overflow-hidden border border-white/5 relative bg-slate-950/90 aspect-[16/9] flex flex-col items-center justify-center p-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950/95 to-slate-950" />
            
            <div className="relative z-10 space-y-6 text-center max-w-lg">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1.5px] mx-auto shadow-2xl animate-pulse">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                  <Bot className="w-7 h-7 text-cyan-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-white text-base font-extrabold uppercase tracking-wider">Live AI Operations Console</h3>
                <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
                  Access the portal with credentials <code className="text-yellow-400 font-mono px-1">admin / admin123</code> to access real-time circulation metrics, digital member badges, fines, and Power BI analytical graphs.
                </p>
              </div>
              <button 
                onClick={onEnterPortal}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors mx-auto cursor-pointer"
              >
                Launch Live Interface <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NUMBERS SECTION (Counters) */}
      <section className="py-16 px-6 border-y border-white/5 bg-slate-950/40 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center">
          {[
            { value: "50,000+", label: "Books Managed" },
            { value: "150+", label: "Institutions" },
            { value: "1 Million+", label: "Transactions" },
            { value: "99.99%", label: "System Uptime" },
            { value: "24/7", label: "Cloud Monitoring" },
            { value: "100%", label: "Secure Auth" }
          ].map((stat, idx) => (
            <div 
              key={idx}
              onMouseMove={handleCardMouseMove}
              className="mouse-glow-card glass-panel py-8 px-4 border border-white/5 bg-slate-900/10 rounded-2xl"
            >
              <span className="text-2xl md:text-3xl font-extrabold text-white block font-mono">{stat.value}</span>
              <span className="text-[9px] text-white/40 uppercase tracking-wider font-bold block mt-2">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. AI EXPLORER SANDBOX */}
      <section className="py-12 px-6 max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left info column */}
          <div className="space-y-6">
            <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest block">AI Search Sandbox</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">Experience the NLP Chatbot Parsing Engine</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Input search strings (e.g. "find programming books") to simulate our Python-based natural language processing algorithm. The system identifies intent, matches book classifications, and updates catalog records instantly.
            </p>
            
            <form onSubmit={handleSimulatedSearch} className="relative">
              <input 
                type="text" 
                placeholder="Type query (e.g. Find computer science books)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-28 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all shadow-inner"
              />
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500"><SearchIcon className="w-4.5 h-4.5" /></span>
              <button 
                type="submit" 
                disabled={searching}
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 rounded-xl text-[10px] transition-colors flex items-center justify-center cursor-pointer"
              >
                {searching ? 'Parsing...' : 'Parse Query'}
              </button>
            </form>
          </div>

          {/* Right result column */}
          <div 
            onMouseMove={handleCardMouseMove}
            className="mouse-glow-card glass-panel p-6 border border-white/10 bg-slate-900/30 rounded-[24px] min-h-[260px] flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> NLP Parser Output
                </span>
                <span className="text-[9px] text-white/35 font-mono">STATUS: ACTIVE</span>
              </div>
              
              {searchResult ? (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="text-white/40 block">Detected Intent</span>
                      <strong className="text-white block mt-0.5">{searchResult.intent}</strong>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="text-white/40 block">Extracted Keywords</span>
                      <strong className="text-cyan-300 block mt-0.5 font-mono">"{searchResult.extractedKeywords}"</strong>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-white/40 block font-bold uppercase">Dynamic Matches ({searchResult.mockMatches.length})</span>
                    {searchResult.mockMatches.map((m: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/5">
                        <div>
                          <strong className="text-white block text-[11px]">{m.title}</strong>
                          <span className="text-white/45 text-[9px] block mt-0.5">{m.author} • {m.category}</span>
                        </div>
                        <span className="text-[9px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">{m.match} Match</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-white/40 text-[11px] leading-relaxed">
                  Enter a search query in the sandbox input to review the parsed classification metadata output.
                </div>
              )}
            </div>

            <div className="border-t border-white/5 pt-3.5 flex justify-between items-center text-[9px] text-white/35 font-mono uppercase tracking-wider">
              <span>Token: SHA-256 Validated</span>
              <span>Latency: 0.12ms</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TECHNOLOGY SECTION */}
      <section className="py-12 px-6 max-w-7xl mx-auto relative border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block mb-2">Systems Stack</span>
          <h3 className="text-2xl font-extrabold text-white">Technologies Powering the Nodes</h3>
        </div>

        <div className="flex flex-wrap justify-center gap-3.5 max-w-4xl mx-auto unselectable">
          {[
            "React", "Flask", "Python", "SQLite", "PostgreSQL", "JWT Keys", "WebSockets", "Redis Cache", "Docker Dev", "Tailwind CSS"
          ].map((tech, idx) => (
            <div 
              key={idx}
              className="px-4 py-2 border border-white/10 rounded-xl font-mono text-[9px] font-bold uppercase tracking-wider bg-white/5 text-white/60 hover:text-cyan-400 hover:border-cyan-500/20 hover:bg-slate-900/30 transition-all duration-300 flex items-center gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> {tech}
            </div>
          ))}
        </div>
      </section>

      {/* 5. FEATURES SECTION */}
      <section id="features" className="scroll-mt-20">
        <FeaturesPage />
      </section>

      {/* 6. SERVICES SECTION */}
      <section id="services" className="scroll-mt-20">
        <ServicesPage />
      </section>

      {/* 7. PRICING SECTION */}
      <section id="pricing" className="scroll-mt-20">
        <PricingPage onOpenLogin={onEnterPortal} />
      </section>

      {/* 8. TESTIMONIALS SECTION */}
      <section id="testimonials" className="scroll-mt-20">
        <TestimonialsPage />
      </section>

      {/* 9. FAQ SECTION */}
      <section id="faq" className="scroll-mt-20">
        <FAQPage />
      </section>

      {/* 10. CONTACT SECTION */}
      <section id="contact" className="scroll-mt-20">
        <ContactPage />
      </section>
      
    </div>
  );
}

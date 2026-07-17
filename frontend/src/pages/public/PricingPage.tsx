import React, { useState } from 'react';
import { Check, Sparkles, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';

interface PricingPageProps {
  onOpenLogin: () => void;
}

export default function PricingPage({ onOpenLogin }: PricingPageProps) {
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const standardFeatures = [
    "Up to 1,000 Catalog Books",
    "Basic Issue/Return Forms",
    "Real-time WebSockets Alerts",
    "Single Tenant Dashboard",
    "Daily automated data backing"
  ];

  const enterpriseFeatures = [
    "Up to 10,000 Catalog Books",
    "Power BI Dashboard Reports",
    "Floating NLP AI Assistant",
    "Member Reading Scores Tracker",
    "Dedicated Support Node",
    "Cryptographic Member Badges"
  ];

  const ventureFeatures = [
    "Unlimited catalog items",
    "Custom Branding Configuration",
    "Dedicated SLA & API Node",
    "Database Migration Assistance",
    "Face Recognition Entrance integration",
    "24/7 Priority Cloud Monitoring"
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 py-16 px-6 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 z-0" />
      <div className="aurora-glow-1 top-[10%] left-[10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full z-0" />
      <div className="aurora-glow-2 bottom-[10%] right-[10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full z-0" />

      <div className="max-w-7xl mx-auto relative z-10 pt-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CreditCard className="w-3 h-3 text-purple-400" /> Venture Tiers
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-none">
            SaaS Subscription Models
          </h2>
          <p className="text-white/60 text-xs md:text-sm mt-3 leading-relaxed max-w-xl mx-auto">
            Choose the right scaling tier to power your library operations, automate compliance, and launch AI search engines.
          </p>

          {/* Monthly/Yearly Toggle */}
          <div className="inline-flex bg-white/5 border border-white/10 p-1 rounded-full mt-6 text-[10px]">
            <button 
              onClick={() => setPricingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer ${pricingPeriod === 'monthly' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'}`}
            >
              Monthly Plan
            </button>
            <button 
              onClick={() => setPricingPeriod('yearly')}
              className={`px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer ${pricingPeriod === 'yearly' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'}`}
            >
              Yearly Plan (Save 20%)
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center mt-12">
          {/* Card 1: Standard */}
          <div 
            onMouseMove={handleCardMouseMove}
            className="mouse-glow-card glass-panel p-8 border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between h-[440px] rounded-[24px] bg-slate-900/30"
          >
            <div>
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Standard Node</span>
              <div className="mt-4 flex items-baseline text-white">
                <span className="text-4xl font-extrabold tracking-tight">₹{pricingPeriod === 'monthly' ? '1,500' : '1,200'}</span>
                <span className="ml-1 text-xs text-white/40 font-semibold">/ month</span>
              </div>
              <p className="text-white/50 text-[10px] mt-2">Essential features for smaller institutes and department shelves.</p>
              
              <ul className="space-y-3 mt-6">
                {standardFeatures.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-[11px] text-white/70">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <button 
              onClick={onOpenLogin}
              className="w-full mt-8 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold transition-all duration-200 cursor-pointer"
            >
              Subscribe Standard
            </button>
          </div>

          {/* Card 2: Enterprise Core (Featured) */}
          <div 
            onMouseMove={handleCardMouseMove}
            className="mouse-glow-card glass-panel p-8 border border-cyan-500/30 bg-gradient-to-b from-blue-950/40 to-slate-950/20 flex flex-col justify-between h-[480px] rounded-[30px] relative shadow-2xl shadow-cyan-950/40"
          >
            <div className="absolute top-4 right-4 bg-cyan-400 text-slate-950 font-extrabold text-[8px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-cyan-500/10">
              <Sparkles className="w-2.5 h-2.5" /> Popular
            </div>
            
            <div>
              <span className="text-[10px] text-cyan-400 uppercase font-extrabold tracking-widest">Enterprise Core</span>
              <div className="mt-4 flex items-baseline text-white">
                <span className="text-4xl font-extrabold tracking-tight">₹{pricingPeriod === 'monthly' ? '4,500' : '3,600'}</span>
                <span className="ml-1 text-xs text-white/40 font-semibold">/ month</span>
              </div>
              <p className="text-white/60 text-[10px] mt-2">Perfect automation package for large campus libraries and analytics.</p>
              
              <ul className="space-y-3 mt-6">
                {enterpriseFeatures.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-[11px] text-white/90">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <button 
              onClick={onOpenLogin}
              className="w-full mt-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5"
            >
              Deploy Enterprise Core <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Venture Cloud */}
          <div 
            onMouseMove={handleCardMouseMove}
            className="mouse-glow-card glass-panel p-8 border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between h-[440px] rounded-[24px] bg-slate-900/30"
          >
            <div>
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Venture Cloud</span>
              <div className="mt-4 flex items-baseline text-white">
                <span className="text-4xl font-extrabold tracking-tight">Custom</span>
              </div>
              <p className="text-white/50 text-[10px] mt-2">Tailored setups for multi-campus networks and state archives.</p>
              
              <ul className="space-y-3 mt-6">
                {ventureFeatures.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-[11px] text-white/70">
                    <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <button 
              onClick={onOpenLogin}
              className="w-full mt-8 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold transition-all duration-200 cursor-pointer"
            >
              Contact Enterprise Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

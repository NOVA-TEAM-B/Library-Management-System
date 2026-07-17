import React from 'react';
import { Bot, Shield, TrendingUp, Zap, Sparkles, Key, Database, Globe, QrCode } from 'lucide-react';

export default function FeaturesPage() {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 py-16 px-6 overflow-hidden">
      {/* Background Decorative Gradients & Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 z-0" />
      <div className="aurora-glow-1 top-[-20%] left-[20%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full z-0" />
      <div className="aurora-glow-2 bottom-[10%] right-[10%] w-[550px] h-[550px] bg-cyan-500/10 blur-[130px] rounded-full z-0" />

      <div className="max-w-7xl mx-auto relative z-10 pt-8">
        {/* Page Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" /> Capabilities Core
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-none">
            Designed for Next-Gen Learning Hubs
          </h2>
          <p className="text-white/60 text-xs md:text-sm mt-3 leading-relaxed max-w-xl mx-auto">
            Nova Library replaces archaic databases with a premium Bento grid design and lightning-fast real-time telemetry.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Main Card 1: NLP AI Assistant (Large, col-span-2, row-span-2) */}
          <div 
            onMouseMove={handleMouseMove}
            className="mouse-glow-card md:col-span-2 md:row-span-2 glass-panel p-8 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between min-h-[440px] bg-gradient-to-br from-blue-950/20 to-slate-950/40 rounded-[30px]"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-600/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 mb-6">
                <Bot className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">NLP AI Operations Assistant</h3>
              <p className="text-white/60 text-xs leading-relaxed max-w-lg">
                Our ambient NLP AI core parses human commands in real time. Search catalog volumes, issue overdue tasks, calculate aggregate statistics, and request intelligent recommendations using standard conversation templates.
              </p>
            </div>

            {/* Visual element representing a simulated chat */}
            <div className="mt-8 border border-white/5 bg-slate-950/60 p-4 rounded-2xl space-y-3 font-mono text-[10px] text-white/50 shadow-inner">
              <div className="flex justify-between items-center text-[9px] border-b border-white/5 pb-1">
                <span className="text-cyan-400">assistant-nlp-node // online</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <div className="flex gap-2">
                <span className="text-yellow-400">User:</span>
                <span>"Find standard computer networks books on shelf 2 and reserve them"</span>
              </div>
              <div className="flex gap-2 text-cyan-300">
                <span>AI:</span>
                <span>"Mapped: 3 books found. Generated hold reservations for John Doe."</span>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Semantic Processing Engine</span>
              <span className="text-[9px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold">98% Match Rate</span>
            </div>
          </div>

          {/* Card 2: Secure OTP Lock (Standard) */}
          <div 
            onMouseMove={handleMouseMove}
            className="mouse-glow-card glass-panel p-6 border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between min-h-[210px] rounded-[24px] bg-slate-900/30"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-white text-sm font-bold mb-2">Secure OTP Lock</h4>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Secure two-factor validation accessible from the login portal for quick, password-less entry. Protects user registry keys dynamically.
              </p>
            </div>
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mt-4">2FA Cryptography</span>
          </div>

          {/* Card 3: Power BI Analytics (Standard) */}
          <div 
            onMouseMove={handleMouseMove}
            className="mouse-glow-card glass-panel p-6 border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between min-h-[210px] rounded-[24px] bg-slate-900/30"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-white text-sm font-bold mb-2">Power BI Reports</h4>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Advanced charts illustrating circulation trends, category popularity, fine volumes, and exporting dynamic CSV formats.
              </p>
            </div>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mt-4">Telemetry Analytics</span>
          </div>

          {/* Card 4: WebSockets Sync Channels (Medium, col-span-2) */}
          <div 
            onMouseMove={handleMouseMove}
            className="mouse-glow-card md:col-span-2 glass-panel p-6 border border-white/10 hover:border-cyan-500/20 transition-all duration-300 flex flex-col justify-between min-h-[210px] rounded-[24px] bg-slate-900/30"
          >
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-2.5 max-w-sm">
                <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
                <h4 className="text-white text-sm font-bold">Real-time WebSockets Sync</h4>
                <p className="text-white/50 text-[11px] leading-relaxed">
                  Socket.io server pushes instantaneous circulation telemetry, member leaderboard score changes, fine alert overlays, and system status pings without database poll delays.
                </p>
              </div>

              {/* simulated websocket streams */}
              <div className="flex-1 border border-white/5 bg-slate-950/40 p-3.5 rounded-xl space-y-1.5 font-mono text-[9px] text-emerald-400/80 shadow-inner">
                <div className="flex justify-between border-b border-white/5 pb-1 text-slate-500">
                  <span>WS_EVENT_CHANNEL</span>
                  <span>SYNC</span>
                </div>
                <div className="flex justify-between"><span>[OK] MEMBER_CHECKIN: john_doe</span><span className="text-slate-500">2s ago</span></div>
                <div className="flex justify-between"><span>[OK] RESERVATION_HOLD: book_id:12</span><span className="text-slate-500">5s ago</span></div>
                <div className="flex justify-between text-yellow-400"><span>[WARN] OVERDUE_ISSUE: fine calculated</span><span className="text-slate-500">12s ago</span></div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Active Channel Streams</span>
              <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">0.05ms Latency</span>
            </div>
          </div>

          {/* Card 5: Cross-Tenant Routing */}
          <div 
            onMouseMove={handleMouseMove}
            className="mouse-glow-card glass-panel p-6 border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between min-h-[210px] rounded-[24px] bg-slate-900/30"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Globe className="w-5 h-5" />
              </div>
              <h4 className="text-white text-sm font-bold mb-2">Multi-Organization Routing</h4>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Connect multiple college campuses or branches under a single deployment. Dynamic subdomain resolvers isolate catalog data and telemetry nodes.
              </p>
            </div>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mt-4">Cross-Tenant Resolver</span>
          </div>

          {/* Card 6: Digital Member Badges */}
          <div 
            onMouseMove={handleMouseMove}
            className="mouse-glow-card glass-panel p-6 border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between min-h-[210px] rounded-[24px] bg-slate-900/30"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                <QrCode className="w-5 h-5" />
              </div>
              <h4 className="text-white text-sm font-bold mb-2">Digital Member Badges</h4>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Scan-and-go QR-embedded membership identification cards. Syncs library checks, building entry validation, and leaderboard profile rewards.
              </p>
            </div>
            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block mt-4">Identity Verification</span>
          </div>

          {/* Card 7: Data Scalability (Medium, col-span-2) */}
          <div 
            onMouseMove={handleMouseMove}
            className="mouse-glow-card md:col-span-2 glass-panel p-6 border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between min-h-[210px] rounded-[24px] bg-slate-900/30"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-white text-sm font-bold mb-2">Relational Data Integrity</h4>
              <p className="text-white/50 text-[11px] leading-relaxed max-w-xl">
                Engineered with strict foreign key constraints, cascading deletions, index optimizations, and transaction rollbacks. Powered by SQLAlchemy configurations to support high-concurrent issue pings.
              </p>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mt-4">Database Architecture</span>
          </div>
        </div>
      </div>
    </div>
  );
}

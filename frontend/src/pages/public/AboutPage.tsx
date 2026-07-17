import React from 'react';
import { Sparkles, Terminal, Award, GitMerge, CheckCircle, Cpu, BookOpen } from 'lucide-react';

interface TechItem {
  name: string;
  category: string;
  color: string;
}

export default function AboutPage() {
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const timelineSteps = [
    { title: "Student Registers", desc: "User inputs credentials and academic details into the registration node." },
    { title: "OTP Verification", desc: "Temporary 6-digit cryptographic verification key is sent and validated." },
    { title: "Digital Membership", desc: "System auto-generates digital QR badge mapping profile and borrowing scores." },
    { title: "Borrow Book", desc: "Desk scans QR/barcode, real-time database locks allocation keys." },
    { title: "Return Book", desc: "Return scans clear holds, check fine constraints, and update availability." },
    { title: "Analytics Updated", desc: "Power BI graphs and global leaderboard ranks sync via WebSockets feeds." }
  ];

  const technologies: TechItem[] = [
    { name: "React", category: "Frontend Core", color: "text-cyan-400 border-cyan-500/20 bg-cyan-950/10" },
    { name: "Flask", category: "Backend Node", color: "text-emerald-400 border-emerald-500/20 bg-emerald-950/10" },
    { name: "Python", category: "Systems Logic", color: "text-blue-400 border-blue-500/20 bg-blue-950/10" },
    { name: "SQLite / MySQL", category: "Relational DB", color: "text-yellow-400 border-yellow-500/20 bg-yellow-950/10" },
    { name: "JWT", category: "Authentication Key", color: "text-purple-400 border-purple-500/20 bg-purple-950/10" },
    { name: "Socket.io", category: "WS Telemetry", color: "text-rose-400 border-rose-500/20 bg-rose-950/10" },
    { name: "Tailwind CSS", category: "Styling Tokens", color: "text-sky-400 border-sky-500/20 bg-sky-950/10" },
    { name: "Redis", category: "OTP Cache", color: "text-red-400 border-red-500/20 bg-red-950/10" },
    { name: "Docker", category: "Deployment", color: "text-cyan-300 border-cyan-400/20 bg-cyan-900/10" },
    { name: "Firebase", category: "Identity", color: "text-amber-400 border-amber-500/20 bg-amber-950/10" },
    { name: "Google OAuth", category: "SSO Clearence", color: "text-blue-300 border-blue-400/20 bg-blue-900/10" },
    { name: "Razorpay", category: "Fine Checkout", color: "text-indigo-400 border-indigo-500/20 bg-indigo-950/10" },
    { name: "Twilio", category: "SMS Dispatch", color: "text-red-500 border-red-500/20 bg-red-950/10" },
    { name: "SQLAlchemy", category: "ORM Mapping", color: "text-amber-500 border-amber-500/20 bg-amber-950/10" }
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 py-16 px-6 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 z-0" />
      <div className="aurora-glow-1 top-[10%] left-[10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full z-0" />
      <div className="aurora-glow-2 bottom-[20%] right-[10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full z-0" />

      <div className="max-w-7xl mx-auto relative z-10 pt-8">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Terminal className="w-3 h-3 text-blue-400" /> System Architecture
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-none">
            About Nova Library
          </h2>
          <p className="text-white/60 text-xs md:text-sm mt-3 leading-relaxed max-w-xl mx-auto">
            A state-of-the-art multi-tenant library automation framework designed to streamline catalog indexes, manage student records, and execute real-time telemetry.
          </p>
        </div>

        {/* Section 1: Vision Split grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div className="space-y-6">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">Institutional Vision & Automation</h3>
            <p className="text-white/50 text-xs leading-relaxed">
              Traditional library software relies on outdated schemas and lack immediate alerts. Nova Library bridges this gap by introducing modern web technologies (React SPAs + Flask REST APIs) to catalog processing.
            </p>
            <p className="text-white/50 text-xs leading-relaxed">
              Designed with scalability and performance at the core, organization administrators can deploy nodes, customize daily fine rates, monitor active sessions, and review circulation metrics in under a minute.
            </p>

            <div className="flex gap-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">Multi-Tenant Isolation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">Secure JWT Guards</span>
              </div>
            </div>
          </div>

          {/* Vision Mock card */}
          <div 
            onMouseMove={handleCardMouseMove}
            className="mouse-glow-card glass-panel p-8 border border-white/10 bg-slate-900/30 rounded-[30px] shadow-2xl relative"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Academic Quality Standard</h4>
                  <span className="text-[8px] text-white/40 uppercase block">Certified Node Architecture</span>
                </div>
              </div>
              <p className="text-white/50 text-[11px] leading-relaxed italic">
                "Our faculty instructed that the library management system should behave like a professional SaaS website, offering instant response times and a clean visual hierarchy."
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Animated Timeline Roadmap */}
        <div className="max-w-5xl mx-auto mt-24">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest block mb-2">Automation flow</span>
            <h3 className="text-2xl font-extrabold text-white">System Operations Roadmap</h3>
          </div>

          <div className="relative border-l border-white/10 pl-6 space-y-12 max-w-3xl mx-auto">
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-[35px] top-1 w-[18px] h-[18px] rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>
                
                {/* Step content */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest block">Step 0{idx + 1}</span>
                  <h4 className="text-white text-sm font-bold group-hover:text-cyan-300 transition-colors">{step.title}</h4>
                  <p className="text-white/50 text-[11px] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Powered Technologies Badges Grid */}
        <div className="max-w-5xl mx-auto mt-24">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block mb-2">Systems Stack</span>
            <h3 className="text-2xl font-extrabold text-white">Technologies Powering the Nodes</h3>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {technologies.map((tech, idx) => (
              <div 
                key={idx}
                className={`flex items-center gap-2.5 px-4 py-2 border rounded-xl font-semibold text-xs tracking-wider transition-all hover:scale-105 hover:bg-slate-900/50 ${tech.color}`}
              >
                <Cpu className="w-4 h-4 shrink-0" />
                <div>
                  <span className="text-white block font-bold text-[11px] leading-tight">{tech.name}</span>
                  <span className="text-[8px] opacity-50 block uppercase font-bold tracking-widest mt-0.5">{tech.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

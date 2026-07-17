import React from 'react';
import { 
  Bot, Radio, QrCode, CreditCard, Sparkles, BarChart3, 
  CloudLightning, Scan, ScanFace, Mic, Cpu, Smartphone 
} from 'lucide-react';

interface ServiceItem {
  icon: React.ReactNode;
  title: string;
  desc: string;
  features: string[];
  techStack: string[];
  metric: string;
  metricLabel: string;
  glowColor: string;
}

export default function ServicesPage() {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const services: ServiceItem[] = [
    {
      icon: <Bot className="w-6 h-6 text-cyan-400" />,
      title: "AI Library Assistant",
      desc: "An ambient NLP AI chatbot parsing catalog search queries, issuing reminders, and compiling reports instantly.",
      features: ["Natural language intent matching", "Overdue tasks automation", "Intelligent context awareness"],
      techStack: ["Flask", "Python NLP", "TensorFlow"],
      metric: "98.7%",
      metricLabel: "Intent Accuracy",
      glowColor: "rgba(6, 182, 212, 0.15)"
    },
    {
      icon: <Radio className="w-6 h-6 text-blue-400" />,
      title: "RFID Smart Tracking",
      desc: "Connect physical smart shelves and automatic security gates to monitor active books in real time.",
      features: ["Immediate shelf positioning", "Anti-theft WebSocket alerts", "Tag inventory pings"],
      techStack: ["NodeMCU", "WebSockets", "Flask-SocketIO"],
      metric: "0.05ms",
      metricLabel: "Ping Latency",
      glowColor: "rgba(59, 130, 246, 0.15)"
    },
    {
      icon: <QrCode className="w-6 h-6 text-emerald-400" />,
      title: "QR Attendance Gate",
      desc: "Scan and check in members dynamically using QR badges to compile building metrics.",
      features: ["Scan-and-go validation", "Peak hours load tracker", "Daily log compiling"],
      techStack: ["React", "HTML5-QRCode", "SQLite3"],
      metric: "120ms",
      metricLabel: "Checkin Speed",
      glowColor: "rgba(16, 185, 129, 0.15)"
    },
    {
      icon: <CreditCard className="w-6 h-6 text-purple-400" />,
      title: "Digital Membership Badges",
      desc: "Secure cryptographic member cards embedded with unique QR data to authenticate profiles.",
      features: ["Dynamic barcode generation", "Borrow limits indicators", "Leaderboard rank mapping"],
      techStack: ["React", "JWT Claims", "CSS Grid"],
      metric: "100%",
      metricLabel: "Secure Crypt",
      glowColor: "rgba(139, 92, 246, 0.15)"
    },
    {
      icon: <Sparkles className="w-6 h-6 text-amber-400" />,
      title: "Book Recommendation AI",
      desc: "Suggest books based on reading scores, history patterns, and peer departmental interests.",
      features: ["Collaborative filtering scoring", "Auto hold suggestions", "Interest trend maps"],
      techStack: ["Python Scikit", "SQLAlchemy", "Pandas"],
      metric: "94%",
      metricLabel: "Recommender Score",
      glowColor: "rgba(245, 158, 11, 0.15)"
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-pink-400" />,
      title: "Analytics Dashboard",
      desc: "Enterprise Power BI dashboard illustrating total catalog items, active reservations, and fine metrics.",
      features: ["Circulation graphs", "Departmental reports", "Dynamic CSV/XLSX export"],
      techStack: ["Recharts", "Flask Reports API", "Pandas"],
      metric: "60 FPS",
      metricLabel: "Fluid Rendering",
      glowColor: "rgba(236, 72, 153, 0.15)"
    },
    {
      icon: <CloudLightning className="w-6 h-6 text-cyan-400" />,
      title: "Encrypted Cloud Backups",
      desc: "Scheduled, secure backups safeguarding membership data, audit logs, and catalog items.",
      features: ["Automated daily backups", "Encrypted schema archives", "One-click rollback pings"],
      techStack: ["PostgreSQL", "AWS S3", "Python Cron"],
      metric: "99.99%",
      metricLabel: "Data Uptime",
      glowColor: "rgba(6, 182, 212, 0.15)"
    },
    {
      icon: <Scan className="w-6 h-6 text-blue-400" />,
      title: "OCR Book Scanner",
      desc: "Extract text from physical book covers and receipts to auto-populate master catalog titles.",
      features: ["Auto cover image crop", "OCR metadata fields extraction", "Duplication checks"],
      techStack: ["Tesseract.js", "OpenCV", "Flask API"],
      metric: "1.2s",
      metricLabel: "OCR Processing",
      glowColor: "rgba(59, 130, 246, 0.15)"
    },
    {
      icon: <ScanFace className="w-6 h-6 text-emerald-400" />,
      title: "Face Recognition Entry",
      desc: "Verify member identities at library entrances for contactless logs and secure gate openings.",
      features: ["Contactless face scan logs", "Real-time blacklist alarms", "Dual validation keys"],
      techStack: ["Face-API.js", "Python OpenCV", "PyTorch"],
      metric: "99.8%",
      metricLabel: "Accuracy Rate",
      glowColor: "rgba(16, 185, 129, 0.15)"
    },
    {
      icon: <Mic className="w-6 h-6 text-purple-400" />,
      title: "Voice Search Commands",
      desc: "Enable hands-free catalog search by speaking book titles or categories directly to the mic.",
      features: ["Web Speech recognition", "Fuzzy title phonetics matching", "Ambient noise filter"],
      techStack: ["Web Speech API", "React Hooks", "NLP parser"],
      metric: "0.15s",
      metricLabel: "Voice Response",
      glowColor: "rgba(139, 92, 246, 0.15)"
    },
    {
      icon: <Cpu className="w-6 h-6 text-amber-400" />,
      title: "REST API Integration",
      desc: "Open developer portals allowing third-party applications to sync catalogs and student records.",
      features: ["Secure JWT token keys", "Rate-limiting headers", "Full swagger documentation"],
      techStack: ["Flask Restful", "Redis Cache", "Swagger UI"],
      metric: "10,000/s",
      metricLabel: "API Throughput",
      glowColor: "rgba(245, 158, 11, 0.15)"
    },
    {
      icon: <Smartphone className="w-6 h-6 text-rose-400" />,
      title: "Mobile Catalog Sync",
      desc: "Check book availability and renew lending deadlines on any mobile viewport.",
      features: ["PWA offline index caching", "Push notify reminders", "Barcode checks"],
      techStack: ["PWA Service Worker", "Vite PWA", "Firebase"],
      metric: "100%",
      metricLabel: "Mobile Responsive",
      glowColor: "rgba(244, 63, 94, 0.15)"
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 py-16 px-6 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 z-0" />
      <div className="aurora-glow-1 top-[10%] right-[10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full z-0" />
      <div className="aurora-glow-2 bottom-[20%] left-[10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full z-0" />

      <div className="max-w-7xl mx-auto relative z-10 pt-8">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles className="w-3 h-3 text-blue-400" /> Enterprise Integration
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-none">
            Core Service Architecture
          </h2>
          <p className="text-white/60 text-xs md:text-sm mt-3 leading-relaxed max-w-xl mx-auto">
            Deploy advanced microservices, automated entry checkpoints, and analytics engines to modernize institutional library catalogs.
          </p>
        </div>

        {/* 12 Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {services.map((s, idx) => (
            <div
              key={idx}
              onMouseMove={handleMouseMove}
              style={{ '--glow-color': s.glowColor } as React.CSSProperties}
              className="mouse-glow-card glass-panel p-6 border border-white/10 hover:border-cyan-500/20 transition-all duration-300 flex flex-col justify-between h-[390px] rounded-[24px] bg-slate-900/30 group hover:translate-y-[-4px] hover:shadow-[0_12px_30px_rgba(6,182,212,0.06)]"
            >
              <div>
                {/* Header: Icon & Metric indicator */}
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center transition-all group-hover:scale-105 group-hover:bg-slate-900">
                    {s.icon}
                  </div>
                  <div className="text-right">
                    <span className="text-[14px] font-extrabold text-cyan-400 font-mono block">{s.metric}</span>
                    <span className="text-[7px] text-white/40 font-bold uppercase tracking-wider block">{s.metricLabel}</span>
                  </div>
                </div>

                {/* Title & Desc */}
                <h3 className="text-white text-sm font-bold mb-2 group-hover:text-cyan-300 transition-colors">{s.title}</h3>
                <p className="text-white/50 text-[11px] leading-relaxed mb-4">{s.desc}</p>

                {/* Features Bullet List */}
                <ul className="space-y-1.5 text-[10px] text-white/60 mb-6 list-none pl-0">
                  {s.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/40" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer: Tech badges & CTA */}
              <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
                <div className="flex gap-1.5 flex-wrap">
                  {s.techStack.map((t, i) => (
                    <span 
                      key={i} 
                      className="text-[8px] bg-white/5 text-white/60 border border-white/10 px-2 py-0.5 rounded font-bold font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <button className="text-[9px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-transparent border-none cursor-pointer group-hover:translate-x-0.5 transition-all">
                  Launch Node <i className="fa-solid fa-chevron-right text-[7px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Star, Quote, Sparkles } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  inst: string;
  title: string;
  avatar: string;
  stars: number;
  review: string;
  color: string;
}

export default function TestimonialsPage() {
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const testimonials: Testimonial[] = [
    {
      name: "Dr. Evelyn Carter",
      role: "Dean of Academics",
      inst: "MIT Tech Institute",
      title: "Frictionless Campus Access",
      avatar: "EC",
      stars: 5,
      review: "The biometric Face ID simulation and real-time WebSockets have made library access completely frictionless. Our students love tracking their reading streaks!",
      color: "from-blue-500/10 to-indigo-500/5"
    },
    {
      name: "Patricia Vance",
      role: "Principal Librarian",
      inst: "Vance Business School",
      title: "Reduced Workload By 80%",
      avatar: "PV",
      stars: 5,
      review: "We automated our monthly inventory checks completely using Nova's Power BI CSV exports. The NLP AI Assistant is exceptionally smart at finding titles.",
      color: "from-cyan-500/10 to-blue-500/5"
    },
    {
      name: "Rohan Sharma",
      role: "B.Tech CSE Student",
      inst: "MIT Tech Institute",
      title: "Instant Book Discovery",
      avatar: "RS",
      stars: 5,
      review: "The AI Recommendations and OTP login are amazing! I can search and hold books in seconds right from my mobile. It has completely changed how I prepare for my exams.",
      color: "from-emerald-500/10 to-teal-500/5"
    },
    {
      name: "Dr. Amit Verma",
      role: "Professor, CSE Dept",
      inst: "Vance Engineering College",
      title: "Empowers Reference Finding",
      avatar: "AV",
      stars: 5,
      review: "With the REST API integrations and master catalog search, recommending specific reference manuals to my research students is completely automated. Exceptional value.",
      color: "from-purple-500/10 to-indigo-500/5"
    },
    {
      name: "Sarah Jenkins",
      role: "Senior Librarian",
      inst: "City Digital Library",
      title: "Operations Are Seamless",
      avatar: "SJ",
      stars: 5,
      review: "Handling issues, returns, and tracking fines used to take hours. Now, with the automatic Socket.io alert feeds, our front desk operations are entirely paperless.",
      color: "from-amber-500/10 to-orange-500/5"
    },
    {
      name: "Priya Patel",
      role: "Research Scholar, AI/ML",
      inst: "MIT Tech Institute",
      title: "Incredibly Precise NLP Search",
      avatar: "PP",
      stars: 5,
      review: "The NLP AI Assistant chatbot is exceptionally smart. I can speak a research query, and it finds exact match categories, shelf numbers, and book counts without any friction.",
      color: "from-rose-500/10 to-pink-500/5"
    },
    {
      name: "Dr. Rajesh Nair",
      role: "College Principal",
      inst: "MITS Engineering Hub",
      title: "Unrivalled Institutional Uptime",
      avatar: "RN",
      stars: 5,
      review: "Implementing Nova Library across our multi-campus network has unified our catalogs. The Power BI analytics give us perfect insights into resource distribution.",
      color: "from-blue-500/10 to-cyan-500/5"
    },
    {
      name: "Vikram Malhotra",
      role: "Digital Library Coordinator",
      inst: "National Archives",
      title: "Fast OCR Catalog Seeding",
      avatar: "VM",
      stars: 5,
      review: "The OCR scanner and digital badge authentication work flawlessly. We scanned over 5,000 reference covers in under a week, auto-populating our database with high precision.",
      color: "from-purple-500/10 to-pink-500/5"
    },
    {
      name: "Neha Gupta",
      role: "MCA Student",
      inst: "Vance Business School",
      title: "Modern, Gamified UI Layout",
      avatar: "NG",
      stars: 5,
      review: "The glassmorphism design looks beautiful. Tracking my borrowing streaks and check-ins on the leaderboard is fun and highly engaging. A masterpiece of modern web design.",
      color: "from-cyan-500/10 to-emerald-500/5"
    },
    {
      name: "Prof. Marcus Vance",
      role: "Faculty of Info Systems",
      inst: "Vance Business School",
      title: "Flawless Multi-Tenant Isolation",
      avatar: "MV",
      stars: 5,
      review: "As a faculty coordinator, I appreciate how the subdomain routing isolates academic portals. It operates at 99.99% uptime with instant telemetry alerts.",
      color: "from-amber-500/10 to-yellow-500/5"
    },
    {
      name: "Karan Johar",
      role: "B.Tech ME Student",
      inst: "MITS Engineering Hub",
      title: "OTP Signin is Super Smooth",
      avatar: "KJ",
      stars: 5,
      review: "I don't need to remember passwords anymore. The quick OTP verification logs me into my student panel in one click. Checking available copies before visiting library saves my day.",
      color: "from-rose-500/10 to-orange-500/5"
    },
    {
      name: "Dr. Lisa Ray",
      role: "Head Librarian",
      inst: "Tech Institute of Science",
      title: "Auto Fine Center Analytics",
      avatar: "LR",
      stars: 5,
      review: "Calculations for overdue books and fines are completely automated and dispatched via WebSockets. It has resolved all checkout disputes with members.",
      color: "from-emerald-500/10 to-cyan-500/5"
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 py-16 px-6 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 z-0" />
      <div className="aurora-glow-1 top-[20%] right-[10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full z-0" />
      <div className="aurora-glow-2 bottom-[20%] left-[10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full z-0" />

      <div className="max-w-7xl mx-auto relative z-10 pt-8">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" /> Reader Stories
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-none">
            Trusted by Librarians & Students
          </h2>
          <p className="text-white/60 text-xs md:text-sm mt-3 leading-relaxed max-w-xl mx-auto">
            See how institutions around the country utilize Nova Library to automate inventory cataloging, secure member records, and speed up lending operations.
          </p>
        </div>

        {/* Seamless Infinite Auto-scrolling Testimonials Container */}
        <div className="relative w-full overflow-hidden py-10 unselectable">
          {/* Left/Right Edge Fades */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

          {/* Scrolling Flex row */}
          <div className="flex gap-6 animate-infinite-scroll">
            {/* Original Row */}
            <div className="flex gap-6 shrink-0">
              {testimonials.map((t, idx) => (
                <div
                  key={idx}
                  onMouseMove={handleCardMouseMove}
                  className={`mouse-glow-card glass-panel p-6 border border-white/10 hover:border-cyan-500/20 transition-all duration-300 w-[290px] h-[250px] flex flex-col justify-between bg-gradient-to-br ${t.color} rounded-[20px]`}
                >
                  <div className="space-y-2.5">
                    {/* Stars & Quote Icon */}
                    <div className="flex justify-between items-center">
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.stars }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-transparent" />
                        ))}
                      </div>
                      <Quote className="w-4 h-4 text-cyan-400/40" />
                    </div>
                    {/* Review Title & Body */}
                    <h5 className="text-[11px] font-bold text-white leading-tight">{t.title}</h5>
                    <p className="text-white/60 text-[9.5px] leading-relaxed italic">
                      "{t.review}"
                    </p>
                  </div>

                  {/* Profile section */}
                  <div className="flex items-center gap-3 border-t border-white/5 pt-3 mt-4">
                    <div className="w-8.5 h-8.5 rounded-full bg-cyan-950 border border-cyan-500/25 flex items-center justify-center font-bold text-[10px] text-cyan-400">
                      {t.avatar}
                    </div>
                    <div className="overflow-hidden">
                      <strong className="text-[10px] text-white block truncate">{t.name}</strong>
                      <span className="text-[8px] text-white/40 block truncate">{t.role}, {t.inst}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Duplicate Row for Seamless Loop */}
            <div className="flex gap-6 shrink-0" aria-hidden="true">
              {testimonials.map((t, idx) => (
                <div
                  key={`dup-${idx}`}
                  onMouseMove={handleCardMouseMove}
                  className={`mouse-glow-card glass-panel p-6 border border-white/10 hover:border-cyan-500/20 transition-all duration-300 w-[290px] h-[250px] flex flex-col justify-between bg-gradient-to-br ${t.color} rounded-[20px]`}
                >
                  <div className="space-y-2.5">
                    {/* Stars & Quote Icon */}
                    <div className="flex justify-between items-center">
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.stars }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-transparent" />
                        ))}
                      </div>
                      <Quote className="w-4 h-4 text-cyan-400/40" />
                    </div>
                    {/* Review Title & Body */}
                    <h5 className="text-[11px] font-bold text-white leading-tight">{t.title}</h5>
                    <p className="text-white/60 text-[9.5px] leading-relaxed italic">
                      "{t.review}"
                    </p>
                  </div>

                  {/* Profile section */}
                  <div className="flex items-center gap-3 border-t border-white/5 pt-3 mt-4">
                    <div className="w-8.5 h-8.5 rounded-full bg-cyan-950 border border-cyan-500/25 flex items-center justify-center font-bold text-[10px] text-cyan-400">
                      {t.avatar}
                    </div>
                    <div className="overflow-hidden">
                      <strong className="text-[10px] text-white block truncate">{t.name}</strong>
                      <span className="text-[8px] text-white/40 block truncate">{t.role}, {t.inst}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section Telemetry Footer Note */}
        <div className="text-center mt-8 text-[9px] text-white/30 font-mono tracking-widest uppercase">
          Feed: Pauses on Hover // Auto-Resumes on mouseleave
        </div>
      </div>
    </div>
  );
}

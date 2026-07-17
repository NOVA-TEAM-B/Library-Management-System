import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Sparkles } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSent, setIsSent] = useState(false);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setIsSent(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setIsSent(false), 5000);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 py-16 px-6 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 z-0" />
      <div className="aurora-glow-1 top-[20%] right-[10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full z-0" />
      <div className="aurora-glow-2 bottom-[10%] left-[10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full z-0" />

      <div className="max-w-6xl mx-auto relative z-10 pt-8">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <MessageSquare className="w-3 h-3 text-rose-400" /> Communication Node
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-none">
            Get in Touch With Us
          </h2>
          <p className="text-white/60 text-xs md:text-sm mt-3 leading-relaxed max-w-xl mx-auto">
            Initialize an inquiry thread. Our system operators and library technical team will respond shortly.
          </p>
        </div>

        {/* Split grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto mt-12 items-start">
          {/* Left Column: Contact details */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white">Institutional Support Operations</h3>
              <p className="text-white/50 text-xs leading-relaxed max-w-md">
                For questions regarding multi-tenant configurations, custom RFID shelf setups, SLA backups, or academic plan pricing, contact our regional support nodes directly.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-8">
              {/* Detail 1 */}
              <div 
                onMouseMove={handleCardMouseMove}
                className="mouse-glow-card glass-panel p-5 border border-white/5 bg-slate-900/20 rounded-2xl flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] text-white/40 uppercase tracking-widest font-bold font-mono">Inquiry Dispatch</h4>
                  <span className="text-xs text-white block mt-1 font-semibold">support@novalibrary.edu</span>
                  <span className="text-[10px] text-white/50 block mt-0.5">Response Time: Within 12 Hours</span>
                </div>
              </div>

              {/* Detail 2 */}
              <div 
                onMouseMove={handleCardMouseMove}
                className="mouse-glow-card glass-panel p-5 border border-white/5 bg-slate-900/20 rounded-2xl flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] text-white/40 uppercase tracking-widest font-bold font-mono">Support Helpline</h4>
                  <span className="text-xs text-white block mt-1 font-semibold">+1 (555) 019-8234</span>
                  <span className="text-[10px] text-white/50 block mt-0.5">Available: Mon - Fri, 9AM - 6PM</span>
                </div>
              </div>

              {/* Detail 3 */}
              <div 
                onMouseMove={handleCardMouseMove}
                className="mouse-glow-card glass-panel p-5 border border-white/5 bg-slate-900/20 rounded-2xl flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] text-white/40 uppercase tracking-widest font-bold font-mono">Operations Headquarters</h4>
                  <span className="text-xs text-white block mt-1 font-semibold">MITS Research Park, Sector 4</span>
                  <span className="text-[10px] text-white/50 block mt-0.5">Silicon Valley Core Node, CA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Glassmorphic form */}
          <div 
            onMouseMove={handleCardMouseMove}
            className="mouse-glow-card glass-panel p-8 border border-white/10 bg-slate-900/30 rounded-[30px] shadow-2xl shadow-cyan-950/20"
          >
            {isSent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <Send className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white text-base font-bold">Inquiry Sent Successfully</h4>
                  <p className="text-white/50 text-[10px] max-w-xs">
                    Your message has been parsed and logged in the queue. Support response node initiated.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-white/60 font-semibold block">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/60 font-semibold block">Academic/Work Email</label>
                    <input 
                      type="email" 
                      required 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@mit.edu" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-white/60 font-semibold block">Subject</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. RFID Shelf Deployment Details" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-white/60 font-semibold block">Message</label>
                  <textarea 
                    required 
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Detail your institution requirements..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg border border-white/10 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02]"
                >
                  Submit Inquiry <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

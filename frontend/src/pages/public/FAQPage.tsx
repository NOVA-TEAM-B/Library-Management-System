import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

export default function FAQPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs: FaqItem[] = [
    // Existing FAQs
    { 
      q: "Is Nova Library multi-tenant?", 
      a: "Yes, the system isolates database records, subscription rules, and branding settings completely based on organization parameters." 
    },
    { 
      q: "How does the AI Assistant chatbot work?", 
      a: "The assistant processes queries semantically, analyzing keywords to extract intents and matches catalog titles accordingly." 
    },
    { 
      q: "Can we configure library fine rates?", 
      a: "Absolutely. Organization admins can modify fine rates per day directly inside the general Settings panel." 
    },
    // 10 New FAQs
    {
      q: "How does the OTP Login system authenticate users?",
      a: "The system generates a secure, single-use 6-digit verification code, caching it temporarily and sending it via verified email nodes. Users log in securely without needing static passwords."
    },
    {
      q: "Can I switch back to standard Password Login?",
      a: "Yes. Members can use either secure OTP validation or standard password-based sign-in from the Login portal, based on their registry preference."
    },
    {
      q: "What features are available on the Student Dashboard?",
      a: "Students can view active book checkouts, hold reservations status, accumulated fine balances, reading streaks, and global leaderboard rankings."
    },
    {
      q: "What tools are provided in the Staff Dashboard?",
      a: "Librarians can access the Lending Desk (Issue/Return), register check-ins, manage fine waivers, approve hold requests, and view catalog inventory status."
    },
    {
      q: "What parameters can the Admin Dashboard control?",
      a: "Admins have elevated keys to update organization logo/subdomain settings, modify fine rates, manage the student registry database, and view Power BI reports."
    },
    {
      q: "How does the Book Reservation system hold works?",
      a: "When a member requests a hold, the reservation is queued. The shelf manager is notified to secure the book. Holds expire automatically if not checked out within 48 hours."
    },
    {
      q: "How are late return fines calculated?",
      a: "Fines are calculated daily based on the organization's fine rate set in Settings. Telemetry nodes update balances automatically when an issue crosses the deadline."
    },
    {
      q: "Where can I view my complete borrowing history?",
      a: "The Borrowing History panel displays all past books checkouts, exact return dates, fine payments, and active reading streaks."
    },
    {
      q: "How secure is our library data?",
      a: "All records are secured behind JWT tokens, password hashing, and endpoint role guards. Telemetry logs track administrative commands continuously."
    },
    {
      q: "How do custom analytics reports export?",
      a: "Reports can compile into standard CSV format directly from the Reports view, detailing catalog inventory availability and circulation telemetry."
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 py-16 px-6 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 z-0" />
      <div className="aurora-glow-1 top-[10%] left-[20%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full z-0" />
      <div className="aurora-glow-2 bottom-[10%] right-[10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full z-0" />

      <div className="max-w-3xl mx-auto relative z-10 pt-8">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <HelpCircle className="w-3 h-3 text-cyan-400" /> Knowledge Base
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-none">
            Frequently Answered Queries
          </h2>
          <p className="text-white/60 text-xs md:text-sm mt-3 leading-relaxed">
            Find immediate answers regarding member dashboards, late return fines, AI NLP searches, and account registrations.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4 max-w-2xl mx-auto">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className={`glass-panel border transition-all duration-300 rounded-[18px] overflow-hidden ${
                  isOpen ? 'border-cyan-500/35 bg-slate-900/40 shadow-lg shadow-cyan-950/20' : 'border-white/10 bg-slate-900/10 hover:border-white/20'
                }`}
              >
                <button 
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left text-xs font-bold text-white hover:bg-white/5 flex justify-between items-center cursor-pointer transition-all duration-200"
                >
                  <span className="pr-4">{faq.q}</span>
                  <span className="text-cyan-400 font-mono transition-transform duration-300">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
                  </span>
                </button>
                
                {/* Smooth transition answer block */}
                <div className={`faq-expand ${isOpen ? 'active border-t border-white/5 bg-slate-950/40' : ''}`}>
                  <div className="p-5 text-[11px] text-white/60 leading-relaxed">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

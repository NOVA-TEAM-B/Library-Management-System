import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, User, HelpCircle } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  type?: string;
  data?: any[];
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: "Hello! I am Nova, your AI Knowledge Companion. 📚✨ I can help you search books, check accounts, or view reports. Try asking: 'Find books on Python' or 'Recommend a popular book'!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setHistory(prev => [...prev, { sender: 'user', text: userMsg, timestamp: time }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/dashboard/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: userMsg })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.msg || 'AI error occurred');
      }

      setHistory(prev => [...prev, {
        sender: 'bot',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: data.type,
        data: data.data
      }]);

    } catch (err: any) {
      setHistory(prev => [...prev, {
        sender: 'bot',
        text: `I apologize, but I encountered an error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* CSS Keyframes for Holographic Float and Scanning Line */}
      <style>{`
        @keyframes holoFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        @keyframes holoPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(6, 182, 212, 0.4); }
          50% { box-shadow: 0 0 30px rgba(168, 85, 247, 0.6); }
        }
        @keyframes holoScan {
          0% { top: 0%; opacity: 0.3; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.3; }
        }
      `}</style>

      {/* CHAT TOGGLE BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 border border-cyan-400/50 cursor-pointer"
          style={{ animation: 'holoPulse 3s infinite' }}
        >
          <div className="relative">
            <span className="absolute -inset-1 rounded-full bg-cyan-400/30 blur animate-ping" />
            <Sparkles className="w-5.5 h-5.5 text-yellow-300 relative" />
          </div>
          <span className="font-extrabold text-xs tracking-wider uppercase pr-1">Ask Nova AI</span>
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div 
          className="glass-panel w-96 h-[510px] flex flex-col overflow-hidden animate-fade-in shadow-[0_0_35px_rgba(6,182,212,0.15)] border-cyan-500/30 bg-[#0b0f19]/95 backdrop-blur-2xl rounded-[24px]" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            animation: 'holoFloat 6s ease-in-out infinite'
          }}
        >
          {/* Holographic scanner line indicator */}
          <div className="absolute left-0 right-0 h-0.5 bg-cyan-400/30 shadow-[0_0_8px_#22d3ee] pointer-events-none z-50" style={{
            animation: 'holoScan 4.2s linear infinite'
          }} />

          {/* Header */}
          <div className="p-3 border-b border-white/10 bg-gradient-to-r from-blue-950/80 to-indigo-950/80 flex justify-between items-center relative">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
              </div>
              <div>
                <h5 className="font-extrabold text-xs m-0 tracking-wider text-white uppercase">Nova AI Companion</h5>
                <span className="text-[9px] text-cyan-400 font-mono tracking-widest block uppercase mt-0.5">Hologram active node</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white hover:bg-white/5 p-1 rounded-lg transition-colors cursor-pointer">
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Messages History */}
          <div ref={scrollRef} className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-950/20">
            {history.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10' : 'bg-white/5 text-slate-200 rounded-bl-none border border-white/10 shadow-lg'}`}>
                  <p className="m-0 font-sans">{msg.text}</p>
                  
                  {/* Inline list rendering */}
                  {msg.type === 'books' && msg.data && (
                    <div className="mt-2.5 space-y-2 pt-2.5 border-t border-white/10">
                      {msg.data.map((book: any) => (
                        <div key={book.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                          <img src={book.cover_url} className="w-8 h-11 object-cover rounded-lg" alt="" />
                          <div className="overflow-hidden">
                            <strong className="text-[10px] block truncate text-yellow-400">{book.title}</strong>
                            <span className="text-[8px] text-white/50 block">By {book.author}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.type === 'issues' && msg.data && (
                    <div className="mt-2.5 space-y-2 pt-2.5 border-t border-white/10">
                      {msg.data.map((issue: any) => (
                        <div key={issue.id} className="p-2 rounded-xl bg-red-950/20 border border-red-500/20 text-[9px]">
                          <div className="text-white font-medium truncate">{issue.book_title}</div>
                          <div className="text-white/60 mt-0.5">Borrower ID: {issue.member_name}</div>
                          <div className="text-red-400 font-bold mt-0.5">Due: {issue.due_date.split(' ')[0]}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <span className="text-[8px] text-slate-500 block text-right mt-1.5 font-mono">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white/5 text-slate-300 rounded-2xl rounded-bl-none p-3 border border-white/10 text-xs flex items-center gap-2 shadow-lg">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="font-mono text-[10px] text-cyan-400">RESEARCHING NODE...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions - Expanded matching specific features */}
          <div className="px-3 py-2 bg-slate-950/40 border-t border-white/5 flex gap-1.5 overflow-x-auto text-[9px] whitespace-nowrap scrollbar-none">
            <button onClick={() => loadSuggestion('Do I have any fines?')} className="bg-white/5 border border-white/10 text-white/80 px-2.5 py-1 rounded-full hover:bg-white/15 transition-all">Fine Enquiry</button>
            <button onClick={() => loadSuggestion('Show my reservations')} className="bg-white/5 border border-white/10 text-white/80 px-2.5 py-1 rounded-full hover:bg-white/15 transition-all">Hold Status</button>
            <button onClick={() => loadSuggestion('When are my books due?')} className="bg-white/5 border border-white/10 text-white/80 px-2.5 py-1 rounded-full hover:bg-white/15 transition-all">Due Dates</button>
            <button onClick={() => loadSuggestion('FAQ')} className="bg-white/5 border border-white/10 text-white/80 px-2.5 py-1 rounded-full hover:bg-white/15 transition-all">Help & FAQ</button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-2.5 border-t border-white/10 bg-slate-950/60 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Nova to scan catalog, check fines..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
            />
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-2.5 rounded-xl hover:from-cyan-500 hover:to-blue-600 transition-all flex items-center justify-center shadow-lg shadow-cyan-500/10 cursor-pointer">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

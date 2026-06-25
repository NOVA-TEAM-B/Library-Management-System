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
      {/* CHAT TOGGLE BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 border border-white/20 animate-bounce"
        >
          <Sparkles className="w-6 h-6 text-yellow-300" />
          <span className="font-semibold text-sm pr-1">Ask Nova</span>
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="glass-panel w-96 h-[500px] flex flex-direction-col overflow-hidden animate-fade-in shadow-2xl border-white/20" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div className="p-3 border-b border-white/10 bg-blue-900/60 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              <div>
                <h5 className="font-semibold text-sm m-0 text-white">Nova AI Librarian</h5>
                <span className="text-[10px] text-cyan-300">Active Knowledge Node</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages History */}
          <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto space-y-3 bg-blue-950/20">
            {history.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-xs ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-white rounded-bl-none border border-white/15'}`}>
                  <p className="m-0 leading-relaxed">{msg.text}</p>
                  
                  {/* Inline list rendering */}
                  {msg.type === 'books' && msg.data && (
                    <div className="mt-2 space-y-2 pt-2 border-t border-white/10">
                      {msg.data.map((book: any) => (
                        <div key={book.id} className="flex items-center gap-2 p-1.5 rounded bg-white/5 border border-white/5">
                          <img src={book.cover_url} className="w-8 h-11 object-cover rounded" alt="" />
                          <div className="overflow-hidden">
                            <strong className="text-[10px] block truncate text-yellow-400">{book.title}</strong>
                            <span className="text-[8px] text-white/60 block">{book.author}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.type === 'issues' && msg.data && (
                    <div className="mt-2 space-y-1.5 pt-2 border-t border-white/10">
                      {msg.data.map((issue: any) => (
                        <div key={issue.id} className="p-1.5 rounded bg-red-950/30 border border-red-500/20 text-[9px]">
                          <div className="text-white font-medium truncate">{issue.book_title}</div>
                          <div className="text-white/60">Borrower: {issue.member_name}</div>
                          <div className="text-red-400">Due: {issue.due_date.split(' ')[0]}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <span className="text-[8px] text-white/40 block text-right mt-1">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-white rounded-2xl rounded-bl-none p-3 border border-white/15 text-xs flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span>Nova is researching...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="px-3 py-1.5 bg-blue-950/40 border-t border-white/5 flex gap-1.5 overflow-x-auto text-[9px] whitespace-nowrap scrollbar-none">
            <button onClick={() => loadSuggestion('Find books on Computer Science')} className="bg-white/5 border border-white/10 text-white/80 px-2 py-0.5 rounded-full hover:bg-white/15 transition-all">Find CS Books</button>
            <button onClick={() => loadSuggestion('Recommend a popular book')} className="bg-white/5 border border-white/10 text-white/80 px-2 py-0.5 rounded-full hover:bg-white/15 transition-all">Trending Reads</button>
            <button onClick={() => loadSuggestion('Show overdue accounts')} className="bg-white/5 border border-white/10 text-white/80 px-2 py-0.5 rounded-full hover:bg-white/15 transition-all">Overdue Status</button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-2 border-t border-white/10 bg-blue-900/40 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Nova to scan inventory, check fines..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-2 rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all flex items-center justify-center">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

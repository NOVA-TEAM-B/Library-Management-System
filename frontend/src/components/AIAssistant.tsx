import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, X, Send, Sparkles, User, HelpCircle, 
  Trash2, Download, Copy, ThumbsUp, ThumbsDown, RotateCcw, Square 
} from 'lucide-react';

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
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('nova_ai_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      {
        sender: 'bot',
        text: "Hello! I am Nova, your AI Knowledge Companion. 📚✨ Ask me anything! I can find books, calculate fines, check due dates, explain code concepts, or draft resumes.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamIntervalRef = useRef<any>(null);

  // Save conversation history to local storage
  useEffect(() => {
    localStorage.setItem('nova_ai_history', JSON.stringify(history));
  }, [history]);

  // Scroll to bottom on updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, streamingText, loading]);

  const handleStopStreaming = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
    }
    setIsStreaming(false);
    if (streamingText) {
      setHistory(prev => [...prev, {
        sender: 'bot',
        text: streamingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setStreamingText('');
    }
  };

  const handleSend = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const userMsg = customMsg ? customMsg.trim() : input.trim();
    if (!userMsg) return;

    if (!customMsg) setInput('');
    setLastPrompt(userMsg);
    
    // Halt any active streams
    if (isStreaming) {
      handleStopStreaming();
    }

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
      if (!res.ok) throw new Error(data.msg || 'AI error occurred');

      setLoading(false);
      setIsStreaming(true);
      setStreamingText('');

      // Simulate streaming output
      let idx = 0;
      const fullText = data.text;
      
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      
      streamIntervalRef.current = setInterval(() => {
        if (idx < fullText.length) {
          setStreamingText(prev => prev + fullText.charAt(idx));
          idx++;
        } else {
          if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
          setIsStreaming(false);
          setHistory(prev => [...prev, {
            sender: 'bot',
            text: fullText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: data.type,
            data: data.data
          }]);
          setStreamingText('');
        }
      }, 8);

    } catch (err: any) {
      setLoading(false);
      setHistory(prev => [...prev, {
        sender: 'bot',
        text: `I apologize, but I encountered an error node: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const handleRegenerate = () => {
    if (lastPrompt) {
      handleSend(undefined, lastPrompt);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Settle and clear all conversation history?")) {
      handleStopStreaming();
      setHistory([
        {
          sender: 'bot',
          text: "Conversation cleared. I am ready to answer any questions!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleExportChat = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nova_ai_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const parseMarkdown = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : 'code';
        const codeContent = match ? match[2] : part.slice(3, -3);
        
        return (
          <div key={idx} className="my-3.5 border border-white/10 rounded-xl overflow-hidden bg-slate-950 font-mono text-[10px] text-cyan-300 shadow-inner">
            <div className="flex justify-between items-center bg-white/5 px-3 py-2 border-b border-white/10 text-slate-400 text-[8px] font-bold uppercase tracking-widest">
              <span>{language || 'code'}</span>
              <button 
                type="button"
                onClick={() => navigator.clipboard.writeText(codeContent)}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <Copy className="w-2.5 h-2.5" /> Copy Code
              </button>
            </div>
            <pre className="p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      } else {
        const lines = part.split('\n');
        return lines.map((line, lIdx) => {
          let content = line;
          content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
          
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            return (
              <li key={lIdx} className="ml-4 list-disc my-1 text-slate-300" dangerouslySetInnerHTML={{ __html: content.replace(/^[-*]\s+/, '') }} />
            );
          }
          if (/^\d+\.\s+/.test(line.trim())) {
            return (
              <li key={lIdx} className="ml-4 list-decimal my-1 text-slate-300" dangerouslySetInnerHTML={{ __html: content.replace(/^\d+\.\s+/, '') }} />
            );
          }
          if (line.trim() === '') return <div key={lIdx} className="h-1.5" />;
          return (
            <p key={lIdx} className="m-0 min-h-[1em]" dangerouslySetInnerHTML={{ __html: content }} />
          );
        });
      }
    });
  };

  const loadSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <style>{`
        @keyframes holoFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(6, 182, 212, 0.3); box-shadow: 0 0 15px rgba(6, 182, 212, 0.15); }
          50% { border-color: rgba(139, 92, 246, 0.5); box-shadow: 0 0 25px rgba(139, 92, 246, 0.3); }
        }
        @keyframes holoScanLine {
          0% { top: 0%; opacity: 0.1; }
          50% { top: 100%; opacity: 0.6; }
          100% { top: 0%; opacity: 0.1; }
        }
      `}</style>

      {/* FLOATING SPARKLE BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-1 border border-cyan-400/40 cursor-pointer animate-bounce"
          style={{ animationDuration: '3s' }}
          title="Nova AI Workspace Companion"
        >
          <span className="absolute -inset-1 rounded-full bg-cyan-400/25 blur animate-pulse" />
          <div className="relative flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300 group-hover:rotate-12 transition-transform" />
            <span className="font-extrabold text-[10px] tracking-widest uppercase pr-1">Ask Nova AI</span>
          </div>
        </button>
      )}

      {/* CHAT PANEL */}
      {isOpen && (
        <div 
          className="glass-panel w-[400px] h-[550px] flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(6,182,212,0.15)] border bg-slate-950/95 backdrop-blur-2xl rounded-[24px] relative" 
          style={{ 
            animation: 'holoFloat 6s ease-in-out infinite, borderPulse 4s infinite'
          }}
        >
          {/* Scanning Line overlay */}
          <div className="absolute left-0 right-0 h-[1.5px] bg-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.4)] pointer-events-none z-50" style={{
            animation: 'holoScanLine 5s linear infinite'
          }} />

          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-purple-500 to-cyan-400 p-[1.5px]">
                <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h5 className="font-extrabold text-xs m-0 tracking-wider text-white uppercase leading-none">Nova AI Assistant</h5>
                <span className="text-[7.5px] text-cyan-400 font-mono tracking-widest block uppercase mt-1">Provider: LLM Core active</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handleExportChat} 
                className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer" 
                title="Export Conversation"
              >
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={handleClearChat} 
                className="text-white/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer" 
                title="Clear Chat Log"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { handleStopStreaming(); setIsOpen(false); }} 
                className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Message Feeds */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/30">
            {history.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4.5 h-4.5 text-cyan-400" />
                  </div>
                )}
                
                <div className={`max-w-[78%] rounded-2xl p-3.5 text-xs leading-relaxed relative group ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-blue-500/10' 
                    : 'bg-white/5 text-slate-200 rounded-bl-none border border-white/10 shadow-lg'
                }`}>
                  <div className="font-sans space-y-1 select-text">
                    {parseMarkdown(msg.text)}
                  </div>

                  {/* List matching books */}
                  {msg.type === 'books' && msg.data && (
                    <div className="mt-3 space-y-2 pt-3 border-t border-white/5 select-none">
                      {msg.data.map((book: any) => (
                        <div key={book.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 hover:bg-slate-900/20 transition-all duration-200">
                          <img src={book.cover_url} className="w-9 h-12 object-cover rounded-lg border border-white/10 shrink-0" alt="" />
                          <div className="overflow-hidden">
                            <strong className="text-[10px] block truncate text-cyan-300">{book.title}</strong>
                            <span className="text-[8px] text-white/50 block mt-0.5">By {book.author}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* List matching issues */}
                  {msg.type === 'issues' && msg.data && (
                    <div className="mt-3 space-y-2 pt-3 border-t border-white/5 select-none">
                      {msg.data.map((issue: any) => (
                        <div key={issue.id} className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/20 text-[9px] space-y-0.5">
                          <div className="text-white font-medium truncate">{issue.book_title}</div>
                          <div className="text-white/60">Borrower ID: {issue.member_name}</div>
                          <div className="text-red-400 font-bold">Due Date: {issue.due_date.split(' ')[0]}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message details & tools */}
                  <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-white/5 text-[8px] text-white/30 font-mono select-none">
                    <span>{msg.timestamp}</span>
                    
                    {msg.sender === 'bot' && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleCopyText(msg.text, index)} 
                          className="hover:text-white transition-colors cursor-pointer"
                          title="Copy text"
                        >
                          {copiedId === index ? "Copied" : <Copy className="w-2.5 h-2.5" />}
                        </button>
                        <button className="hover:text-emerald-400 transition-colors cursor-pointer"><ThumbsUp className="w-2.5 h-2.5" /></button>
                        <button className="hover:text-rose-400 transition-colors cursor-pointer"><ThumbsDown className="w-2.5 h-2.5" /></button>
                      </div>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                    <User className="w-4.5 h-4.5 text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Active Streaming Message */}
            {isStreaming && streamingText && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-4.5 h-4.5 text-cyan-400" />
                </div>
                <div className="max-w-[78%] rounded-2xl rounded-bl-none p-3.5 text-xs leading-relaxed bg-white/5 text-slate-200 border border-white/10 shadow-lg relative group">
                  <div className="font-sans space-y-1 select-text">
                    {parseMarkdown(streamingText)}
                  </div>
                  <span className="w-1.5 h-3 bg-cyan-400 inline-block animate-pulse ml-0.5" />
                  <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-white/5 text-[8px] text-white/30 font-mono">
                    <span>Nova is typing...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Loader Node */}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4.5 h-4.5 text-cyan-400 animate-spin" />
                </div>
                <div className="bg-white/5 text-slate-300 rounded-2xl rounded-bl-none p-3 border border-white/10 text-xs flex items-center gap-2 shadow-lg animate-pulse">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="font-mono text-[9px] text-cyan-400 font-bold uppercase tracking-wider">Nova is thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions scroll box */}
          <div className="px-3 py-2.5 bg-slate-950/45 border-t border-white/5 flex gap-1.5 overflow-x-auto text-[9px] whitespace-nowrap scrollbar-none relative z-10 select-none">
            <button onClick={() => loadSuggestion('Do I have any fines?')} className="bg-white/5 border border-white/10 text-white/80 px-2.5 py-1.5 rounded-full hover:bg-white/15 hover:text-white transition-all cursor-pointer">Fine Enquiry</button>
            <button onClick={() => loadSuggestion('Show my reservations')} className="bg-white/5 border border-white/10 text-white/80 px-2.5 py-1.5 rounded-full hover:bg-white/15 hover:text-white transition-all cursor-pointer">Hold Status</button>
            <button onClick={() => loadSuggestion('When are my books due?')} className="bg-white/5 border border-white/10 text-white/80 px-2.5 py-1.5 rounded-full hover:bg-white/15 hover:text-white transition-all cursor-pointer">Due Dates</button>
            <button onClick={() => loadSuggestion('Explain book Database Systems')} className="bg-white/5 border border-white/10 text-white/80 px-2.5 py-1.5 rounded-full hover:bg-white/15 hover:text-white transition-all cursor-pointer">Explain book</button>
            <button onClick={() => loadSuggestion('Write a quick Python Bubble Sort')} className="bg-white/5 border border-white/10 text-white/80 px-2.5 py-1.5 rounded-full hover:bg-white/15 hover:text-white transition-all cursor-pointer">Code Help</button>
            <button onClick={() => loadSuggestion('FAQ')} className="bg-white/5 border border-white/10 text-white/80 px-2.5 py-1.5 rounded-full hover:bg-white/15 hover:text-white transition-all cursor-pointer">Help & FAQ</button>
          </div>

          {/* Form Controls */}
          <div className="p-3 border-t border-white/10 bg-slate-950/60 relative z-10">
            {isStreaming && (
              <button 
                type="button" 
                onClick={handleStopStreaming}
                className="w-fit mx-auto mb-2 px-3 py-1.5 rounded-full bg-slate-900 border border-red-500/40 hover:bg-red-500/10 text-red-400 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-red-500/5"
              >
                <Square className="w-2.5 h-2.5 fill-red-500 text-transparent" /> Stop Generating
              </button>
            )}
            
            <form onSubmit={(e) => handleSend(e)} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Nova anything (e.g. explain React Hooks)..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-all font-sans"
              />
              <button 
                type="submit" 
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4.5 rounded-xl hover:from-cyan-500 hover:to-blue-600 transition-all flex items-center justify-center shadow-lg shadow-cyan-500/10 cursor-pointer"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
              {lastPrompt && !loading && !isStreaming && (
                <button 
                  type="button" 
                  onClick={handleRegenerate}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                  title="Regenerate Last Response"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Calendar, GraduationCap, Flame, Heart, BookOpen, Clock, AlertTriangle, Play, Undo2, Award } from 'lucide-react';
import PdfReaderModal from '../components/PdfReaderModal';

interface Issue {
  id: number;
  book_id: number;
  book_title: string;
  book_author: string;
  book_cover_url?: string;
  book_pdf_url?: string;
  book_category?: string;
  issue_date: string;
  due_date: string;
  return_date: string;
  status: string; // issued, returned, overdue
  fine_amount: number;
  reading_progress: number;
  current_page: number;
}

export default function ReadingHistory() {
  const [history, setHistory] = useState<Issue[]>([]);
  const [stats, setStats] = useState({ count: 0, category: 'General', streak: '0 Days' });
  const [loading, setLoading] = useState(true);

  // PDF Reader Modal States
  const [activePdfBook, setActivePdfBook] = useState<any | null>(null);
  const [pdfInitialPage, setPdfInitialPage] = useState<number>(1);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      if (!token) return;

      // Get current user details from API
      const userRes = await fetch('http://127.0.0.1:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = await userRes.json();
      if (!userRes.ok) throw new Error(userData.msg);
      
      // Get detailed issues directory for user
      const res = await fetch(`http://127.0.0.1:5000/api/members/${userData.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);

      const allIssuesList: Issue[] = data.issues || [];
      setHistory(allIssuesList);

      // Settle category calculation based on completed/active reads
      const categories: { [key: string]: number } = {};
      allIssuesList.forEach((h: Issue) => {
        const cat = h.book_category || 'General';
        categories[cat] = (categories[cat] || 0) + 1;
      });

      let favorite = 'General';
      let maxCount = 0;
      for (const [cat, count] of Object.entries(categories)) {
        if (count > maxCount) {
          maxCount = count;
          favorite = cat;
        }
      }

      const completedCount = allIssuesList.filter(i => i.status === 'returned').length;

      setStats({
        count: completedCount,
        category: favorite,
        streak: `${completedCount * 3 + (allIssuesList.filter(i => i.status === 'issued' || i.status === 'overdue').length > 0 ? 5 : 0)} Days`
      });

    } catch (err: any) {
      console.error("Failed to load reading history:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    // Listen to local progress syncs
    const handleLocalSync = () => {
      fetchHistory();
    };
    window.addEventListener('nova_sync_local', handleLocalSync);

    // Listen to WebSocket global transactions sync
    const handleGlobalSync = () => {
      fetchHistory();
    };
    window.addEventListener('nova_sync', handleGlobalSync);

    return () => {
      window.removeEventListener('nova_sync_local', handleLocalSync);
      window.removeEventListener('nova_sync', handleGlobalSync);
    };
  }, []);

  const handleReturn = async (issueId: number, bookTitle: string) => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/issues/${issueId}/return`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to return book");
      
      if (window.showToast) {
        window.showToast(`'${bookTitle}' has been successfully returned!`, "success");
      } else {
        alert("Book returned successfully");
      }
      fetchHistory();
    } catch (err: any) {
      if (window.showToast) {
        window.showToast(err.message, "error");
      } else {
        alert(err.message);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'returned':
        return (
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
            Returned
          </span>
        );
      case 'overdue':
        return (
          <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider flex items-center gap-0.5 shadow-sm shadow-rose-500/5 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> Overdue
          </span>
        );
      default:
        return (
          <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
            Borrowed
          </span>
        );
    }
  };

  const getRemainingDays = (dueDateStr: string, status: string) => {
    if (status === 'returned') return 'Completed';
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    }
    return `${diffDays} days remaining`;
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs text-white">
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 flex items-center justify-between border-white/10">
          <div>
            <span className="text-[10px] text-white/50 uppercase font-semibold">Books Completed</span>
            <h3 className="text-xl font-bold text-white mt-1 m-0">{stats.count}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400"><GraduationCap className="w-5 h-5" /></div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between border-white/10">
          <div>
            <span className="text-[10px] text-white/50 uppercase font-semibold">Favorite Category</span>
            <h3 className="text-xs font-bold text-white mt-1.5 m-0 truncate max-w-[150px]">{stats.category}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-purple-400"><Heart className="w-5 h-5" /></div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between border-white/10">
          <div>
            <span className="text-[10px] text-white/50 uppercase font-semibold">Active Streak</span>
            <h3 className="text-xl font-bold text-yellow-400 mt-1 m-0">{stats.streak}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-yellow-600/20 border border-yellow-500/20 flex items-center justify-center text-yellow-400"><Flame className="w-5 h-5 animate-pulse text-orange-400" /></div>
        </div>
      </div>

      {/* BORROWING LOGS GRID */}
      <div className="glass-panel p-5 border-white/10">
        <h4 className="text-white text-base font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" /> Borrowing History & Active Read Logs
        </h4>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-white/50 py-10">Your borrowing log directory is empty. Visit the catalog to checkout titles!</div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
              const coverUrl = item.book_cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400';
              const daysText = getRemainingDays(item.due_date, item.status);
              
              return (
                <div 
                  key={item.id} 
                  className="glass-panel p-4 border-white/5 bg-white/[0.01] hover:border-cyan-500/20 transition-all flex flex-col md:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <img 
                      src={coverUrl} 
                      className="w-11 h-16 rounded-lg object-cover bg-slate-900 border border-white/10 shrink-0" 
                      alt="Book Cover" 
                    />
                    <div className="min-w-0">
                      <h5 className="text-white font-extrabold text-xs m-0 truncate max-w-[200px] md:max-w-[320px]">{item.book_title}</h5>
                      <span className="text-[10px] text-white/50 block mt-0.5 truncate max-w-[200px]">By {item.book_author}</span>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[8.5px] text-white/40 mt-1">
                        <span>Issued: <span className="text-white/60">{(item.issue_date ?? '').split(' ')[0] || 'N/A'}</span></span>
                        <span>Due: <span className="text-white/60">{(item.due_date ?? '').split(' ')[0] || 'N/A'}</span></span>
                        {item.status === 'returned' && (
                          <span>Returned: <span className="text-emerald-400/90">{(item.return_date ?? '').split(' ')[0] || 'N/A'}</span></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reading Progress bar */}
                  <div className="w-full md:w-36 space-y-1">
                    <div className="flex justify-between text-[8px] text-white/40 font-bold uppercase">
                      <span>Reading Progress</span>
                      <span className="font-mono text-white/70">{item.reading_progress || 0}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                        style={{ width: `${item.reading_progress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Fine and remaining days status details */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-32 shrink-0 text-right gap-1 border-t border-white/5 pt-2 md:border-0 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="text-[9px] text-white/40 block font-semibold">{daysText}</span>
                      {item.fine_amount > 0 && (
                        <strong className="text-rose-400 font-mono text-[10px] block mt-0.5">₹{item.fine_amount.toFixed(2)} Fine</strong>
                      )}
                    </div>
                    <div className="mt-1 shrink-0">{getStatusBadge(item.status)}</div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 w-full md:w-auto justify-end border-t border-white/5 pt-2 md:border-0 md:pt-0 shrink-0">
                    {item.status !== 'returned' && item.book_pdf_url && (
                      <button
                        onClick={() => {
                          setPdfInitialPage(item.current_page || 1);
                          setActivePdfBook({
                            id: item.book_id,
                            title: item.book_title,
                            pdf_url: item.book_pdf_url
                          });
                        }}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-500 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-emerald-500/5 text-[10px]"
                      >
                        <Play className="w-3 h-3 text-white fill-white" /> Resume Read
                      </button>
                    )}
                    {item.status !== 'returned' && (
                      <button
                        onClick={() => handleReturn(item.id, item.book_title)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all text-[10px]"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Return Copy
                      </button>
                    )}
                    {item.status === 'returned' && item.book_pdf_url && (
                      <button
                        onClick={() => {
                          setPdfInitialPage(1);
                          setActivePdfBook({
                            id: item.book_id,
                            title: item.book_title,
                            pdf_url: item.book_pdf_url
                          });
                        }}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all text-[10px]"
                      >
                        <Play className="w-3 h-3 text-white" /> Re-read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PDF READER MODAL VIEWPORT */}
      {activePdfBook && (
        <PdfReaderModal
          bookId={activePdfBook.id}
          bookTitle={activePdfBook.title}
          pdfUrl={activePdfBook.pdf_url}
          initialPage={pdfInitialPage}
          onClose={() => {
            setActivePdfBook(null);
            fetchHistory();
          }}
        />
      )}
    </div>
  );
}

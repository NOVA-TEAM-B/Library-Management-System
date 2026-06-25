import React, { useState, useEffect } from 'react';
import { Calendar, GraduationCap, Flame, Heart, BookOpen, Clock } from 'lucide-react';

interface Issue {
  id: number;
  book_id: number;
  book_title: string;
  book_author: string;
  issue_date: string;
  due_date: string;
  return_date: string;
  status: string;
  fine_amount: number;
}

export default function ReadingHistory() {
  const [history, setHistory] = useState<Issue[]>([]);
  const [stats, setStats] = useState({ count: 0, category: 'General', streak: '5 Days' });
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      // Get current user details from API
      const userRes = await fetch('http://127.0.0.1:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = await userRes.json();
      
      // Get detailed issues directory for user
      const res = await fetch(`http://127.0.0.1:5000/api/members/${userData.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.msg);

      // Filter to returned checkouts (which represents completed reads)
      const completed = data.issues.filter((i: Issue) => i.status === 'returned');
      setHistory(completed);

      // Settle category calculation
      const categories: { [key: string]: number } = {};
      const booksRes = await fetch('http://127.0.0.1:5000/api/books');
      const booksList = await booksRes.json();

      completed.forEach((h: Issue) => {
        const book = booksList.find((b: any) => b.id === h.book_id);
        if (book) {
          categories[book.category] = (categories[book.category] || 0) + 1;
        }
      });

      let favorite = 'General';
      let maxCount = 0;
      for (const [cat, count] of Object.entries(categories)) {
        if (count > maxCount) {
          maxCount = count;
          favorite = cat;
        }
      }

      setStats({
        count: completed.length,
        category: favorite,
        streak: `${completed.length * 3 + (data.issues.filter((i: any) => i.status === 'issued').length > 0 ? 5 : 0)} Days`
      });

    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
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
            <h3 className="text-sm font-bold text-white mt-1 m-0 truncate max-w-[150px]">{stats.category}</h3>
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

      {/* TIMELINE VIEW CONTAINER */}
      <div className="glass-panel p-5 border-white/10">
        <h4 className="text-white text-base font-semibold mb-4"><i className="fas fa-clock text-warning me-2"></i>Reading Timeline Logs</h4>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-white/50 py-10">Your reading timeline is empty. Return issued books to build streaks!</div>
        ) : (
          <div className="relative pl-6 border-l border-white/10 space-y-6">
            {history.map(item => {
              const issueD = new Date(item.issue_date);
              const returnD = new Date(item.return_date);
              const days = Math.max(1, Math.ceil(Math.abs(returnD.getTime() - issueD.getTime()) / (1000 * 60 * 60 * 24)));
              
              return (
                <div key={item.id} className="relative">
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-900 shadow-[0_0_8px_#22d3ee]"></div>
                  
                  <div className="glass-panel p-4 border-white/10 bg-white/[0.02] flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/10 flex items-center justify-center text-blue-400">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h6 className="text-white text-xs font-bold m-0">{item.book_title}</h6>
                        <span className="text-[9px] text-white/50 d-block mt-0.5">Author: {item.book_author}</span>
                        <div className="flex gap-3 text-[8px] text-white/40 mt-1">
                          <span>Issued: {item.issue_date.split(' ')[0]}</span>
                          <span>Returned: {item.return_date.split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-cyan-300 font-semibold text-xs bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{days} Days Reading Time</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

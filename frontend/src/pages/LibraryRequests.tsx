import React, { useState, useEffect } from 'react';
import { Calendar, Search, Check, X, ShieldAlert, Sparkles, User, BookOpen } from 'lucide-react';

interface Reservation {
  id: number;
  book_id: number;
  book_title: string;
  book_isbn: string;
  member_id: number;
  member_name: string;
  member_dept: string;
  reservation_date: string;
  status: string;
}

export default function LibraryRequests() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/books/reservations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to load reservations');
      setReservations(data);
    } catch (err: any) {
      console.error(err.message);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleApprove = async (id: number) => {
    setMsg('');
    setErrorMsg('');
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/books/reservations/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Approval failed');
      
      setMsg('Hold request approved. Book checkout created successfully!');
      fetchReservations();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm("Are you sure you want to reject and cancel this hold request?")) return;
    setMsg('');
    setErrorMsg('');
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/books/reservations/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Cancellation failed');

      setMsg('Hold request cancelled successfully.');
      fetchReservations();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const filtered = reservations.filter(r => {
    const matchesSearch = 
      r.book_title.toLowerCase().includes(search.toLowerCase()) ||
      r.member_name.toLowerCase().includes(search.toLowerCase()) ||
      r.book_isbn.includes(search);
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && r.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in text-xs text-white">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5.5 h-5.5 text-purple-400 animate-pulse" /> Library Hold Requests
        </h2>
        <p className="text-xs text-white/50 font-medium">Review and process book checkout reservations submitted by student members.</p>
      </div>

      {msg && <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">{msg}</div>}
      {errorMsg && <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">{errorMsg}</div>}

      {/* FILTER PANEL */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
        <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-xl w-full max-w-sm">
          <Search className="w-4 h-4 text-white/40 my-auto ml-2" />
          <input
            type="text"
            placeholder="Search by student, book, or ISBN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-xs text-white px-2 focus:ring-0"
          />
        </div>
        
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[9px] transition-all cursor-pointer ${
                statusFilter === status 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="w-6 h-6 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center text-white/40">No hold requests match selected filters.</div>
      ) : (
        <div className="glass-panel overflow-hidden border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-white/60 font-semibold">
                  <th className="p-4">Request ID</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Book Requested</th>
                  <th className="p-4 text-center">Request Time</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(res => (
                  <tr key={res.id} className="hover:bg-white/[0.01] transition-all">
                    <td className="p-4 font-mono font-bold text-white/80">#{res.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="text-white block font-bold">{res.member_name}</strong>
                          <span className="text-[9px] text-white/40 block mt-0.5">{res.member_dept}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="text-white block font-bold">{res.book_title}</strong>
                          <span className="text-[9px] text-white/40 block mt-0.5">ISBN: {res.book_isbn}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center text-white/60 font-mono text-[10px]">{res.reservation_date}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[8px] tracking-wider border ${
                        res.status === 'pending'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                          : res.status === 'approved'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {res.status === 'pending' ? (
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleApprove(res.id)}
                            title="Approve Hold and Checkout Book"
                            className="w-7 h-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-blue-950 flex items-center justify-center transition-all cursor-pointer border border-emerald-500/30"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(res.id)}
                            title="Reject Hold Request"
                            className="w-7 h-7 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-blue-950 flex items-center justify-center transition-all cursor-pointer border border-rose-500/30"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-white/30 font-semibold font-mono">ARCHIVED</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

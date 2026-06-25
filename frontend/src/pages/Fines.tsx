import React, { useState, useEffect } from 'react';
import { DollarSign, ClipboardList, CheckCircle, Clock, AlertTriangle, CreditCard, QrCode } from 'lucide-react';

interface Fine {
  id: number;
  issue_id: number;
  book_title: string;
  member_id: number;
  member_name: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function Fines() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [stats, setStats] = useState({ total: 0, collected: 0, pending: 0, overdue_count: 0 });
  const [loading, setLoading] = useState(true);
  
  // Payment modal state
  const [activePayment, setActivePayment] = useState<Fine | null>(null);
  const [payMethod, setPayMethod] = useState<'card' | 'upi'>('card');
  const [paying, setPaying] = useState(false);

  const fetchFines = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/issues/fines', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);

      setFines(data.fines);
      setStats(data.stats);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const handlePayment = async () => {
    if (!activePayment) return;
    setPaying(true);
    
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/issues/fines/${activePayment.id}/pay`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);
      
      alert(`Payment of ₹${activePayment.amount.toFixed(2)} successful! Account cleared.`);
      setActivePayment(null);
      fetchFines();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 flex items-center justify-between border-white/10">
          <div>
            <span className="text-[10px] text-white/50 uppercase font-semibold">Total Fines Logged</span>
            <h3 className="text-xl font-bold text-white mt-1 m-0">₹{stats.total.toLocaleString()}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400"><ClipboardList className="w-5 h-5" /></div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between border-white/10">
          <div>
            <span className="text-[10px] text-white/50 uppercase font-semibold">Collected</span>
            <h3 className="text-xl font-bold text-emerald-400 mt-1 m-0">₹{stats.collected.toLocaleString()}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-600/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><CheckCircle className="w-5 h-5" /></div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between border-white/10">
          <div>
            <span className="text-[10px] text-white/50 uppercase font-semibold">Pending Collection</span>
            <h3 className="text-xl font-bold text-yellow-400 mt-1 m-0">₹{stats.pending.toLocaleString()}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-yellow-600/20 border border-yellow-500/20 flex items-center justify-center text-yellow-400"><Clock className="w-5 h-5" /></div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between border-white/10">
          <div>
            <span className="text-[10px] text-white/50 uppercase font-semibold">Overdue Loans</span>
            <h3 className="text-xl font-bold text-red-400 mt-1 m-0">{stats.overdue_count}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-600/20 border border-red-500/20 flex items-center justify-center text-red-400"><AlertTriangle className="w-5 h-5" /></div>
        </div>
      </div>

      {/* FINES TABLE LEDGER */}
      <div className="glass-panel p-5 border-white/10">
        <h4 className="text-white text-base font-semibold mb-4"><i className="fas fa-receipt text-warning me-2"></i>Accounts Receivable Ledger</h4>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Tx ID</th>
                  <th className="pb-3 font-semibold">Member Name</th>
                  <th className="pb-3 font-semibold">Book Title</th>
                  <th className="pb-3 font-semibold">Logged Date</th>
                  <th className="pb-3 font-semibold">Fine Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {fines.length === 0 ? (
                  <tr><td colSpan={7} className="py-6 text-center text-white/50">No fine transactions recorded in accounts.</td></tr>
                ) : (
                  fines.map(f => (
                    <tr key={f.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5"><strong className="text-yellow-400">#TX-{1000 + f.id}</strong></td>
                      <td className="py-3.5 text-white">{f.member_name}</td>
                      <td className="py-3.5 text-white/80 max-w-[180px] truncate">{f.book_title || 'N/A'}</td>
                      <td className="py-3.5 text-white/60">{f.created_at ? f.created_at.split(' ')[0] : '-'}</td>
                      <td className="py-3.5 font-bold text-white">₹{f.amount.toFixed(2)}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${f.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3.5">
                        {f.status === 'pending' ? (
                          <button
                            onClick={() => setActivePayment(f)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-bold px-3 py-1 rounded-lg text-[10px] shadow"
                          >
                            Pay Fine
                          </button>
                        ) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPI/CARD CHECKOUT MOCK MODAL */}
      {activePayment && (
        <div className="fixed inset-0 bg-black/70 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm border-white/20 p-6 relative bg-gradient-to-br from-blue-900 to-slate-900 rounded-[24px]">
            {paying && (
              <div className="absolute inset-0 bg-blue-950/80 backdrop-filter backdrop-blur-sm z-50 flex flex-col justify-center items-center rounded-[24px]">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="mt-4 text-white text-xs font-semibold">Authorizing Transaction...</span>
              </div>
            )}

            <button
              onClick={() => setActivePayment(null)}
              className="absolute top-4 right-4 text-white/60 hover:text-white text-xl"
            >
              &times;
            </button>

            <div className="text-center mb-6">
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Billing Settle</span>
              <h3 className="text-xl font-bold text-white mt-1">Settle Fine Account</h3>
              <div className="mt-2 text-2xl font-extrabold text-cyan-400">₹{activePayment.amount.toFixed(2)}</div>
            </div>

            {/* TAB SELECT */}
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-4 text-xs text-white/70">
              <button
                onClick={() => setPayMethod('card')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${payMethod === 'card' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5'}`}
              >
                Credit Card
              </button>
              <button
                onClick={() => setPayMethod('upi')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${payMethod === 'upi' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5'}`}
              >
                UPI QR Code
              </button>
            </div>

            {payMethod === 'card' ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Card Holder Name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="16-Digit Card Number"
                  maxLength={16}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                />
                <div className="row g-2">
                  <div className="col-6">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                    />
                  </div>
                  <div className="col-6">
                    <input
                      type="password"
                      placeholder="CVV"
                      maxLength={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-28 h-28 bg-white p-2.5 rounded-xl mx-auto flex items-center justify-center border border-white/20">
                  <QrCode className="w-full h-full text-blue-950" />
                </div>
                <span className="text-[10px] text-white/50 block">Scan UPI QR to process mock checkout</span>
              </div>
            )}

            <button
              onClick={handlePayment}
              className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-lg border border-white/10 text-xs transition-all"
            >
              Verify Payment Settle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

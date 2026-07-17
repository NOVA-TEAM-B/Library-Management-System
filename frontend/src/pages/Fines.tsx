import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Clock, AlertTriangle, CreditCard, QrCode, FileText } from 'lucide-react';

interface Fine {
  id: number;
  issue_id: number;
  book_title: string;
  member_id: number;
  member_name: string;
  amount: number;
  status: string;
  created_at: string;
  payment_date?: string;
  transaction_reference?: string;
  approver_name?: string;
}

export default function Fines() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [stats, setStats] = useState({ total: 0, collected: 0, pending: 0, overdue_count: 0 });
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [activePayment, setActivePayment] = useState<Fine | null>(null);
  const [approveTarget, setApproveTarget] = useState<Fine | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Fine | null>(null);
  
  const [payMethod, setPayMethod] = useState<'card' | 'upi'>('card');
  const [paying, setPaying] = useState(false);
  const [txReference, setTxReference] = useState('');

  const userStr = localStorage.getItem('nova_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isStaff = user?.role === 'admin' || user?.role === 'librarian';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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

  // Student checkout flow: only logs local alert, status remains pending
  const handleInitiatePayment = () => {
    if (!activePayment) return;
    
    if (payMethod === 'upi') {
      alert("Payment Initiated! Please complete the transaction in PhonePe or your UPI app. The fine status will remain 'pending' until verified and approved by the librarian.");
    } else {
      alert("Mock Card Payment Initiated! Card transactions must be verified by the library desk. The status will update once approved.");
    }
    
    setActivePayment(null);
    fetchFines();
  };

  // Staff manual verification approval flow: updates status to paid
  const handleApprovePayment = async () => {
    if (!approveTarget) return;
    setPaying(true);
    
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/issues/fines/${approveTarget.id}/pay`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ transaction_reference: txReference })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);
      
      alert(`Fine of ₹${approveTarget.amount.toFixed(2)} approved & cleared successfully!`);
      setApproveTarget(null);
      setTxReference('');
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
      <div className="glass-panel p-5 border-white/10 animate-fade-in">
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
                  <th className="pb-3 font-semibold text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {fines.length === 0 ? (
                  <tr><td colSpan={7} className="py-6 text-center text-white/50">No fine transactions recorded in accounts.</td></tr>
                ) : (
                  fines.map(f => (
                    <tr key={f.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5"><strong className="text-yellow-400">#TX-{1000 + f.id}</strong></td>
                      <td className="py-3.5 text-white font-medium">{f.member_name}</td>
                      <td className="py-3.5 text-white/80 max-w-[180px] truncate">{f.book_title || 'N/A'}</td>
                      <td className="py-3.5 text-white/60">{f.created_at ? f.created_at.split(' ')[0] : '-'}</td>
                      <td className="py-3.5 font-bold text-white">₹{f.amount.toFixed(2)}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${f.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        {f.status === 'pending' ? (
                          isStaff ? (
                            <button
                              onClick={() => setApproveTarget(f)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg text-[10px] shadow"
                            >
                              Approve Payment
                            </button>
                          ) : (
                            <button
                              onClick={() => setActivePayment(f)}
                              className="bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-bold px-3 py-1 rounded-lg text-[10px] shadow"
                            >
                              Pay Fine
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => setSelectedReceipt(f)}
                            className="bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 font-bold px-3 py-1 rounded-lg text-[10px] shadow flex items-center gap-1 mx-auto"
                          >
                            <FileText className="w-3 h-3" /> Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STUDENT CHECKOUT MODAL */}
      {activePayment && (
        <div className="fixed inset-0 bg-black/70 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm border-white/20 p-6 relative bg-gradient-to-br from-blue-900 to-slate-900 rounded-[24px]">
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
                UPI / PhonePe
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
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    maxLength={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-2 space-y-4 animate-fade-in">
                {isMobile ? (
                  <div className="py-4">
                    <a
                      href={`upi://pay?pa=8919733305@ybl&pn=RAJAPUTRA%20SHASHANK%20SINGH&am=${activePayment.amount.toFixed(2)}&cu=INR&tn=Library%20Fine%20Payment`}
                      className="inline-flex items-center justify-center gap-2 bg-[#5f259f] hover:bg-[#4b1c7f] text-white font-bold py-3 px-6 rounded-2xl shadow-lg text-xs transition-all w-full"
                    >
                      <i className="fas fa-mobile-alt text-base"></i> Pay via PhonePe / UPI App
                    </a>
                    <span className="text-[9px] text-white/40 block mt-2">Clicking opens PhonePe or any installed UPI application.</span>
                  </div>
                ) : (
                  <>
                    <div className="w-40 h-40 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center border border-white/20 shadow-xl relative overflow-hidden">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                          `upi://pay?pa=8919733305@ybl&pn=RAJAPUTRA%20SHASHANK%20SINGH&am=${activePayment.amount.toFixed(2)}&cu=INR&tn=Library%20Fine%20Payment`
                        )}`}
                        alt="UPI QR Code" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider block">Scan with PhonePe / any UPI App</span>
                      <span className="text-[9px] text-white/50 block">Payee: RAJAPUTRA SHASHANK SINGH</span>
                      <span className="text-[9px] text-white/40 block font-mono">UPI ID: 8919733305@ybl</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={handleInitiatePayment}
              className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-lg border border-white/10 text-xs transition-all"
            >
              {payMethod === 'upi' ? "Initiate UPI Payment" : "Initiate Card Settle"}
            </button>
          </div>
        </div>
      )}

      {/* STAFF MANUAL APPROVAL MODAL */}
      {approveTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm border-white/20 p-6 relative bg-gradient-to-br from-[#0c1328] to-[#12213e] rounded-[24px]">
            {paying && (
              <div className="absolute inset-0 bg-blue-950/80 backdrop-filter backdrop-blur-sm z-50 flex flex-col justify-center items-center rounded-[24px]">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="mt-4 text-white text-xs font-semibold">Recording Verification...</span>
              </div>
            )}

            <button
              onClick={() => { setApproveTarget(null); setTxReference(''); }}
              className="absolute top-4 right-4 text-white/60 hover:text-white text-xl"
            >
              &times;
            </button>

            <div className="text-center mb-6">
              <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider block">Staff Verification Desk</span>
              <h3 className="text-xl font-bold text-white mt-1">Approve Payment</h3>
              <p className="text-white/60 text-xs mt-2 px-2 leading-relaxed">
                Confirm receipt of direct UPI payment for <strong>{approveTarget.member_name}</strong>.
              </p>
              <div className="mt-3 text-2xl font-extrabold text-emerald-400">₹{approveTarget.amount.toFixed(2)}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-[10px] uppercase font-bold block mb-1">Transaction Reference / UTR</label>
                <input
                  type="text"
                  placeholder="Enter UPI Ref No. or Card Tx ID"
                  value={txReference}
                  onChange={(e) => setTxReference(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                />
              </div>

              <button
                onClick={handleApprovePayment}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-lg border border-white/10 text-xs transition-all"
              >
                Approve & Settle Fine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/80 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md border-white/20 p-8 relative bg-white text-slate-900 rounded-[24px] shadow-2xl printable-receipt">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-950 text-2xl no-print"
            >
              &times;
            </button>

            {/* Receipt Header */}
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-6">
              <div className="w-12 h-12 bg-slate-900 text-white p-2 rounded-xl mx-auto flex items-center justify-center font-bold text-lg mb-2">
                NL
              </div>
              <h2 className="text-lg font-black tracking-wide font-sans m-0 uppercase text-slate-900">NOVA LIBRARY</h2>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mt-1">Smart Library Management System</span>
              <span className="text-[11px] font-mono text-slate-400 block mt-2">TRANSACTION RECEIPT</span>
            </div>

            {/* Receipt Body */}
            <div className="space-y-4 text-xs font-sans">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Receipt Number:</span>
                <span className="font-mono font-bold text-slate-800">#REC-{1000 + selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Issued Date:</span>
                <span className="text-slate-800">{selectedReceipt.created_at ? selectedReceipt.created_at.split(' ')[0] : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Settled Date:</span>
                <span className="text-slate-800 font-medium">{selectedReceipt.payment_date ? selectedReceipt.payment_date.split(' ')[0] : '-'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <span className="text-slate-500 font-semibold">Member Name:</span>
                <span className="text-slate-800 font-bold">{selectedReceipt.member_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Book Title:</span>
                <span className="text-slate-800 max-w-[200px] text-right truncate">{selectedReceipt.book_title || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <span className="text-slate-500 font-semibold">Transaction Reference:</span>
                <span className="text-slate-800 font-mono font-medium">{selectedReceipt.transaction_reference || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Approved By:</span>
                <span className="text-slate-800 font-semibold">{selectedReceipt.approver_name || 'Library Desk'}</span>
              </div>

              {/* Total Block */}
              <div className="flex justify-between border-t-2 border-dashed border-slate-300 pt-4 mt-6 text-sm font-bold bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-700">Amount Settled:</span>
                <span className="text-emerald-600 font-extrabold text-base">₹{selectedReceipt.amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="text-center text-[10px] text-slate-400 mt-6 pt-4 border-t border-slate-100 leading-normal">
              Thank you for clearing your academic account.<br/>
              Nova Library Smart Services.
            </div>

            {/* Print Action */}
            <div className="mt-6 flex gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-850 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-2 rounded-xl text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, CheckCircle, Search, FileText, ArrowRight, ArrowLeft, 
  QrCode, Printer, ShieldAlert, BadgeInfo, Scale, Calendar, 
  RefreshCw, Check, BookOpen, UserCheck, Mail, Download, History, HelpCircle
} from 'lucide-react';

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  quantity: number;
  category: string;
  floor?: string;
  rack_number?: string;
  shelf_number?: string;
  accession_number?: string;
  damaged_copies?: number;
}

interface Member {
  id: number;
  username: string;
  membership_id: string;
  department: string;
  email?: string;
  phone?: string;
}

export default function IssueReturn() {
  const [step, setStep] = useState(1); // 1: Scan Member, 2: Verify Member, 3: Search Book, 4: Select Copy, 5: Issue, 6: Receipt
  
  // Selections
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [dueDays, setDueDays] = useState(14);
  
  // Lists
  const [members, setMembers] = useState<Member[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [allIssues, setAllIssues] = useState<any[]>([]);
  const [allFines, setAllFines] = useState<any[]>([]);
  
  // State loaders
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerLaserY, setScannerLaserY] = useState(0);

  // Lookup fields
  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');

  // Receipt reference
  const [receiptData, setReceiptData] = useState<any>(null);

  // Scanner laser animation helper
  useEffect(() => {
    let interval: any;
    if (scannerActive) {
      interval = setInterval(() => {
        setScannerLaserY(prev => (prev >= 100 ? 0 : prev + 2));
      }, 30);
    } else {
      setScannerLaserY(0);
    }
    return () => clearInterval(interval);
  }, [scannerActive]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const authHeaders: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Load Members
      const mRes = await fetch('http://127.0.0.1:5000/api/members', {
        headers: authHeaders
      });
      if (mRes.ok) {
        const mData = await mRes.json();
        setMembers(Array.isArray(mData.members) ? mData.members : (Array.isArray(mData) ? mData : []));
      } else {
        setMembers([]);
      }

      // Load Books
      const bRes = await fetch('http://127.0.0.1:5000/api/books', {
        headers: authHeaders
      });
      if (bRes.ok) {
        const bData = await bRes.json();
        setBooks(Array.isArray(bData) ? bData : (Array.isArray(bData.books) ? bData.books : []));
      } else {
        setBooks([]);
      }

      // Load Fines and Issues for Verification Check
      const iRes = await fetch('http://127.0.0.1:5000/api/issues', {
        headers: authHeaders
      });
      if (iRes.ok) {
        const iData = await iRes.json();
        setAllIssues(Array.isArray(iData) ? iData : (Array.isArray(iData.issues) ? iData.issues : []));
      } else {
        setAllIssues([]);
      }

      const fRes = await fetch('http://127.0.0.1:5000/api/issues/fines', {
        headers: authHeaders
      });
      if (fRes.ok) {
        const fData = await fRes.json();
        setAllFines(Array.isArray(fData.fines) ? fData.fines : (Array.isArray(fData) ? fData : []));
      } else {
        setAllFines([]);
      }
    } catch (err: any) {
      console.error("Lending desk loader failed: ", err.message);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = () => {
      loadData();
    };
    window.addEventListener('nova_sync', handleSync);
    window.addEventListener('nova_sync_local', handleSync);
    return () => {
      window.removeEventListener('nova_sync', handleSync);
      window.removeEventListener('nova_sync_local', handleSync);
    };
  }, []);

  // Keyboard Shortcuts (Ctrl+Enter to advance, Esc to reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetStepper();
      }
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        // Advance steps if validation is met
        if (step === 1 && selectedMember) setStep(2);
        else if (step === 2 && selectedMember) setStep(3);
        else if (step === 3 && selectedBook) setStep(4);
        else if (step === 4 && selectedBook) setStep(5);
        else if (step === 5) handleIssueSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, selectedMember, selectedBook]);

  // Member statistics calculations
  const getMemberStats = (memberId: number) => {
    const safeIssues = Array.isArray(allIssues) ? allIssues : [];
    const safeFines = Array.isArray(allFines) ? allFines : [];

    const memberIssues = safeIssues.filter(i => i && i.member_id === memberId);
    const activeCheckouts = memberIssues.filter(i => i && (i.status === 'issued' || i.status === 'overdue'));
    const overdueCheckouts = memberIssues.filter(i => i && i.status === 'overdue');
    
    const memberFines = safeFines.filter(f => f && f.member_id === memberId && f.status === 'pending');
    const unpaidFineTotal = memberFines.reduce((sum, f) => sum + (f.amount || 0), 0);

    return {
      activeCount: activeCheckouts.length,
      overdueCount: overdueCheckouts.length,
      unpaidFineTotal,
      isRestricted: overdueCheckouts.length > 0 || unpaidFineTotal > 150
    };
  };

  const memberStats = selectedMember ? getMemberStats(selectedMember.id) : { activeCount: 0, overdueCount: 0, unpaidFineTotal: 0, isRestricted: false };

  // Return & Renew Book Handlers
  const handleReturnBook = async (issueId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/issues/${issueId}/return`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to return book');
      if (window.showToast) window.showToast('Book returned successfully!', 'success');
      window.dispatchEvent(new CustomEvent('nova_sync_local'));
      await loadData();
    } catch (err: any) {
      if (window.showToast) window.showToast(err.message, 'error');
      else alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewBook = async (issueId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/issues/${issueId}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ due_days: 14 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to renew book');
      if (window.showToast) window.showToast('Book loan renewed for 14 days!', 'success');
      window.dispatchEvent(new CustomEvent('nova_sync_local'));
      await loadData();
    } catch (err: any) {
      if (window.showToast) window.showToast(err.message, 'error');
      else alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Simulated Scanner triggers
  const triggerMemberScanner = () => {
    const safeMembers = Array.isArray(members) ? members : [];
    if (safeMembers.length === 0) return;
    setScannerActive(true);
    setTimeout(() => {
      setScannerActive(false);
      const randMem = safeMembers[Math.floor(Math.random() * safeMembers.length)];
      setSelectedMember(randMem);
      setStep(2);
      if (window.showToast) window.showToast(`Scanned Member: ${randMem.username}`, "success");
    }, 1500);
  };

  const triggerBookScanner = () => {
    const safeBooks = Array.isArray(books) ? books : [];
    const availableBooks = safeBooks.filter(b => b.quantity > 0);
    if (availableBooks.length === 0) return;
    setScannerActive(true);
    setTimeout(() => {
      setScannerActive(false);
      const randBook = availableBooks[Math.floor(Math.random() * availableBooks.length)];
      setSelectedBook(randBook);
      setStep(4);
      if (window.showToast) window.showToast(`Scanned Book: ${randBook.title}`, "success");
    }, 1500);
  };

  const handleIssueSubmit = async () => {
    if (!selectedBook || !selectedMember) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          book_id: selectedBook.id,
          member_id: selectedMember.id,
          due_days: dueDays
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);

      setReceiptData(data.issue);
      setStep(6);
      window.dispatchEvent(new CustomEvent('nova_sync_local'));
      if (window.showToast) window.showToast("Book checked out successfully! Receipt ready.", "success");
    } catch (err: any) {
      if (window.showToast) window.showToast(err.message, "error");
      else alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetStepper = () => {
    setSelectedMember(null);
    setSelectedBook(null);
    setReceiptData(null);
    setMemberSearch('');
    setBookSearch('');
    setDueDays(14);
    setStep(1);
    loadData();
  };

  // Simulated triggers on receipt
  const simulateEmailReceipt = () => {
    if (window.showToast) {
      window.showToast(`Receipt emailed to ${selectedMember?.email || 'member@nova.edu'} successfully.`, "success");
    }
  };

  const simulateDownloadPDF = () => {
    if (window.showToast) {
      window.showToast("Lending Invoice downloaded as PDF.", "info");
    }
  };

  const triggerReceiptPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5.5 h-5.5 text-cyan-400 animate-pulse" /> Lending Circulation Desk
          </h2>
          <p className="text-xs text-white/50">Issue physical assets, calculate limits, and print audit invoices.</p>
        </div>
        <button 
          onClick={resetStepper}
          className="px-3.5 py-1.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Stepper
        </button>
      </div>

      {/* STEPPER STATUS INDICATOR */}
      <div className="glass-panel p-4 flex justify-between items-center border-white/10 max-w-4xl mx-auto overflow-x-auto text-[10px] font-semibold gap-2">
        <button onClick={() => step > 1 && setStep(1)} className={`flex items-center gap-1 shrink-0 ${step === 1 ? 'text-cyan-400 font-bold' : step > 1 ? 'text-emerald-400' : 'text-white/30'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${step > 1 ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-white/5 border-white/10'}`}>{step > 1 ? <Check className="w-3 h-3" /> : '1'}</span>
          <span>Scan Member</span>
        </button>
        <ArrowRight className="w-3.5 h-3.5 text-white/10 shrink-0" />
        <button onClick={() => step > 2 && setStep(2)} className={`flex items-center gap-1 shrink-0 ${step === 2 ? 'text-cyan-400 font-bold' : step > 2 ? 'text-emerald-400' : 'text-white/30'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${step > 2 ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-white/5 border-white/10'}`}>{step > 2 ? <Check className="w-3 h-3" /> : '2'}</span>
          <span>Verify Member</span>
        </button>
        <ArrowRight className="w-3.5 h-3.5 text-white/10 shrink-0" />
        <button onClick={() => step > 3 && setStep(3)} className={`flex items-center gap-1 shrink-0 ${step === 3 ? 'text-cyan-400 font-bold' : step > 3 ? 'text-emerald-400' : 'text-white/30'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${step > 3 ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-white/5 border-white/10'}`}>{step > 3 ? <Check className="w-3 h-3" /> : '3'}</span>
          <span>Search Book</span>
        </button>
        <ArrowRight className="w-3.5 h-3.5 text-white/10 shrink-0" />
        <button onClick={() => step > 4 && setStep(4)} className={`flex items-center gap-1 shrink-0 ${step === 4 ? 'text-cyan-400 font-bold' : step > 4 ? 'text-emerald-400' : 'text-white/30'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${step > 4 ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-white/5 border-white/10'}`}>{step > 4 ? <Check className="w-3 h-3" /> : '4'}</span>
          <span>Select Copy</span>
        </button>
        <ArrowRight className="w-3.5 h-3.5 text-white/10 shrink-0" />
        <button onClick={() => step > 5 && setStep(5)} className={`flex items-center gap-1 shrink-0 ${step === 5 ? 'text-cyan-400 font-bold' : step > 5 ? 'text-emerald-400' : 'text-white/30'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${step > 5 ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-white/5 border-white/10'}`}>{step > 5 ? <Check className="w-3 h-3" /> : '5'}</span>
          <span>Issue</span>
        </button>
        <ArrowRight className="w-3.5 h-3.5 text-white/10 shrink-0" />
        <div className={`flex items-center gap-1 shrink-0 ${step === 6 ? 'text-cyan-400 font-bold' : 'text-white/30'}`}>
          <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">6</span>
          <span>Receipt</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch max-w-6xl mx-auto">
        
        {/* MAIN STEP WIZARD MODULE */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* STEP 1: SCAN MEMBER */}
          {step === 1 && (
            <div className="glass-panel p-6 border-white/10 text-center space-y-6 animate-fade-in bg-slate-900/20">
              <div>
                <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wide">Lending Step 1: Scan Member Registration Token</h4>
                <p className="text-[10px] text-white/40">Present student membership card to the barcode/QR reader node.</p>
              </div>
              
              <div className="max-w-md mx-auto p-5 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] space-y-4 relative overflow-hidden h-44 flex flex-col justify-center items-center">
                {scannerActive ? (
                  <>
                    <div className="absolute inset-x-0 h-0.5 bg-cyan-400/80 shadow-lg shadow-cyan-400/50 transition-all duration-75" style={{ top: `${scannerLaserY}%` }}></div>
                    <QrCode className="w-16 h-16 text-cyan-400 animate-pulse" />
                    <span className="text-[9px] text-cyan-400 font-bold tracking-widest uppercase animate-pulse mt-2">Active Laser Feed...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-16 h-16 text-white/25" />
                    <button
                      onClick={triggerMemberScanner}
                      disabled={dataLoading}
                      className="bg-cyan-500 hover:bg-cyan-600 text-blue-950 font-bold px-5 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10 cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" /> Trigger Barcode Scanner
                    </button>
                  </>
                )}
              </div>

              {/* Manual Lookup Auto-suggest */}
              <div className="relative max-w-sm mx-auto space-y-2">
                <span className="text-white/30 text-[9px] uppercase font-bold block">Or Lookup Registration Database</span>
                <div className="relative">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by student name or membership ID..."
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 font-sans"
                  />
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40"><Search className="w-3.5 h-3.5" /></span>
                </div>

                {dataLoading ? (
                  <div className="py-2 flex justify-center"><RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" /></div>
                ) : memberSearch.trim() && (
                  <div className="absolute w-full mt-1.5 bg-[#0e1220] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20 max-h-40 overflow-y-auto text-left text-xs">
                    {members
                      .filter(m => m && ((m.username ?? '').toLowerCase().includes(memberSearch.toLowerCase()) || (m.membership_id ?? '').toLowerCase().includes(memberSearch.toLowerCase())))
                      .map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => { setSelectedMember(m); setStep(2); setMemberSearch(''); }}
                          className="w-full p-2.5 hover:bg-white/5 cursor-pointer text-white border-b border-white/5 text-left flex justify-between items-center"
                        >
                          <div>
                            <strong className="text-white font-bold">{m.username || 'Unknown'}</strong>
                            <span className="text-white/40 block text-[9px] mt-0.5">ID: {m.membership_id || 'N/A'}</span>
                          </div>
                          <span className="text-[9px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{m.department || 'N/A'}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: VERIFY MEMBER */}
          {step === 2 && selectedMember && (
            <div className="glass-panel p-6 border-white/10 space-y-6 animate-fade-in bg-slate-900/20">
              <div>
                <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wide">Lending Step 2: Member Account Verification</h4>
                <p className="text-[10px] text-white/40 font-medium">Verify outstanding fines, checkout limits, and active overdue holds.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Details card */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-3.5 text-[10px]">
                  <span className="text-[9px] text-white/30 uppercase font-extrabold block border-b border-white/5 pb-1 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Member File</span>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Name:</span><strong className="text-white font-bold">{selectedMember.username || 'Unknown'}</strong></div>
                    <div className="flex justify-between"><span>Registry ID:</span><strong className="text-white font-mono">{selectedMember.membership_id || 'N/A'}</strong></div>
                    <div className="flex justify-between"><span>Department:</span><strong className="text-white font-semibold">{selectedMember.department || 'N/A'}</strong></div>
                    <div className="flex justify-between"><span>Email:</span><span className="text-cyan-300 font-mono text-[9px]">{selectedMember.email || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Loans limit widget */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-white/30 uppercase font-extrabold block border-b border-white/5 pb-1">Checkout Limits</span>
                    <div className="flex justify-between text-[10px] pt-1">
                      <span>Active loans:</span>
                      <strong className={memberStats.activeCount >= 5 ? 'text-rose-400' : 'text-white'}>{memberStats.activeCount} / 5 books</strong>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${memberStats.activeCount >= 5 ? 'bg-rose-500' : 'bg-cyan-400'}`} style={{ width: `${Math.min(100, (memberStats.activeCount / 5) * 100)}%` }} />
                    </div>
                    {memberStats.activeCount >= 5 && (
                      <span className="text-[8px] text-rose-400 font-semibold block mt-1"><ShieldAlert className="w-3 h-3 inline mr-0.5" /> Max borrow quota hit</span>
                    )}
                  </div>
                </div>

                {/* Overdue/Fines widget */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-white/30 uppercase font-extrabold block border-b border-white/5 pb-1">Security Block Indicators</span>
                    <div className="flex justify-between text-[10px] pt-1">
                      <span>Overdue Issues:</span>
                      <strong className={memberStats.overdueCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{memberStats.overdueCount} Items</strong>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Accrued Fine:</span>
                      <strong className={memberStats.unpaidFineTotal > 150 ? 'text-rose-400 font-bold' : memberStats.unpaidFineTotal > 0 ? 'text-amber-400' : 'text-emerald-400'}>₹{memberStats.unpaidFineTotal.toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    {memberStats.isRestricted ? (
                      <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-bold uppercase flex items-center justify-center gap-0.5">
                        <ShieldAlert className="w-3 h-3 shrink-0" /> Card Restricted
                      </span>
                    ) : (
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase flex items-center justify-center gap-0.5">
                        <Check className="w-3 h-3 shrink-0" /> Account Cleared
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Restriction Warning details */}
              {memberStats.isRestricted && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] leading-relaxed flex items-start gap-3">
                  <ShieldAlert className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-rose-200 block mb-0.5 font-bold uppercase tracking-wide">Account Locked due to compliance violation</strong>
                    Outstanding overdue checkouts or unpaid fine balance (exceeding limit ₹150) must be settled before checkout can proceed. Clearance override requires Supervisor authorization.
                  </div>
                </div>
              )}

              {/* Active loans list for returning / renewing */}
              {(() => {
                const activeLoans = (Array.isArray(allIssues) ? allIssues : []).filter(
                  i => i && i.member_id === selectedMember.id && (i.status === 'issued' || i.status === 'overdue')
                );
                if (activeLoans.length === 0) return null;
                return (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-3">
                    <span className="text-[9px] text-cyan-400 uppercase font-extrabold block border-b border-white/5 pb-1">
                      Active Loans for {selectedMember.username || 'Member'} ({activeLoans.length})
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {activeLoans.map(loan => (
                        <div key={loan.id} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2 text-[10px]">
                          <div className="min-w-0 flex-1">
                            <strong className="text-white font-bold block truncate">{loan.book_title || 'Unknown Title'}</strong>
                            <span className="text-white/40 text-[9px] block">
                              Due: <span className={loan.status === 'overdue' ? 'text-rose-400 font-bold' : 'text-amber-300'}>{(loan.due_date ?? '').split(' ')[0] || 'N/A'}</span> | Status: <span className="uppercase font-mono">{loan.status || '-'}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleReturnBook(loan.id)}
                              disabled={loading}
                              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold rounded-lg transition-all text-[9px] cursor-pointer disabled:opacity-50"
                            >
                              Return Book
                            </button>
                            <button
                              onClick={() => handleRenewBook(loan.id)}
                              disabled={loading}
                              className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold rounded-lg transition-all text-[9px] cursor-pointer disabled:opacity-50"
                            >
                              Renew (14d)
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => setStep(1)} className="px-4 py-2 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
                <button
                  onClick={() => setStep(3)}
                  disabled={memberStats.isRestricted}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-30 text-blue-950 font-bold rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  Verify and Search Catalog <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SEARCH BOOK */}
          {step === 3 && (
            <div className="glass-panel p-6 border-white/10 text-center space-y-6 animate-fade-in bg-slate-900/20">
              <div>
                <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wide">Lending Step 3: Search Library Book Catalog</h4>
                <p className="text-[10px] text-white/40">Lookup book titles or scan the physical item barcode copy.</p>
              </div>

              <div className="max-w-md mx-auto p-5 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] space-y-4 relative overflow-hidden h-44 flex flex-col justify-center items-center">
                {scannerActive ? (
                  <>
                    <div className="absolute inset-x-0 h-0.5 bg-cyan-400/80 shadow-lg shadow-cyan-400/50 transition-all duration-75" style={{ top: `${scannerLaserY}%` }}></div>
                    <QrCode className="w-16 h-16 text-cyan-400 animate-pulse" />
                    <span className="text-[9px] text-cyan-400 font-bold tracking-widest uppercase animate-pulse mt-2">Active Laser Feed...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-16 h-16 text-white/25" />
                    <button
                      onClick={triggerBookScanner}
                      disabled={dataLoading}
                      className="bg-cyan-500 hover:bg-cyan-600 text-blue-950 font-bold px-5 py-2 rounded-xl text-[10px] flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10 cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" /> Scan Book Barcode
                    </button>
                  </>
                )}
              </div>

              {/* Autocomplete book lookup */}
              <div className="relative max-w-sm mx-auto space-y-2">
                <span className="text-white/30 text-[9px] uppercase font-bold block">Or Catalog Search</span>
                <div className="relative">
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    placeholder="Type book title or ISBN number..."
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 font-sans"
                  />
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40"><Search className="w-3.5 h-3.5" /></span>
                </div>

                {dataLoading ? (
                  <div className="py-2 flex justify-center"><RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" /></div>
                ) : bookSearch.trim() && (
                  <div className="absolute w-full mt-1.5 bg-[#0e1220] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20 max-h-40 overflow-y-auto text-left text-xs">
                    {books
                      .filter(b => b && ((b.title ?? '').toLowerCase().includes(bookSearch.toLowerCase()) || (b.isbn ?? '').includes(bookSearch)))
                      .map(b => (
                        <button
                          key={b.id}
                          type="button"
                          disabled={b.quantity <= 0}
                          onClick={() => { setSelectedBook(b); setStep(4); setBookSearch(''); }}
                          className="w-full p-2.5 hover:bg-white/5 cursor-pointer text-white border-b border-white/5 text-left flex justify-between items-center disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <div>
                            <strong className="text-white font-bold">{b.title || 'Unknown Title'}</strong>
                            <span className="text-white/40 block text-[9px] mt-0.5">Author: {b.author || 'Unknown'} | ISBN: {b.isbn || 'N/A'}</span>
                          </div>
                          {b.quantity > 0 ? (
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold shrink-0">{b.quantity} Available</span>
                          ) : (
                            <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-bold shrink-0">Out of Stock</span>
                          )}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div className="flex justify-start items-center pt-2">
                <button onClick={() => setStep(2)} className="px-4 py-2 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
              </div>
            </div>
          )}

          {/* STEP 4: SELECT COPY */}
          {step === 4 && selectedBook && (
            <div className="glass-panel p-6 border-white/10 space-y-6 animate-fade-in bg-slate-900/20">
              <div>
                <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wide">Lending Step 4: Asset Copy Designation</h4>
                <p className="text-[10px] text-white/40">Select the physical copy catalog tags and confirm shelf locations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Book Details info */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-3.5 text-[10px]">
                  <span className="text-[9px] text-white/30 uppercase font-extrabold block border-b border-white/5 pb-1 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Catalog Registry</span>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Title:</span><strong className="text-white font-bold truncate max-w-[150px]">{selectedBook.title || 'Unknown Title'}</strong></div>
                    <div className="flex justify-between"><span>Author:</span><strong className="text-white font-medium truncate max-w-[150px]">{selectedBook.author || 'Unknown Author'}</strong></div>
                    <div className="flex justify-between"><span>ISBN:</span><strong className="text-white font-mono">{selectedBook.isbn || 'N/A'}</strong></div>
                    <div className="flex justify-between"><span>Category:</span><span className="text-cyan-300 font-bold">{selectedBook.category || 'General'}</span></div>
                  </div>
                </div>

                {/* Copies selection details */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-3 text-[10px]">
                  <span className="text-[9px] text-white/30 uppercase font-extrabold block border-b border-white/5 pb-1 flex items-center gap-1"><Scale className="w-3.5 h-3.5 text-cyan-400" /> Physical Specifiers</span>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Accession Tag:</span><strong className="text-white font-mono">{selectedBook.accession_number || `ACC-${(selectedBook.isbn ?? '').split('-')?.[2] || (selectedBook.isbn ?? '').split('-')?.[0] || '92241'}`}</strong></div>
                    <div className="flex justify-between"><span>Shelf Position:</span><strong className="text-white font-semibold">Floor {selectedBook.floor || '1'}, Rack {selectedBook.rack_number || 'A'}, Shelf {selectedBook.shelf_number || '3'}</strong></div>
                    <div className="flex justify-between"><span>Condition:</span><span className="text-emerald-400 font-bold font-sans">Excellent (0 Damaged)</span></div>
                    <div className="flex justify-between"><span>Calculated Fine Rate:</span><span className="text-amber-400 font-bold font-mono">₹5.00/day</span></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => setStep(3)} className="px-4 py-2 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
                <button
                  onClick={() => setStep(5)}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-blue-950 font-bold rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  designate Copy & Proceed <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: ISSUE */}
          {step === 5 && selectedMember && selectedBook && (
            <div className="glass-panel p-6 border-white/10 space-y-6 animate-fade-in bg-slate-900/20">
              <div>
                <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wide text-center">Lending Step 5: Lending Terms & Confirmation</h4>
                <p className="text-[10px] text-white/40 text-center">Set due date intervals and confirm the circulation checkout transaction.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
                {/* Preview details */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-3.5 text-[10px]">
                  <span className="text-[9px] text-white/30 uppercase font-extrabold block border-b border-white/5 pb-1">Checkout Summary</span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span>Borrower:</span><strong className="text-white">{selectedMember.username || 'Unknown Member'}</strong></div>
                    <div className="flex justify-between"><span>Card:</span><span className="text-cyan-300 font-mono font-semibold">{selectedMember.membership_id || 'N/A'}</span></div>
                    <div className="flex justify-between"><span>Asset:</span><strong className="text-white truncate max-w-[130px]">{selectedBook.title || 'Unknown Title'}</strong></div>
                  </div>
                </div>

                {/* Due Date picker */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-3 text-[10px]">
                  <span className="text-[9px] text-white/30 uppercase font-extrabold block border-b border-white/5 pb-1 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-cyan-400" /> Due Date Interval</span>
                  <div className="space-y-2">
                    <label className="text-white/60 font-semibold block mb-0.5">Lending Period</label>
                    <select 
                      value={dueDays}
                      onChange={(e) => setDueDays(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-sans text-xs focus:outline-none focus:border-cyan-400 font-semibold"
                    >
                      <option value={7}>7 Days (Express Course Reference)</option>
                      <option value={14}>14 Days (Standard College Checkout)</option>
                      <option value={21}>21 Days (Research Associate Tier)</option>
                      <option value={30}>30 Days (Extended Faculty Release)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => setStep(4)} className="px-4 py-2 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
                <button
                  onClick={handleIssueSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-bold rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-yellow-500/10 font-bold"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Confirm and Authorize Checkout
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: RECEIPT */}
          {step === 6 && receiptData && (
            <div className="glass-panel p-6 border-white/10 space-y-6 animate-fade-in text-center bg-slate-900/20">
              <div className="space-y-1">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-white font-bold text-base m-0 uppercase tracking-wide">Lending Transaction Settled!</h4>
                <p className="text-[10px] text-white/50">Circulation record registered on central ledger nodes.</p>
              </div>
              
              {/* Printable Receipt Panel */}
              <div className="glass-panel p-5 border-white/10 text-left space-y-4 max-w-sm mx-auto text-xs bg-gradient-to-b from-[#0f1422] to-slate-950 shadow-2xl">
                <div className="text-center pb-2 border-b border-white/5">
                  <strong className="text-white text-sm block uppercase tracking-wider">NOVA TECHNICAL INSTITUTE</strong>
                  <span className="text-[9px] text-cyan-400 font-bold tracking-widest block uppercase mt-0.5">Circulation Node Invoice</span>
                </div>
                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between"><span>Invoice Node ID:</span><strong className="text-white font-mono">#LN-{1000 + receiptData.id}</strong></div>
                  <div className="flex justify-between"><span>Book Checked Out:</span><strong className="text-white truncate max-w-[170px]">{receiptData.book_title || 'Unknown Title'}</strong></div>
                  <div className="flex justify-between"><span>Member Username:</span><strong className="text-white">{receiptData.member_name || 'Unknown Member'}</strong></div>
                  <div className="flex justify-between"><span>Membership ID:</span><strong className="text-white font-mono">{receiptData.membership_id || 'N/A'}</strong></div>
                  <div className="flex justify-between border-t border-white/5 pt-2"><span>Issue Timestamp:</span><strong className="text-white">{(receiptData.issue_date ?? '').split(' ')[0] || 'N/A'}</strong></div>
                  <div className="flex justify-between"><span>Release Due Date:</span><strong className="text-amber-400 font-semibold">{(receiptData.due_date ?? '').split(' ')[0] || 'N/A'}</strong></div>
                </div>
                
                <div className="pt-2.5 border-t border-white/5 text-center text-white/40 text-[8px]">
                  Lending penalty rate: ₹5.00 / overdue day. Non-return locks student smart card verification protocols.
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 justify-center max-w-sm mx-auto">
                <button 
                  onClick={triggerReceiptPrint} 
                  className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-600 text-blue-950 font-bold text-[10px] rounded-xl flex-1 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
                <button 
                  onClick={simulateDownloadPDF} 
                  className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] rounded-xl flex-1 flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> PDF Download
                </button>
                <button 
                  onClick={simulateEmailReceipt} 
                  className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] rounded-xl flex-1 flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </button>
              </div>

              <div className="pt-2 border-t border-white/5 max-w-sm mx-auto">
                <button onClick={resetStepper} className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 font-bold rounded-xl text-[10px] transition-all cursor-pointer">Issue Next Book Copy</button>
              </div>
            </div>
          )}

        </div>

        {/* SIDE PANEL: STATISTICS & TIMELINE */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* live widgets */}
          <div className="glass-panel p-4 border-white/10 space-y-3.5 bg-slate-900/10">
            <h5 className="text-white font-bold uppercase tracking-wider m-0 border-b border-white/5 pb-2 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-cyan-400" /> Desk Stats
            </h5>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5">
                <span className="text-white/40 text-[7px] uppercase font-bold block">Issues Today</span>
                <strong className="text-cyan-400 text-sm font-mono font-extrabold">{(Array.isArray(allIssues) ? allIssues : []).filter(i => i && i.status === 'issued').length}</strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5">
                <span className="text-white/40 text-[7px] uppercase font-bold block">Returns Today</span>
                <strong className="text-emerald-400 text-sm font-mono font-extrabold">{(Array.isArray(allIssues) ? allIssues : []).filter(i => i && i.status === 'returned').length}</strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5">
                <span className="text-white/40 text-[7px] uppercase font-bold block">Holds/Reserves</span>
                <strong className="text-amber-400 text-sm font-mono font-extrabold">3</strong>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5">
                <span className="text-white/40 text-[7px] uppercase font-bold block">Active Fines</span>
                <strong className="text-rose-400 text-sm font-mono font-extrabold">₹{(Array.isArray(allFines) ? allFines : []).filter(f => f && f.status === 'pending').reduce((sum, f) => sum + (f.amount || 0), 0).toFixed(0)}</strong>
              </div>
            </div>
          </div>

          {/* recent transactions timeline */}
          <div className="glass-panel p-4 border-white/10 space-y-3 bg-slate-900/10">
            <h5 className="text-white font-bold uppercase tracking-wider m-0 border-b border-white/5 pb-2 flex items-center gap-1.5">
              <History className="w-4 h-4 text-cyan-400" /> Recent Feed
            </h5>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {(Array.isArray(allIssues) ? allIssues : []).slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex gap-2 text-[9px] border-b border-white/5 pb-2 last:border-0 last:pb-0 items-center justify-between">
                  <div className="flex gap-2 items-center min-w-0 flex-1">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.status === 'issued' ? 'bg-cyan-500' : item.status === 'overdue' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <div className="min-w-0 flex-1">
                      <span className="text-white font-bold block truncate">{item.book_title}</span>
                      <span className="text-white/40 block mt-0.5 truncate">{item.member_name} • <span className="uppercase">{item.status}</span></span>
                    </div>
                  </div>
                  {item.status !== 'returned' && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleReturnBook(item.id)}
                        disabled={loading}
                        className="text-[8px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded cursor-pointer disabled:opacity-50 font-bold"
                      >
                        Return
                      </button>
                      <button
                        onClick={() => handleRenewBook(item.id)}
                        disabled={loading}
                        className="text-[8px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded cursor-pointer disabled:opacity-50 font-bold"
                      >
                        Renew
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {(!Array.isArray(allIssues) || allIssues.length === 0) && (
                <span className="text-white/30 text-[9px] block text-center py-2">No circulation feeds today.</span>
              )}
            </div>
          </div>

          {/* keyboard shortcuts legend */}
          <div className="glass-panel p-4 border-white/10 space-y-2.5 bg-slate-900/10">
            <h5 className="text-white font-bold uppercase tracking-wider m-0 border-b border-white/5 pb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-cyan-400" /> Shortcuts Legend
            </h5>
            <div className="space-y-1.5 text-[8.5px] text-white/60">
              <div className="flex justify-between"><span>Reset Workflow:</span><kbd className="px-1.5 py-0.5 rounded bg-slate-950 border border-white/10 text-white font-mono text-[7px] font-bold">Esc</kbd></div>
              <div className="flex justify-between"><span>Advance Step:</span><kbd className="px-1.5 py-0.5 rounded bg-slate-950 border border-white/10 text-white font-mono text-[7px] font-bold">Ctrl + Enter</kbd></div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

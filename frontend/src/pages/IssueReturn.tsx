import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, Search, FileText, ArrowRight, ArrowLeft, QrCode, Printer } from 'lucide-react';

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  quantity: number;
}

interface Member {
  id: number;
  username: string;
  membership_id: string;
  department: string;
}

export default function IssueReturn() {
  const [step, setStep] = useState(1); // Steps: 1 (Scan Member), 2 (Scan Book), 3 (Verify), 4 (Issue / Complete)
  
  // Selections
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // Lists
  const [members, setMembers] = useState<Member[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  // Lookup fields
  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');

  // Receipt reference
  const [receiptData, setReceiptData] = useState<any>(null);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      // Load Members
      const mRes = await fetch('http://127.0.0.1:5000/api/members', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const mData = await mRes.json();
      setMembers(mData.members);

      // Load Books
      const bRes = await fetch('http://127.0.0.1:5000/api/books');
      const bData = await bRes.json();
      setBooks(bData);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // simulated scanner picks random item
  const triggerMemberScanner = () => {
    if (members.length === 0) return;
    const randMem = members[Math.floor(Math.random() * members.length)];
    setSelectedMember(randMem);
    setStep(2);
  };

  const triggerBookScanner = () => {
    const availableBooks = books.filter(b => b.quantity > 0);
    if (availableBooks.length === 0) return;
    const randBook = availableBooks[Math.floor(Math.random() * availableBooks.length)];
    setSelectedBook(randBook);
    setStep(3);
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
          due_days: 14
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);

      setReceiptData(data.issue);
      setStep(4);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetStepper = () => {
    setSelectedMember(null);
    setSelectedBook(null);
    setReceiptData(null);
    setStep(1);
    loadData();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* STEPPER STATUS INDICATOR */}
      <div className="glass-panel p-4 flex justify-between items-center border-white/10 max-w-2xl mx-auto text-xs font-semibold">
        <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-yellow-400 font-bold' : 'text-white/40'}`}>
          <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">1</span>
          <span>Scan Member</span>
        </div>
        <ArrowRight className="w-4 h-4 text-white/20" />
        <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-yellow-400 font-bold' : 'text-white/40'}`}>
          <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">2</span>
          <span>Scan Book</span>
        </div>
        <ArrowRight className="w-4 h-4 text-white/20" />
        <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-yellow-400 font-bold' : 'text-white/40'}`}>
          <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">3</span>
          <span>Verify checkout</span>
        </div>
        <ArrowRight className="w-4 h-4 text-white/20" />
        <div className={`flex items-center gap-1.5 ${step >= 4 ? 'text-yellow-400 font-bold' : 'text-white/40'}`}>
          <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">4</span>
          <span>Issue receipt</span>
        </div>
      </div>

      {/* STEP CONTENT WRAPPERS */}
      <div className="max-w-2xl mx-auto">
        {/* STEP 1: SCAN MEMBER */}
        {step === 1 && (
          <div className="glass-panel p-6 border-white/10 text-center space-y-6 animate-fade-in">
            <h4 className="text-white font-bold text-base"><i className="fas fa-barcode text-warning me-2"></i>Step 1: Scan Member barcode</h4>
            
            <div className="max-w-sm mx-auto p-6 rounded-2xl border border-dashed border-white/20 bg-white/5 space-y-4">
              <QrCode className="w-16 h-16 text-cyan-300 mx-auto animate-pulse" />
              <button
                onClick={triggerMemberScanner}
                className="bg-cyan-500 hover:bg-cyan-600 text-blue-950 font-bold px-6 py-2 rounded-xl text-xs flex items-center gap-1.5 mx-auto transition-all shadow-lg shadow-cyan-500/10"
              >
                <Camera className="w-4 h-4" /> Trigger barcode Scanner
              </button>
            </div>

            <div className="relative max-w-sm mx-auto">
              <span className="text-white/30 text-[10px] uppercase font-bold block mb-3">Or Search Manually</span>
              <div className="relative">
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Type member username or membership ID..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                />
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40"><Search className="w-3.5 h-3.5" /></span>
              </div>

              {/* Suggestions */}
              {memberSearch.trim() && (
                <div className="absolute w-full mt-1 bg-blue-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20 max-h-40 overflow-y-auto text-left text-xs">
                  {members
                    .filter(m => m.username.toLowerCase().includes(memberSearch.toLowerCase()) || m.membership_id.toLowerCase().includes(memberSearch.toLowerCase()))
                    .map(m => (
                      <div
                        key={m.id}
                        onClick={() => { setSelectedMember(m); setStep(2); setMemberSearch(''); }}
                        className="p-2.5 hover:bg-white/10 cursor-pointer text-white border-b border-white/5"
                      >
                        {m.username} [{m.membership_id}] - {m.department}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: SCAN BOOK */}
        {step === 2 && (
          <div className="glass-panel p-6 border-white/10 text-center space-y-6 animate-fade-in">
            <h4 className="text-white font-bold text-base"><i className="fas fa-book text-warning me-2"></i>Step 2: Scan Book barcode</h4>
            
            <div className="max-w-sm mx-auto p-6 rounded-2xl border border-dashed border-white/20 bg-white/5 space-y-4">
              <QrCode className="w-16 h-16 text-cyan-300 mx-auto animate-pulse" />
              <button
                onClick={triggerBookScanner}
                className="bg-cyan-500 hover:bg-cyan-600 text-blue-950 font-bold px-6 py-2 rounded-xl text-xs flex items-center gap-1.5 mx-auto transition-all shadow-lg"
              >
                <Camera className="w-4 h-4" /> Trigger barcode Scanner
              </button>
            </div>

            <div className="relative max-w-sm mx-auto">
              <span className="text-white/30 text-[10px] uppercase font-bold block mb-3">Or Search Manually</span>
              <div className="relative">
                <input
                  type="text"
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder="Type book title or ISBN number..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                />
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40"><Search className="w-3.5 h-3.5" /></span>
              </div>

              {/* Suggestions */}
              {bookSearch.trim() && (
                <div className="absolute w-full mt-1 bg-blue-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20 max-h-40 overflow-y-auto text-left text-xs">
                  {books
                    .filter(b => b.quantity > 0 && (b.title.toLowerCase().includes(bookSearch.toLowerCase()) || b.isbn.includes(bookSearch)))
                    .map(b => (
                      <div
                        key={b.id}
                        onClick={() => { setSelectedBook(b); setStep(3); setBookSearch(''); }}
                        className="p-2.5 hover:bg-white/10 cursor-pointer text-white border-b border-white/5"
                      >
                        {b.title} [ISBN: {b.isbn}] ({b.quantity} in stock)
                      </div>
                    ))}
                </div>
              )}
            </div>

            <button onClick={() => setStep(1)} className="btn btn-glass text-xs flex items-center gap-1 mx-auto mt-4"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
          </div>
        )}

        {/* STEP 3: VERIFY */}
        {step === 3 && selectedMember && selectedBook && (
          <div className="glass-panel p-6 border-white/10 space-y-6 animate-fade-in">
            <h4 className="text-white font-bold text-base text-center"><i className="fas fa-user-check text-warning me-2"></i>Step 3: Verification Check</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                <span className="text-[10px] text-white/40 uppercase font-bold block border-b border-white/5 pb-1">Member File</span>
                <div className="flex justify-between"><span>Name:</span><strong className="text-white">{selectedMember.username}</strong></div>
                <div className="flex justify-between"><span>ID:</span><strong className="text-white">{selectedMember.membership_id}</strong></div>
                <div className="flex justify-between"><span>Department:</span><strong className="text-white">{selectedMember.department}</strong></div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                <span className="text-[10px] text-white/40 uppercase font-bold block border-b border-white/5 pb-1">Book Catalog</span>
                <div className="flex justify-between"><span>Title:</span><strong className="text-white truncate max-w-[150px]">{selectedBook.title}</strong></div>
                <div className="flex justify-between"><span>ISBN:</span><strong className="text-white">{selectedBook.isbn}</strong></div>
                <div className="flex justify-between"><span>Author:</span><strong className="text-white truncate max-w-[150px]">{selectedBook.author}</strong></div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleIssueSubmit}
                disabled={loading}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-500/10"
              >
                <CheckCircle className="w-4.5 h-4.5" /> Settle checkout Issue
              </button>
              <button onClick={() => setStep(2)} className="btn btn-glass text-xs py-2 px-4 text-white">Back</button>
            </div>
          </div>
        )}

        {/* STEP 4: RECEIPT */}
        {step === 4 && receiptData && (
          <div className="glass-panel p-6 border-white/10 space-y-6 animate-fade-in text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-white font-bold text-base m-0">Issue Completed Successfully!</h4>
            
            {/* Printable Receipt Panel */}
            <div className="glass-panel p-5 border-white/10 text-left space-y-4 max-w-sm mx-auto text-xs bg-gradient-to-b from-blue-950/60 to-slate-950/40">
              <div className="text-center pb-2 border-b border-white/10">
                <strong className="text-white text-sm block uppercase">NOVA LIBRARY</strong>
                <span className="text-[9px] text-white/50">Lending Transaction Node Receipt</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span>Lending ID:</span><strong className="text-white">#LN-{1000 + receiptData.id}</strong></div>
                <div className="flex justify-between"><span>Book:</span><strong className="text-white truncate max-w-[180px]">{receiptData.book_title}</strong></div>
                <div className="flex justify-between"><span>Issued to:</span><strong className="text-white">{receiptData.member_name}</strong></div>
                <div className="flex justify-between"><span>Registry ID:</span><strong className="text-white">{receiptData.membership_id}</strong></div>
                <div className="flex justify-between border-t border-white/5 pt-2"><span>Issue Date:</span><strong className="text-white">{receiptData.issue_date.split(' ')[0]}</strong></div>
                <div className="flex justify-between"><span>Due Date:</span><strong className="text-yellow-400">{receiptData.due_date.split(' ')[0]}</strong></div>
              </div>
              
              <div className="pt-2 border-t border-white/10 text-center text-white/40 text-[8px]">
                Calculated penalty rate ₹5.00/overdue day. Please return on time.
              </div>
            </div>

            <div className="flex gap-2 justify-center max-w-sm mx-auto">
              <button onClick={() => alert('Printing node completed!')} className="btn btn-premium flex-1 py-2 text-xs flex items-center justify-center gap-1.5"><Printer className="w-4 h-4" /> Print Invoice</button>
              <button onClick={resetStepper} className="btn btn-glass flex-1 py-2 text-xs">Issue Next Book</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

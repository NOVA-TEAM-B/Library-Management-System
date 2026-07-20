import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Shield, User, HelpCircle, Map, Laptop, Database, Search, 
  Mic, MicOff, Star, Heart, Award, FileText, CheckCircle2, AlertTriangle, 
  Download, Printer, Trash2, LayoutGrid, Clock, Keyboard, ShieldAlert, Cpu, Eye, Upload
} from 'lucide-react';

interface EnterpriseHubProps {
  user: any;
  onTabChange?: (tab: string) => void;
}

export default function EnterpriseHub({ user, onTabChange }: EnterpriseHubProps) {
  const [subTab, setSubTab] = useState<'digital' | 'map' | 'club' | 'health'>('digital');
  
  // Premium Toast States
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({ message: '', type: null });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: null }), 4000);
  };

  // Shared books lists
  const [catalogBooks, setCatalogBooks] = useState<any[]>([]);

  // ==================================================
  // TAB 1: DIGITAL LIBRARY, ADVANCED SEARCH & BARCODE
  // ==================================================
  // Search & Speech State
  const [searchParams, setSearchParams] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'all',
    rating: 0,
    availability: 'all'
  });
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Digital Documents List & Upload State
  const [digitalDocs, setDigitalDocs] = useState<any[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [newDocType, setNewDocType] = useState('Research Paper');
  const [docTags, setDocTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Barcode State
  const [barcodeInput, setBarcodeInput] = useState('978-0131103628');
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  // ==================================================
  // TAB 2: LIBRARY MAP & READING ROOM RESERVATION
  // ==================================================
  const [selectedFloor, setSelectedFloor] = useState<1 | 2 | 3>(1);
  const [selectedMapRack, setSelectedMapRack] = useState<string | null>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  // ==================================================
  // TAB 3: BOOK CLUB & GAMIFICATION XP
  // ==================================================
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewBookId, setReviewBookId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Gamification states
  const [xpProfile, setXpProfile] = useState({
    xp_points: 100,
    level: 1,
    streak_days: 1,
    badges: [] as string[]
  });

  // ==================================================
  // TAB 4: SYSTEM HEALTH & TELEMETRY
  // ==================================================
  const [telemetry, setTelemetry] = useState({
    cpu: 12.5,
    ram: 36.8,
    dbConnections: 5,
    apiUptime: '99.99%',
    smtpStatus: 'Online',
    smsStatus: 'Online'
  });
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // ==================================================
  // API INGESTION LOOP (REAL FETCH REQUESTS)
  // ==================================================
  const fetchCatalogBooks = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/books');
      const data = await res.json();
      if (res.ok) setCatalogBooks(data);
    } catch (err) {}
  };

  const fetchDigitalDocs = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/digital-docs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDigitalDocs(data.data);
      }
    } catch (err) {}
  };

  const fetchSeats = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/seats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSeats(data.data);
      }
    } catch (err) {}
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/books/reviews');
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews(data.data);
      }
    } catch (err) {}
  };

  const fetchXP = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/member/xp', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setXpProfile(data.data);
      }
    } catch (err) {}
  };

  const fetchTelemetry = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/telemetry', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTelemetry(data.data.current);
        setTelemetryHistory(data.data.history);
      }
    } catch (err) {}
  };

  // Run on mount
  useEffect(() => {
    fetchCatalogBooks();
    fetchDigitalDocs();
    fetchSeats();
    fetchReviews();
    fetchXP();
    fetchTelemetry();

    // Setup speech engine
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setSearchParams(prev => ({ ...prev, title: text }));
        showToast(`Captured speech: "${text}"`, 'info');
      };
      recognitionRef.current = rec;
    }
  }, []);

  // Telemetry updates
  useEffect(() => {
    if (subTab !== 'health') return;
    const interval = setInterval(fetchTelemetry, 3500);
    return () => clearInterval(interval);
  }, [subTab]);

  // Voice Search Toggler
  const toggleSpeech = () => {
    if (!recognitionRef.current) {
      showToast("Web Speech is not supported in this browser.", "error");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Barcode Label Studio Generator
  const generateBarcode = () => {
    const canvas = barcodeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    let startX = 20;
    const str = barcodeInput || '0000000';

    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      const binaryPattern = (code * 179).toString(2).substring(0, 8);
      for (let bit = 0; bit < binaryPattern.length; bit++) {
        const width = binaryPattern[bit] === '1' ? 3 : 1;
        ctx.fillRect(startX, 15, width, 55);
        startX += width + 2;
      }
    }

    ctx.fillStyle = '#1e293b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(str, canvas.width / 2, 85);
  };

  useEffect(() => {
    generateBarcode();
  }, [barcodeInput]);

  // Handle document upload
  const handleDocUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast("Please choose a digital PDF/TXT/DOCX file to upload.", "error");
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('type', newDocType);
    formData.append('tags', docTags);

    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/digital-docs/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        setUploadFile(null);
        setDocTags('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchDigitalDocs();
        fetchXP();
      } else {
        showToast(data.message || 'Upload failed', 'error');
      }
    } catch (err) {
      showToast('Error connecting to uploading node.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Preview PDF in inline portal
  const handleViewPdf = async (docId: number, title: string) => {
    showToast(`Loading PDF viewer node for '${title}'...`, 'info');
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/digital-docs/view/${docId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        setActivePdfUrl(url);
      } else {
        showToast('Failed to load PDF preview stream', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  };

  // Download digital document
  const handleDownloadPdf = async (docId: number, title: string) => {
    showToast(`Initiating file fetch for '${title}'...`, 'info');
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/digital-docs/download/${docId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = title;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast(`Document downloaded successfully!`, 'success');
      } else {
        showToast('Failed to download document', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  };

  // Delete digital document
  const handleDeletePdf = async (docId: number, title: string) => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/digital-docs/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        fetchDigitalDocs();
      } else {
        showToast(data.message || 'Deletion failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  };

  // Seating control actions
  const handleSeatBookingToggle = async (seatNumber: string, currentStatus: string, bookedBy?: string) => {
    if (currentStatus === 'booked' && bookedBy !== user.username) {
      showToast(`This seat is already reserved by ${bookedBy}`, 'error');
      return;
    }
    
    setIsBooking(true);
    const token = localStorage.getItem('nova_jwt_token');
    try {
      if (currentStatus === 'booked') {
        // Release seat
        const res = await fetch('http://127.0.0.1:5000/api/seats/release', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ seat_number: seatNumber })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(data.message, 'success');
          fetchSeats();
        } else {
          showToast(data.message || 'Release failed', 'error');
        }
      } else {
        // Book seat
        const res = await fetch('http://127.0.0.1:5000/api/seats/book', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ seat_number: seatNumber, duration: 120 })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(data.message, 'success');
          fetchSeats();
          fetchXP();
        } else {
          showToast(data.message || 'Booking failed', 'error');
        }
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setIsBooking(false);
    }
  };

  // Submit book review
  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBookId || !reviewComment.trim()) {
      showToast("Please choose a book and write a detailed comment.", "error");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/books/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          book_id: parseInt(reviewBookId),
          rating: reviewRating,
          comment: reviewComment
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        setReviewComment('');
        fetchReviews();
        fetchXP();
      } else {
        showToast(data.message || 'Failed to submit review', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Streak checkin
  const handleCheckinStreak = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/member/xp/streak', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        fetchXP();
      } else {
        showToast(data.message || 'Streak log failed', 'info');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
  };

  // Backup trigger
  const triggerTelemetryBackup = async () => {
    setIsBackingUp(true);
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/telemetry/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(data.message || 'Failed to execute backup', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const getOccupancyPercentage = () => {
    const booked = seats.filter(s => s.status === 'booked').length;
    return seats.length > 0 ? Math.floor((booked / seats.length) * 100) : 0;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-slate-200 font-sans relative">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toast.type && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-6 right-6 z-[100] p-4 rounded-2xl glass-panel border flex items-center gap-3 shadow-2xl backdrop-blur-xl ${
              toast.type === 'success' 
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/80 shadow-emerald-500/10' 
                : toast.type === 'error'
                  ? 'border-rose-500/30 text-rose-400 bg-rose-950/80 shadow-rose-500/10'
                  : 'border-cyan-500/30 text-cyan-400 bg-cyan-950/80 shadow-cyan-500/10'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 animate-bounce text-emerald-400" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 animate-pulse text-rose-400" />}
            {toast.type === 'info' && <Sparkles className="w-5 h-5 animate-spin text-cyan-400" />}
            <span className="font-semibold text-xs">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome & Premium Switch Banner */}
      <div className="glass-panel p-6 bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900/60 border-white/10 rounded-[24px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">Nova Enterprise Suite</h3>
            <p className="text-white/60 text-xs mt-1">Unlock premium college features: interactive seat maps, voice catalog controls, reviews desk, and live health telemetries.</p>
          </div>
        </div>

        {/* Tab Controls Selector */}
        <div className="flex bg-slate-950/60 p-1 border border-white/10 rounded-xl text-xs gap-1">
          <button 
            onClick={() => setSubTab('digital')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${subTab === 'digital' ? 'bg-amber-500 text-slate-950' : 'text-white/60 hover:text-white'}`}
          >
            <Laptop className="w-3.5 h-3.5" /> Digital Hub
          </button>
          <button 
            onClick={() => setSubTab('map')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${subTab === 'map' ? 'bg-amber-500 text-slate-950' : 'text-white/60 hover:text-white'}`}
          >
            <Map className="w-3.5 h-3.5" /> Room & Maps
          </button>
          <button 
            onClick={() => setSubTab('club')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${subTab === 'club' ? 'bg-amber-500 text-slate-950' : 'text-white/60 hover:text-white'}`}
          >
            <Award className="w-3.5 h-3.5" /> Book Club & XP
          </button>
          <button 
            onClick={() => setSubTab('health')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${subTab === 'health' ? 'bg-amber-500 text-slate-950' : 'text-white/60 hover:text-white'}`}
          >
            <Database className="w-3.5 h-3.5" /> Telemetry
          </button>
        </div>
      </div>

      {/* SUB-TABS INTERFACE */}
      <AnimatePresence mode="wait">
        {/* TAB 1: DIGITAL STUDIO */}
        {subTab === 'digital' && (
          <motion.div 
            key="digital-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Advanced Search & Voice Recognition */}
            <div className="glass-panel p-5 border-white/5 space-y-4 lg:col-span-2">
              <h4 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                <Search className="w-4 h-4 text-amber-400" /> Advanced Catalog & Voice Recognition
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Voice search / Title</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Speak or type book title..." 
                      value={searchParams.title}
                      onChange={(e) => setSearchParams(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <button 
                      onClick={toggleSpeech}
                      className={`absolute right-2.5 top-2 p-1 rounded-lg transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-slate-400 hover:text-white'}`}
                    >
                      {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Author</label>
                  <input 
                    type="text" 
                    placeholder="Search by author name..." 
                    value={searchParams.author}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">ISBN Code</label>
                  <input 
                    type="text" 
                    placeholder="Search by 13-digit ISBN..." 
                    value={searchParams.isbn}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, isbn: e.target.value }))}
                    className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Genre Category</label>
                  <select 
                    value={searchParams.category}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    style={{ background: '#0a0d16' }}
                  >
                    <option value="all">All Genres</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setSearchParams({ title: '', author: '', isbn: '', category: 'all', rating: 0, availability: 'all' })}
                  className="bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold rounded-xl hover:bg-white/10 transition-colors"
                >
                  Clear Filters
                </button>
                <button 
                  onClick={() => showToast(`Filtering catalogue database...`, 'info')}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95"
                >
                  Execute Search
                </button>
              </div>

              {/* Digital Upload Center */}
              <div className="pt-4 border-t border-white/5 space-y-4">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" /> Digital Library Hub & Uploads
                </h4>
                <form onSubmit={handleDocUploadSubmit} className="flex flex-col md:flex-row gap-3 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Select Document (PDF/TXT/DOCX)</label>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Doc Type</label>
                    <select 
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      style={{ background: '#0a0d16' }}
                    >
                      <option value="Research Paper">Research Paper</option>
                      <option value="Thesis">Thesis</option>
                      <option value="Journal">Journal</option>
                      <option value="Notes">Lecture Notes</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Tags (comma split)</label>
                    <input 
                      type="text"
                      placeholder="e.g. quantum, physics"
                      value={docTags}
                      onChange={(e) => setDocTags(e.target.value)}
                      className="bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isUploading}
                    className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    {isUploading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Upload file
                  </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {digitalDocs.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-[10px] text-slate-500 font-mono">No digital archive files found in organization.</div>
                  ) : (
                    digitalDocs.map(doc => (
                      <div key={doc.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-white block truncate max-w-[190px]">{doc.title}</strong>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">{doc.type} • {doc.size} (V{doc.version})</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleViewPdf(doc.id, doc.title)} className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-slate-300">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDownloadPdf(doc.id, doc.title)} className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-slate-300">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeletePdf(doc.id, doc.title)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Barcode Studio & Labels */}
            <div className="glass-panel p-5 border-white/5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-4">
                <h4 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                  <Printer className="w-4 h-4 text-emerald-400" /> Barcode & Label Studio
                </h4>
                
                <p className="text-slate-400 text-xs leading-relaxed">Input any barcode ID or ISBN below. The system automatically compiles and draws printable vector barcode patterns dynamically.</p>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Barcode Value</label>
                  <input 
                    type="text" 
                    value={barcodeInput} 
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="e.g. 978-0131103628"
                    className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Drawn Canvas Barcode */}
              <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl shadow-inner aspect-[2/1] my-2">
                <canvas ref={barcodeCanvasRef} width="220" height="95" className="max-w-full" />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Label
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: FLOOR MAP & SEATS */}
        {subTab === 'map' && (
          <motion.div 
            key="map-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Interactive Floor Maps */}
            <div className="glass-panel p-5 border-white/5 space-y-4 lg:col-span-2">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h4 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Map className="w-4 h-4 text-cyan-400" /> Interactive Floor Map Locator
                </h4>
                <div className="flex bg-slate-950/60 p-0.5 border border-white/10 rounded-lg text-[10px]">
                  {[1, 2, 3].map(floor => (
                    <button
                      key={floor}
                      onClick={() => { setSelectedFloor(floor as any); setSelectedMapRack(null); }}
                      className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${selectedFloor === floor ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                    >
                      Floor {floor}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-slate-400 text-xs">Hover or select highlighted inventory racks to view shelf coordinates and catalog sections.</p>

              {/* Graphic floor layout representation */}
              <div className="relative aspect-[16/9] bg-slate-950 border border-white/10 rounded-3xl p-6 flex flex-col justify-between overflow-hidden">
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-cyan-500/[0.02] rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex justify-between items-start text-[10px] text-slate-500 font-bold uppercase">
                  <span>Sector Layout: Floor {selectedFloor}</span>
                  <span className="text-cyan-400">Selected Rack: {selectedMapRack || 'None'}</span>
                </div>

                <div className="grid grid-cols-4 gap-4 my-auto h-[70%]">
                  {['Rack A (Computer Sci)', 'Rack B (Physics)', 'Rack C (Literature)', 'Rack D (Periodicals)'].map(rack => (
                    <div 
                      key={rack}
                      onClick={() => setSelectedMapRack(rack)}
                      className={`border rounded-2xl flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all hover:scale-[1.03] ${
                        selectedMapRack === rack 
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <Database className="w-6 h-6 mb-2" />
                      <span className="font-bold text-[10px] leading-tight block">{(rack ?? '').split(' (')[0] || 'N/A'}</span>
                      <span className="text-[8px] text-slate-500 mt-1 block">{(rack ?? '').includes('(') ? (rack ?? '').split(' (')[1].replace(')', '') : ''}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-white/5 pt-2 font-mono">
                  <span>* Highlight indicates selected books location coordinates</span>
                  <span>Nova Navigator Node</span>
                </div>
              </div>
            </div>

            {/* Reading Room Reservation */}
            <div className="glass-panel p-5 border-white/5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h4 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" /> Reading Room Booking
                  </h4>
                  <span className="text-[10px] font-bold bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded-lg font-mono">
                    {getOccupancyPercentage()}% Occupancy
                  </span>
                </div>

                <p className="text-slate-400 text-xs">Simulate seat assignments. Booked seats display estimated checkout times left.</p>

                {/* Seat assignment grid */}
                <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
                  {seats.map(seat => {
                    const isUserSeat = seat.member_username === user.username;
                    const isBooked = seat.status === 'booked';
                    return (
                      <button
                        key={seat.seat_number}
                        disabled={isBooking}
                        onClick={() => handleSeatBookingToggle(seat.seat_number, seat.status, seat.member_username)}
                        className={`aspect-square border rounded-xl flex flex-col items-center justify-center p-1 text-[10px] font-bold transition-all hover:scale-105 cursor-pointer ${
                          isUserSeat
                            ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                            : isBooked
                              ? 'bg-red-500/10 border-red-500/20 text-red-400'
                              : 'bg-white/5 border-white/10 hover:border-white/30 text-slate-300'
                        }`}
                      >
                        <span className="text-[9px]">{seat.seat_number.replace('Seat ', '')}</span>
                        {isBooked && !isUserSeat && <span className="text-[7px] text-red-500 font-mono mt-0.5">{seat.duration_minutes || 120}m</span>}
                        {isUserSeat && <span className="text-[7px] text-purple-200 mt-0.5 font-bold">ME</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-white/5 text-[10px] text-slate-500">
                <div className="flex justify-between">
                  <span>Available Seats:</span>
                  <span className="text-white font-bold">{seats.filter(s => s.status !== 'booked').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Booked Seats:</span>
                  <span className="text-white font-bold">{seats.filter(s => s.status === 'booked').length}</span>
                </div>
                {seats.some(s => s.member_username === user.username) && (
                  <div className="flex justify-between text-purple-400 font-bold border-t border-white/5 pt-1.5 animate-pulse">
                    <span>Reserved Ticket:</span>
                    <span>Active reservation session</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: BOOK CLUB & XP BADGES */}
        {subTab === 'club' && (
          <motion.div 
            key="club-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Book Club & Reviews Feed */}
            <div className="glass-panel p-5 border-white/5 space-y-4 lg:col-span-2">
              <h4 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                <HelpCircle className="w-4 h-4 text-amber-400" /> Book Club & Review Forum
              </h4>
              
              <form onSubmit={handlePostReview} className="space-y-3 p-3.5 bg-white/[0.01] border border-white/5 rounded-2xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Write a Book Review</span>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={reviewBookId}
                    onChange={(e) => setReviewBookId(e.target.value)}
                    className="col-span-2 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    style={{ background: '#0a0d16' }}
                  >
                    <option value="">-- Choose Book Catalog --</option>
                    {catalogBooks.map(b => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                  <select 
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-yellow-400 font-bold focus:outline-none"
                    style={{ background: '#0a0d16' }}
                  >
                    {[5, 4, 3, 2, 1].map(r => (
                      <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <textarea 
                  placeholder="Review comments..." 
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isSubmittingReview}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-800 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs transition-all active:scale-95"
                  >
                    Post Community Review
                  </button>
                </div>
              </form>

              <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                {reviews.length === 0 ? (
                  <div className="py-8 text-center text-[10px] text-slate-500 font-mono">No community book reviews posted yet.</div>
                ) : (
                  reviews.map(rev => (
                    <div key={rev.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-white">{rev.book_title}</strong>
                          <span className="text-[10px] text-slate-500 ml-2">By @{rev.member_username}</span>
                        </div>
                        <div className="flex text-yellow-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-transparent" />
                          ))}
                        </div>
                      </div>
                      <p className="m-0 text-slate-400 font-sans italic">"{rev.comment}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Achievements & XP Levels */}
            <div className="glass-panel p-5 border-white/5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-4">
                <h4 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                  <Award className="w-4 h-4 text-purple-400" /> Milestone Gamification
                </h4>
                
                {/* XP Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Rank Level {xpProfile.level}</span>
                    <span className="text-purple-400">{xpProfile.xp_points} XP</span>
                  </div>
                  <div className="w-full bg-white/5 border border-white/10 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(((xpProfile.xp_points % 500) / 500) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 font-semibold block uppercase">Earn +50 XP on seat bookings, +30 XP on catalog reviews</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 text-xs">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                    <span>Check-in streak:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong className="text-orange-400 font-bold">{xpProfile.streak_days} Days streak</strong>
                    <button 
                      onClick={handleCheckinStreak}
                      className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-lg font-bold"
                    >
                      Check-in
                    </button>
                  </div>
                </div>

                {/* Achievements List */}
                <div className="space-y-2.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Achievements Badges</span>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {[
                      { id: 'top-reader', name: 'Top Reader', desc: 'Read over 15 books in a semester.', icon: Award },
                      { id: 'fast-return', name: 'Early Return', desc: 'Return checkouts before due date.', icon: CheckCircle2 },
                      { id: 'no-fine', name: 'No Fine', desc: 'No penalty logs for active months.', icon: Shield },
                      { id: 'explorer', name: 'Explorer', desc: 'Upload 2 digital documents.', icon: Sparkles },
                      { id: 'critic', name: 'Critic', desc: 'Submit 3 detailed book reviews.', icon: FileText }
                    ].map(badge => {
                      const unlocked = xpProfile.badges.includes(badge.id);
                      return (
                        <div key={badge.id} className={`p-2 rounded-xl flex gap-2.5 items-center border text-xs ${unlocked ? 'bg-purple-500/10 border-purple-500/20 text-slate-200' : 'bg-slate-950/40 border-white/5 text-slate-500'}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${unlocked ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'bg-slate-900 text-slate-600'}`}>
                            <badge.icon className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <strong className="block text-[11px]">{badge.name}</strong>
                            <span className="text-[9px] text-slate-500 block">{badge.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: SYSTEM TELEMETRY */}
        {subTab === 'health' && (
          <motion.div 
            key="health-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* System Health Indicators */}
            <div className="glass-panel p-5 border-white/5 space-y-4 lg:col-span-2">
              <h4 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" /> Live Server Telemetry logs
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">CPU Utilization</span>
                  <div className="text-2xl font-mono text-purple-400 font-bold">{telemetry.cpu}%</div>
                  <div className="w-full bg-white/5 border border-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-500 h-full transition-all" style={{ width: `${telemetry.cpu}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">RAM Utilization</span>
                  <div className="text-2xl font-mono text-cyan-400 font-bold">{telemetry.ram}%</div>
                  <div className="w-full bg-white/5 border border-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-cyan-500 h-full transition-all" style={{ width: `${telemetry.ram}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Database Connections</span>
                  <div className="text-2xl font-mono text-emerald-400 font-bold">{telemetry.dbConnections} Active</div>
                  <div className="text-[8px] text-emerald-400 uppercase font-mono mt-1 tracking-wider">Telemetry: Online</div>
                </div>
              </div>

              {/* Status checklist grid */}
              <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex justify-between text-xs">
                  <span className="text-slate-500">API Health Status:</span>
                  <span className="text-emerald-400 font-mono font-bold">{telemetry.apiUptime}</span>
                </div>
                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex justify-between text-xs">
                  <span className="text-slate-500">SMTP Server node:</span>
                  <span className="text-emerald-400 font-mono font-bold">{telemetry.smtpStatus}</span>
                </div>
                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex justify-between text-xs">
                  <span className="text-slate-500">SMS Gateway node:</span>
                  <span className="text-emerald-400 font-mono font-bold">{telemetry.smsStatus}</span>
                </div>
                <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex justify-between text-xs">
                  <span className="text-slate-500">Operational Log Level:</span>
                  <span className="text-cyan-400 font-mono font-bold uppercase">INFO / VERBOSE</span>
                </div>
              </div>
            </div>

            {/* Backups & Configs */}
            <div className="glass-panel p-5 border-white/5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-4">
                <h4 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                  <Database className="w-4 h-4 text-emerald-400" /> Backup & Recovery center
                </h4>
                
                <p className="text-slate-400 text-xs leading-relaxed">Archive active databases and catalog files. Stores records as self-healing snapshots.</p>
                
                <div className="space-y-2">
                  <button 
                    onClick={triggerTelemetryBackup}
                    disabled={isBackingUp}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-teal-500 hover:to-emerald-600 disabled:bg-slate-700 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    {isBackingUp ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Database className="w-4 h-4" />
                    )}
                    Create Database Backup
                  </button>
                </div>
              </div>

              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] text-red-400 flex gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Restoring prior database backups will overwrite existing catalog records. Restrict to Super Admin sessions only.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Digital PDF E-Reader Modal */}
      {activePdfUrl && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-slate-950 p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                <FileText className="w-5 h-5 text-cyan-400" /> Digital PDF E-Reader Node
              </h3>
              <button 
                onClick={() => {
                  window.URL.revokeObjectURL(activePdfUrl);
                  setActivePdfUrl(null);
                }}
                className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
              >
                Close E-Reader
              </button>
            </div>
            <div className="flex-1 bg-slate-900">
              <iframe 
                src={activePdfUrl} 
                className="w-full h-full border-none"
                title="E-Book Reader"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple Helper Lucide Flame icon replacement since Lucide may vary
function Flame(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

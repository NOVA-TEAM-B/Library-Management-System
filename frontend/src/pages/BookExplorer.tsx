import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Star, TrendingUp, Bookmark, Calendar, ArrowRight, Eye, 
  Search, SlidersHorizontal, CheckCircle2, AlertCircle, X, Award, Info
} from 'lucide-react';
import PdfReaderModal from '../components/PdfReaderModal';


interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  isbn: string;
  availability: boolean;
  quantity: number;
  cover_url: string;
  rating: number;
  popularity: number;
  ai_recommendation_score: number;
  publisher?: string;
  edition?: string;
  rack_number?: string;
  shelf_number?: string;
  floor?: string;
  library_branch?: string;
  lost_copies?: number;
  damaged_copies?: number;
  repair_copies?: number;
  replacement_cost?: number;
  subject?: string; // used for language
  accession_number?: string;
  is_digital?: boolean;
  pdf_url?: string;
}

export default function BookExplorer() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Active checkouts & PDF modal states (NEW)
  const [activeCheckouts, setActiveCheckouts] = useState<any[]>([]);
  const [activePdfBook, setActivePdfBook] = useState<Book | null>(null);
  const [pdfInitialPage, setPdfInitialPage] = useState<number>(1);


  // User roles check
  const storedUser = localStorage.getItem('nova_user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isStaff = user && (user.role === 'admin' || user.role === 'librarian');
  const isMember = user && user.role === 'member';

  const activeCheckout = selectedBook ? activeCheckouts.find(c => c.book_id === selectedBook.id) : null;
  const isBorrowed = !!activeCheckout;
  const hasPdf = selectedBook ? !!selectedBook.pdf_url : false;


  // Add / Edit Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formBook, setFormBook] = useState({
    title: '',
    author: '',
    category: '',
    isbn: '',
    cover_url: '',
    quantity: 1,
    publisher: '',
    edition: '',
    rack_number: '',
    shelf_number: '',
    floor: '',
    library_branch: '',
    lost_copies: 0,
    damaged_copies: 0,
    repair_copies: 0,
    replacement_cost: 0.0,
    subject: 'English', // used for language
    accession_number: ''
  });

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'out'>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [publisherFilter, setPublisherFilter] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [minAiScore, setMinAiScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'ai_score' | 'rating' | 'popularity' | 'title' | 'publisher' | 'edition'>('ai_score');
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');


  const fetchActiveCheckouts = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      if (!token) return;
      const res = await fetch('http://127.0.0.1:5000/api/issues?status=issued', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCheckouts(data);
      }
    } catch (err) {
      console.error("Failed to load active checkouts: ", err);
    }
  };

  const fetchBooks = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/books');
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to load books');
      setBooks(data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchActiveCheckouts();

    // Listen to local progress syncs
    const handleLocalSync = () => {
      fetchActiveCheckouts();
    };
    window.addEventListener('nova_sync_local', handleLocalSync);
    
    // Listen to websocket sync events
    const handleGlobalSync = () => {
      fetchBooks();
      fetchActiveCheckouts();
    };
    window.addEventListener('nova_sync', handleGlobalSync);

    return () => {
      window.removeEventListener('nova_sync_local', handleLocalSync);
      window.removeEventListener('nova_sync', handleGlobalSync);
    };
  }, []);

  const handleBorrow = async (bookId: number) => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      if (!user) {
        if (window.showToast) window.showToast("Please log in to borrow books.", "warning");
        return;
      }
      const res = await fetch('http://127.0.0.1:5000/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          book_id: bookId,
          member_id: user.id,
          due_days: 14
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to borrow book");
      if (window.showToast) {
        window.showToast(`Book borrowed successfully!`, "success");
      } else {
        alert(data.msg);
      }
      fetchBooks();
      fetchActiveCheckouts();
      // If selecting a book, update the display
      if (selectedBook && selectedBook.id === bookId) {
        setSelectedBook(prev => prev ? { ...prev, quantity: prev.quantity - 1 } : null);
      }
    } catch (err: any) {
      if (window.showToast) {
        window.showToast(err.message, "error");
      } else {
        alert(err.message);
      }
    }
  };

  const handleReturn = async (issueId: number) => {
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
        window.showToast(`Book returned successfully!`, "success");
      } else {
        alert("Book returned successfully");
      }
      fetchBooks();
      fetchActiveCheckouts();
      // Update selected book preview count
      if (selectedBook) {
        const updated = books.find(b => b.id === selectedBook.id);
        if (updated) {
          setSelectedBook({ ...selectedBook, quantity: updated.quantity + 1, availability: true });
        }
      }
    } catch (err: any) {
      if (window.showToast) {
        window.showToast(err.message, "error");
      } else {
        alert(err.message);
      }
    }
  };

  const handleReserve = async (bookId: number) => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/books/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ book_id: bookId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Reservation failed');
      
      if (window.showToast) {
        window.showToast(data.msg, "success");
      } else {
        alert(data.msg);
      }
      fetchBooks();
    } catch (err: any) {
      if (window.showToast) {
        window.showToast(err.message, "error");
      } else {
        alert(err.message);
      }
    }
  };


  // Admin and Staff Book Management CRUD Handlers
  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setFormBook({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      cover_url: book.cover_url || '',
      quantity: book.quantity || 1,
      publisher: book.publisher || '',
      edition: book.edition || '',
      rack_number: book.rack_number || '',
      shelf_number: book.shelf_number || '',
      floor: book.floor || '',
      library_branch: book.library_branch || '',
      lost_copies: book.lost_copies || 0,
      damaged_copies: book.damaged_copies || 0,
      repair_copies: book.repair_copies || 0,
      replacement_cost: book.replacement_cost || 0.0,
      subject: book.subject || 'English', // Language field
      accession_number: book.accession_number || ''
    });
    setShowFormModal(true);
  };

  const handleCreateBook = () => {
    setEditingBook(null);
    setFormBook({
      title: '',
      author: '',
      category: '',
      isbn: '',
      cover_url: '',
      quantity: 1,
      publisher: '',
      edition: '',
      rack_number: '',
      shelf_number: '',
      floor: '',
      library_branch: '',
      lost_copies: 0,
      damaged_copies: 0,
      repair_copies: 0,
      replacement_cost: 0.0,
      subject: 'English',
      accession_number: ''
    });
    setShowFormModal(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const url = editingBook 
        ? `http://127.0.0.1:5000/api/books/${editingBook.id}`
        : `http://127.0.0.1:5000/api/books`;
      const method = editingBook ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formBook)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Save failed');
      alert(editingBook ? 'Book details updated successfully' : 'Book added successfully');
      setShowFormModal(false);
      fetchBooks();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteBook = async (bookId: number) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/books/${bookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Deletion failed');
      alert('Book deleted successfully');
      fetchBooks();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Extract metadata lists dynamically
  const categoriesList = Array.from(new Set(books.map(b => b.category))).sort();
  const authorsList = Array.from(new Set(books.map(b => b.author))).sort();

  // Filter handlers
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleAuthorToggle = (author: string) => {
    setSelectedAuthors(prev =>
      prev.includes(author) ? prev.filter(a => a !== author) : [...prev, author]
    );
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedAuthors([]);
    setAvailabilityFilter('all');
    setLanguageFilter('all');
    setPublisherFilter('');
    setMinRating(0);
    setMinAiScore(0);
    setSortBy('ai_score');
  };

  // Filter and Sort implementation
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = 
      selectedCategories.length === 0 || selectedCategories.includes(book.category);
      
    const matchesAuthor = 
      selectedAuthors.length === 0 || selectedAuthors.includes(book.author);
      
    const matchesAvailability = 
      availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && book.availability) ||
      (availabilityFilter === 'out' && !book.availability);

    const matchesLanguage = 
      languageFilter === 'all' ||
      (book.subject && book.subject.toLowerCase() === languageFilter.toLowerCase());

    const matchesPublisher = 
      !publisherFilter ||
      (book.publisher && book.publisher.toLowerCase().includes(publisherFilter.toLowerCase()));
      
    const matchesRating = book.rating >= minRating;
    const matchesAiScore = book.ai_recommendation_score >= minAiScore;

    return matchesSearch && matchesCategory && matchesAuthor && matchesAvailability && matchesLanguage && matchesPublisher && matchesRating && matchesAiScore;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'ai_score') return b.ai_recommendation_score - a.ai_recommendation_score;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'popularity') return b.popularity - a.popularity;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'publisher') return (a.publisher || '').localeCompare(b.publisher || '');
    if (sortBy === 'edition') return (a.edition || '').localeCompare(b.edition || '');
    return 0;
  });


  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-white/50 tracking-wider">Syncing Knowledge Nodes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* AI Recommendation Banner */}
      <div className="glass-panel p-6 border-white/10 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900/60 flex items-center justify-between flex-wrap gap-4 relative overflow-hidden rounded-[24px]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -z-10" />
        
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" /> Custom AI Knowledge Feed
          </h3>
          <p className="text-white/60 text-xs mt-1">
            We've calculated catalog recommendations based on your departmental scorecards and academic trends.
          </p>
        </div>
        <button
          onClick={() => setSelectedBook(books[Math.floor(Math.random() * books.length)])}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          Generate Smart Pick <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Catalog Workspace Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-68 shrink-0 glass-panel p-5 border-white/10 bg-slate-900/30 rounded-[20px] space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" /> Filter Node
            </h4>
            <button 
              onClick={resetFilters}
              className="text-[10px] text-cyan-400 hover:underline cursor-pointer font-bold"
            >
              Reset All
            </button>
          </div>

          {/* Search bar */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wide">Search Catalog</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Title, author, ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
              />
              <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wide">Availability</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950/40 p-1 border border-white/5 rounded-xl text-[10px]">
              {(['all', 'available', 'out'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAvailabilityFilter(mode)}
                  className={`py-1.5 rounded-lg capitalize font-bold transition-all cursor-pointer ${availabilityFilter === mode ? 'bg-cyan-500 text-slate-950' : 'text-white/60 hover:text-white'}`}
                >
                  {mode === 'out' ? 'Out Stock' : mode}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wide block">Genre / Categories</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {categoriesList.map(cat => (
                <label key={cat} className="flex items-center gap-2 text-xs text-white/70 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => handleCategoryToggle(cat)}
                    className="rounded bg-slate-950 border-white/20 text-cyan-500 focus:ring-0"
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Authors */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wide block">Authors</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {authorsList.map(author => (
                <label key={author} className="flex items-center gap-2 text-xs text-white/70 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedAuthors.includes(author)}
                    onChange={() => handleAuthorToggle(author)}
                    className="rounded bg-slate-950 border-white/20 text-cyan-500 focus:ring-0"
                  />
                  <span className="truncate">{author}</span>
                </label>
              ))}
            </div>
          </div>

          {/* AI Score Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-wide">
              <span>Min AI Match Score</span>
              <span className="text-cyan-400 font-mono">{minAiScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="99"
              value={minAiScore}
              onChange={(e) => setMinAiScore(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Min Rating Stars */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-wide">
              <span>Min Book Rating</span>
              <span className="text-yellow-400 font-mono">{minRating.toFixed(1)}★</span>
            </div>
            <div className="flex gap-1.5 items-center justify-between">
              {[0, 3.5, 4.0, 4.5].map((stars) => (
                <button
                  key={stars}
                  type="button"
                  onClick={() => setMinRating(stars)}
                  className={`flex-1 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${minRating === stars ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' : 'bg-transparent border-white/10 text-white/50 hover:text-white'}`}
                >
                  {stars === 0 ? 'All' : `${stars}★`}
                </button>
              ))}
            </div>
          </div>
          {/* Publisher */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wide">Publisher</label>
            <input
              type="text"
              placeholder="Search publisher..."
              value={publisherFilter}
              onChange={(e) => setPublisherFilter(e.target.value)}
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wide">Language</label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              style={{ background: '#0b0f19' }}
            >
              <option value="all">All Languages</option>
              <option value="English">English</option>
              <option value="Japanese">Japanese</option>
              <option value="Spanish">Spanish</option>
              <option value="German">German</option>
              <option value="French">French</option>
            </select>
          </div>
        </aside>


        {/* Catalog Main Panel */}
        <main className="flex-1 w-full space-y-4">
          {/* Header Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-900/20 border border-white/5 p-4 rounded-xl">
            <span className="text-xs text-white/60">
              Showing <strong className="text-white">{sortedBooks.length}</strong> of{' '}
              <strong className="text-white">{books.length}</strong> records
            </span>

            <div className="flex items-center gap-3">
              {isStaff && (
                <button
                  onClick={handleCreateBook}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  + Add Book
                </button>
              )}
              {/* Sort selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-white/40">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="ai_score">AI Recommendation</option>
                  <option value="rating">User Rating</option>
                  <option value="popularity">Popularity</option>
                  <option value="title">Book Title</option>
                  <option value="publisher">Publisher</option>
                  <option value="edition">Edition</option>
                </select>
              </div>


              {/* View Selector toggler */}
              <div className="flex bg-slate-950 p-0.5 border border-white/10 rounded-lg text-[10px]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-cyan-500 text-slate-950' : 'text-white/60 hover:text-white'}`}
                >
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode('carousel')}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${viewMode === 'carousel' ? 'bg-cyan-500 text-slate-950' : 'text-white/60 hover:text-white'}`}
                >
                  Carousels
                </button>
              </div>
            </div>
          </div>

          {/* GRID DISPLAY MODE */}
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div
                key="grid-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {sortedBooks.map(book => (
                  <motion.div
                    layout
                    key={book.id}
                    className="glass-panel overflow-hidden border-white/10 group cursor-pointer hover:border-cyan-500/40 relative flex flex-col justify-between"
                  >
                    {/* Cover image area */}
                    <div className="relative aspect-3/4 bg-slate-950/40 overflow-hidden">
                      <img 
                        src={book.cover_url} 
                        className="w-full h-full object-cover group-hover:scale-105 duration-500" 
                        alt={book.title} 
                      />
                      
                      {/* Premium circular AI score badge */}
                      <div className="absolute top-2 left-2 bg-slate-950/85 backdrop-blur-md text-white px-2 py-1 rounded-xl border border-white/15 flex items-center gap-1.5 shadow-lg">
                        <div className="relative w-5 h-5 flex items-center justify-center">
                          {/* Circle path meter */}
                          <svg className="w-5 h-5 origin-center -rotate-90">
                            <circle cx="10" cy="10" r="8" className="stroke-white/10 fill-none" strokeWidth="1.5" />
                            <circle 
                              cx="10" 
                              cy="10" 
                              r="8" 
                              className="stroke-cyan-400 fill-none" 
                              strokeWidth="1.5" 
                              strokeDasharray={2 * Math.PI * 8}
                              strokeDashoffset={2 * Math.PI * 8 - (book.ai_recommendation_score / 100) * (2 * Math.PI * 8)}
                            />
                          </svg>
                          <Sparkles className="w-2.5 h-2.5 text-cyan-300 absolute inset-0 m-auto animate-pulse" />
                        </div>
                        <span className="text-[9px] font-extrabold tracking-wider">{book.ai_recommendation_score}% AI Match</span>
                      </div>

                      {/* Hover Actions Panel overlay */}
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-filter backdrop-blur-sm opacity-0 group-hover:opacity-100 duration-300 flex flex-col justify-center items-center p-3 gap-2">
                        {book.pdf_url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfInitialPage(1);
                              setActivePdfBook(book);
                            }}
                            className="w-10/12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-500 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all shadow-md shadow-emerald-500/10"
                          >
                            📖 Read PDF
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBook(book);
                          }}
                          className="w-10/12 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          👀 Preview
                        </button>
                        {(() => {
                          const itemCheckout = activeCheckouts.find(c => c.book_id === book.id && c.status !== 'returned');
                          if (itemCheckout) {
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReturn(itemCheckout.id);
                                }}
                                className="w-10/12 bg-gradient-to-r from-rose-500 to-red-600 hover:from-red-600 hover:to-rose-500 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 shadow-lg shadow-rose-500/10 cursor-pointer"
                              >
                                ↩ Return Book
                              </button>
                            );
                          }
                          return isStaff ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditBook(book);
                                }}
                                className="w-10/12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                Edit Catalog
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBook(book.id);
                                }}
                                className="w-10/12 bg-red-600 hover:bg-red-500 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                Delete Book
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReserve(book.id);
                              }}
                              className="w-10/12 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                            >
                              📚 Reserve
                            </button>
                          );
                        })()}
                      </div>

                    </div>

                    {/* Metadata description area */}
                    <div className="p-3 bg-slate-950/20 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] font-bold text-cyan-400/80 tracking-widest uppercase block mb-0.5">{book.category}</span>
                        <h6 className="text-white text-xs font-bold truncate m-0 leading-tight group-hover:text-cyan-400 transition-colors" title={book.title}>{book.title}</h6>
                        <span className="text-[10px] text-white/50 truncate block mt-0.5">By {book.author}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                        <div className="flex items-center text-yellow-400 gap-0.5 text-[9px] font-bold">
                          <Star className="w-3 h-3 fill-yellow-400 text-transparent" />
                          <span>{book.rating.toFixed(1)}</span>
                        </div>
                        
                        {/* Availability Tag */}
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                          book.availability 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {book.availability ? `Available (${book.quantity})` : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {sortedBooks.length === 0 && (
                  <div className="col-span-full py-16 text-center space-y-2.5">
                    <AlertCircle className="w-8 h-8 text-white/20 mx-auto" />
                    <h5 className="text-sm font-semibold text-white/80">No matching titles found</h5>
                    <p className="text-xs text-white/40 max-w-xs mx-auto">Try resetting or modifying filter criteria on the sidebar.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              /* CAROUSEL ROWS VIEW */
              <motion.div
                key="carousel-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {categoriesList.map(cat => {
                  const catBooks = sortedBooks.filter(b => b.category === cat);
                  if (catBooks.length === 0) return null;
                  
                  return (
                    <div key={cat} className="space-y-3">
                      <h4 className="text-white font-bold text-sm tracking-wide border-l-4 border-cyan-400 pl-3 uppercase">{cat}</h4>
                      
                      {/* Carousel Row */}
                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {catBooks.map(book => (
                          <div
                            key={book.id}
                            className="flex-shrink-0 w-44 glass-panel overflow-hidden border-white/10 group cursor-pointer hover:border-cyan-500/40 relative flex flex-col justify-between"
                          >
                            <div className="relative h-56 bg-slate-950/40 overflow-hidden">
                              <img src={book.cover_url} className="w-full h-full object-cover group-hover:scale-105 duration-300" alt={book.title} />
                              
                              {/* Premium circular AI score badge */}
                              <div className="absolute top-2 left-2 bg-slate-950/85 backdrop-blur-md text-white px-2 py-0.5 rounded-lg border border-white/15 flex items-center gap-1.5 shadow-lg">
                                <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
                                <span className="text-[9px] font-extrabold tracking-wider">{book.ai_recommendation_score}% AI Match</span>
                              </div>

                                {/* Hover Actions Panel overlay */}
                                <div className="absolute inset-0 bg-slate-950/80 backdrop-filter backdrop-blur-sm opacity-0 group-hover:opacity-100 duration-300 flex flex-col justify-center items-center p-3 gap-2">
                                  {book.pdf_url && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPdfInitialPage(1);
                                        setActivePdfBook(book);
                                      }}
                                      className="w-10/12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-500 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all shadow-md shadow-emerald-500/10"
                                    >
                                      📖 Read PDF
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBook(book);
                                    }}
                                    className="w-10/12 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    👀 Preview
                                  </button>
                                  {(() => {
                                    const itemCheckout = activeCheckouts.find(c => c.book_id === book.id && c.status !== 'returned');
                                    if (itemCheckout) {
                                      return (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleReturn(itemCheckout.id);
                                          }}
                                          className="w-10/12 bg-gradient-to-r from-rose-500 to-red-600 hover:from-red-600 hover:to-rose-500 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 shadow-lg shadow-rose-500/10 cursor-pointer"
                                        >
                                          ↩ Return Book
                                        </button>
                                      );
                                    }
                                    return isStaff ? (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditBook(book);
                                          }}
                                          className="w-10/12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteBook(book.id);
                                          }}
                                          className="w-10/12 bg-red-600 hover:bg-red-500 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                                        >
                                          Delete
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReserve(book.id);
                                        }}
                                        className="w-10/12 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                                      >
                                        📚 Reserve
                                      </button>
                                    );
                                  })()}
                                </div>

                            </div>

                            <div className="p-3 flex-1 flex flex-col justify-between">
                              <div>
                                <h6 className="text-white text-xs font-bold truncate m-0 leading-tight group-hover:text-cyan-400 transition-colors">{book.title}</h6>
                                <span className="text-[10px] text-white/50 truncate block mt-0.5">{book.author}</span>
                              </div>
                              
                              <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                                <div className="flex items-center text-yellow-400 gap-0.5 text-[9px] font-bold">
                                  <Star className="w-3 h-3 fill-yellow-400 text-transparent" />
                                  <span>{book.rating.toFixed(1)}</span>
                                </div>
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                                  book.availability 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                  {book.availability ? `Avail (${book.quantity})` : 'Out Stock'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* DETAILED BOOK PREVIEW MODAL */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-filter backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="glass-panel w-full max-w-2xl border-white/20 p-6 relative bg-gradient-to-br from-slate-900 to-indigo-950/90 rounded-[24px] shadow-2xl"
            >
              <button
                onClick={() => setSelectedBook(null)}
                className="absolute top-4 right-4 text-white/50 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col md:flex-row gap-6 mt-2">
                <div className="flex flex-col gap-4 items-center shrink-0">
                  <img 
                    src={selectedBook.cover_url} 
                    className="w-48 h-72 object-cover rounded-2xl shadow-2xl border border-white/10 mx-auto md:mx-0" 
                    alt={selectedBook.title} 
                  />
                  <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-white/5 flex flex-col items-center gap-1.5">
                    {/* Inline QR Code Generator SVG */}
                    {(() => {
                      const cells = [];
                      const seed = selectedBook.isbn || "978-0131103628";
                      cells.push(<rect key="tl-out" x={2} y={2} width={8} height={8} fill="currentColor" />);
                      cells.push(<rect key="tl-in" x={3.5} y={3.5} width={5} height={5} fill="none" stroke="currentColor" strokeWidth="1.5" />);
                      cells.push(<rect key="tr-out" x={22} y={2} width={8} height={8} fill="currentColor" />);
                      cells.push(<rect key="tr-in" x={23.5} y={3.5} width={5} height={5} fill="none" stroke="currentColor" strokeWidth="1.5" />);
                      cells.push(<rect key="bl-out" x={2} y={22} width={8} height={8} fill="currentColor" />);
                      cells.push(<rect key="bl-in" x={3.5} y={23.5} width={5} height={5} fill="none" stroke="currentColor" strokeWidth="1.5" />);
                      let idx = 0;
                      for (let r = 0; r < 8; r++) {
                        for (let c = 0; c < 8; c++) {
                          const isFinder = (r < 3 && c < 3) || (r < 3 && c > 4) || (r > 4 && c < 3);
                          if (!isFinder) {
                            const charVal = seed.charCodeAt(idx % seed.length);
                            if ((charVal + r * c * 5) % 2 === 0) {
                              cells.push(<rect key={`dot-${r}-${c}`} x={2 + c * 3.5} y={2 + r * 3.5} width={2.5} height={2.5} fill="currentColor" />);
                            }
                            idx++;
                          }
                        }
                      }
                      return (
                        <svg className="w-20 h-20 text-white" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                          {cells}
                        </svg>
                      );
                    })()}
                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-mono">ISBN QR Node</span>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-[9px] px-2.5 py-1 rounded-xl uppercase tracking-wider">
                        {selectedBook.category}
                      </span>
                      {selectedBook.quantity === 0 && (
                        <span className="bg-rose-500/15 border border-rose-500/25 text-rose-400 font-bold text-[9px] px-2.5 py-1 rounded-xl uppercase tracking-wider">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-extrabold text-white mt-2.5 mb-1 leading-snug">{selectedBook.title}</h3>
                    <span className="text-xs text-white/60">By {selectedBook.author}</span>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 text-[10px] border-y border-white/5 py-3.5">
                      <div className="space-y-0.5">
                        <span className="text-white/40 block text-[8px] uppercase font-bold tracking-wider">ISBN</span>
                        <strong className="text-white font-mono">{selectedBook.isbn}</strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-white/40 block text-[8px] uppercase font-bold tracking-wider">Publisher</span>
                        <strong className="text-white">{selectedBook.publisher || 'Nova Publishing Group'}</strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-white/40 block text-[8px] uppercase font-bold tracking-wider">Edition / Language</span>
                        <strong className="text-white">{selectedBook.edition || '1st Edition'} ({selectedBook.subject || 'English'})</strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-white/40 block text-[8px] uppercase font-bold tracking-wider">Shelf Location</span>
                        <strong className="text-cyan-400">Floor {selectedBook.floor || '1'}, Rack {selectedBook.rack_number || 'A'}, Shelf {selectedBook.shelf_number || '3'}</strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-white/40 block text-[8px] uppercase font-bold tracking-wider">Damaged / Lost Copies</span>
                        <strong className="text-white">Lost: {selectedBook.lost_copies || 0} | Damaged: {selectedBook.damaged_copies || 0} | Repair: {selectedBook.repair_copies || 0}</strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-white/40 block text-[8px] uppercase font-bold tracking-wider">Telemetry Score</span>
                        <strong className="text-cyan-400 font-bold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                          <span>{selectedBook.ai_recommendation_score}% AI Match</span>
                        </strong>
                      </div>
                    </div>

                    <div className="mt-4 flex items-start gap-2 bg-slate-950/40 p-3 rounded-xl border border-white/5 text-[11px] text-white/60">
                      <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>This catalog entity tracks shelf nodes and physical conditions dynamically. Scan the QR code at checkout desk to log transactions.</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-6 w-full">
                    {isBorrowed ? (
                      <>
                        {hasPdf && (
                          <button
                            onClick={() => {
                              setPdfInitialPage(activeCheckout.current_page || 1);
                              setActivePdfBook(selectedBook);
                              setSelectedBook(null);
                            }}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
                          >
                            <i className="fas fa-book-open"></i> Read Book
                          </button>
                        )}
                        <button
                          onClick={() => handleReturn(activeCheckout.id)}
                          className="flex-1 bg-gradient-to-r from-rose-500 to-red-600 hover:from-red-600 hover:to-rose-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/10 cursor-pointer"
                        >
                          <i className="fas fa-undo"></i> Return Book
                        </button>
                      </>
                    ) : selectedBook.is_digital ? (
                      <>
                        {hasPdf ? (
                          <button
                            onClick={() => {
                              setPdfInitialPage(1);
                              setActivePdfBook(selectedBook);
                              setSelectedBook(null);
                            }}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
                          >
                            <i className="fas fa-book-open"></i> Read Book
                          </button>
                        ) : (
                          <button
                            disabled
                            className="flex-1 bg-white/5 border border-white/10 text-white/40 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                          >
                            <i className="fas fa-book-open"></i> Read (Unavailable)
                          </button>
                        )}
                        {isMember && (
                          <button
                            onClick={() => handleReserve(selectedBook.id)}
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Bookmark className="w-4 h-4" /> Reserve Title
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {isMember && selectedBook.quantity > 0 && (
                          <button
                            onClick={() => handleBorrow(selectedBook.id)}
                            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10 cursor-pointer"
                          >
                            <i className="fas fa-hand-holding-hand"></i> Borrow Book
                          </button>
                        )}
                        {isMember && (
                          <button
                            onClick={() => handleReserve(selectedBook.id)}
                            className={`flex-1 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${selectedBook.quantity === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/10' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'}`}
                          >
                            <Bookmark className="w-4 h-4" /> Reserve Title
                          </button>
                        )}
                      </>
                    )}
                    
                    <button
                      onClick={() => setSelectedBook(null)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 text-xs text-white rounded-xl font-semibold transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD / EDIT BOOK MODAL */}
      <AnimatePresence>
        {showFormModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-filter backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="glass-panel w-full max-w-2xl border-white/20 p-6 relative bg-gradient-to-br from-slate-900 to-indigo-950/90 rounded-[24px] shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-white mb-4">
                {editingBook ? 'Edit Book Details' : 'Add New Book to Catalog'}
              </h3>

              <form onSubmit={handleSaveBook} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Book Title *</label>
                    <input
                      type="text"
                      required
                      value={formBook.title}
                      onChange={(e) => setFormBook({ ...formBook, title: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Author *</label>
                    <input
                      type="text"
                      required
                      value={formBook.author}
                      onChange={(e) => setFormBook({ ...formBook, author: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">ISBN Reference *</label>
                    <input
                      type="text"
                      required
                      value={formBook.isbn}
                      onChange={(e) => setFormBook({ ...formBook, isbn: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Genre / Category *</label>
                    <input
                      type="text"
                      required
                      value={formBook.category}
                      onChange={(e) => setFormBook({ ...formBook, category: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Publisher</label>
                    <input
                      type="text"
                      value={formBook.publisher}
                      onChange={(e) => setFormBook({ ...formBook, publisher: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Edition</label>
                    <input
                      type="text"
                      value={formBook.edition}
                      onChange={(e) => setFormBook({ ...formBook, edition: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Language</label>
                    <select
                      value={formBook.subject}
                      onChange={(e) => setFormBook({ ...formBook, subject: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                      style={{ background: '#0b0f19' }}
                    >
                      <option value="English">English</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Spanish">Spanish</option>
                      <option value="German">German</option>
                      <option value="French">French</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Floor</label>
                    <input
                      type="text"
                      value={formBook.floor}
                      onChange={(e) => setFormBook({ ...formBook, floor: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Rack No</label>
                    <input
                      type="text"
                      value={formBook.rack_number}
                      onChange={(e) => setFormBook({ ...formBook, rack_number: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Shelf No</label>
                    <input
                      type="text"
                      value={formBook.shelf_number}
                      onChange={(e) => setFormBook({ ...formBook, shelf_number: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Branch</label>
                    <input
                      type="text"
                      value={formBook.library_branch}
                      onChange={(e) => setFormBook({ ...formBook, library_branch: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Total Copies</label>
                    <input
                      type="number"
                      value={formBook.quantity}
                      onChange={(e) => setFormBook({ ...formBook, quantity: Number(e.target.value) })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Lost Copies</label>
                    <input
                      type="number"
                      value={formBook.lost_copies}
                      onChange={(e) => setFormBook({ ...formBook, lost_copies: Number(e.target.value) })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Damaged</label>
                    <input
                      type="number"
                      value={formBook.damaged_copies}
                      onChange={(e) => setFormBook({ ...formBook, damaged_copies: Number(e.target.value) })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Repair</label>
                    <input
                      type="number"
                      value={formBook.repair_copies}
                      onChange={(e) => setFormBook({ ...formBook, repair_copies: Number(e.target.value) })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Cover Image URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/cover.jpg"
                      value={formBook.cover_url}
                      onChange={(e) => setFormBook({ ...formBook, cover_url: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1 font-bold">Accession Number</label>
                    <input
                      type="text"
                      value={formBook.accession_number}
                      onChange={(e) => setFormBook({ ...formBook, accession_number: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    Save Catalog Node
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 text-white rounded-xl font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF.js custom reader room modal (NEW) */}
      {activePdfBook && (
        <PdfReaderModal 
          bookId={activePdfBook.id}
          bookTitle={activePdfBook.title}
          pdfUrl={activePdfBook.pdf_url || ''}
          initialPage={pdfInitialPage}
          onClose={() => {
            setActivePdfBook(null);
            fetchActiveCheckouts();
          }}
        />
      )}
    </div>
  );
}


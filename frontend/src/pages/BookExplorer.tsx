import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Star, TrendingUp, Bookmark, Calendar, ArrowRight, Eye, 
  Search, SlidersHorizontal, CheckCircle2, AlertCircle, X, Award, Info
} from 'lucide-react';

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
}

export default function BookExplorer() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'out'>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [minAiScore, setMinAiScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'ai_score' | 'rating' | 'popularity' | 'title'>('ai_score');
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');

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
  }, []);

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
      alert(data.msg);
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
      
    const matchesRating = book.rating >= minRating;
    const matchesAiScore = book.ai_recommendation_score >= minAiScore;

    return matchesSearch && matchesCategory && matchesAuthor && matchesAvailability && matchesRating && matchesAiScore;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'ai_score') return b.ai_recommendation_score - a.ai_recommendation_score;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'popularity') return b.popularity - a.popularity;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
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
                        <button
                          onClick={() => setSelectedBook(book)}
                          className="w-10/12 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview Book
                        </button>
                        <button
                          onClick={() => handleReserve(book.id)}
                          className="w-10/12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-500 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/10 cursor-pointer"
                        >
                          <Bookmark className="w-3.5 h-3.5" /> Reserve
                        </button>
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
                                <button
                                  onClick={() => setSelectedBook(book)}
                                  className="w-10/12 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Preview
                                </button>
                                <button
                                  onClick={() => handleReserve(book.id)}
                                  className="w-10/12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-500 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/10 cursor-pointer"
                                >
                                  <Bookmark className="w-3.5 h-3.5" /> Reserve
                                </button>
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
                <img 
                  src={selectedBook.cover_url} 
                  className="w-48 h-72 object-cover rounded-2xl shadow-2xl border border-white/10 mx-auto md:mx-0" 
                  alt="" 
                />
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-[9px] px-2.5 py-1 rounded-xl uppercase tracking-wider">
                      {selectedBook.category}
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-2.5 mb-1 leading-snug">{selectedBook.title}</h3>
                    <span className="text-xs text-white/60">By {selectedBook.author}</span>
                    
                    <div className="grid grid-cols-3 gap-3 mt-5 text-[11px] border-y border-white/5 py-3.5">
                      <div className="space-y-0.5">
                        <span className="text-white/40 block text-[9px] uppercase font-bold tracking-wider">ISBN</span>
                        <strong className="text-white font-mono">{selectedBook.isbn}</strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-white/40 block text-[9px] uppercase font-bold tracking-wider">Popularity</span>
                        <strong className="text-white">{selectedBook.popularity} readers</strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-white/40 block text-[9px] uppercase font-bold tracking-wider">AI Score Match</span>
                        <strong className="text-cyan-400 font-bold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                          <span>{selectedBook.ai_recommendation_score}% Match</span>
                        </strong>
                      </div>
                    </div>

                    <div className="mt-4 flex items-start gap-2 bg-slate-950/40 p-3 rounded-xl border border-white/5 text-[11px] text-white/60">
                      <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>This book matches academic interests in your department console. Borrow requests are queued automatically.</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => handleReserve(selectedBook.id)}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10 cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4" /> Settle Hold Request
                    </button>
                    <button
                      onClick={() => setSelectedBook(null)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 text-xs text-white rounded-xl font-semibold transition-colors cursor-pointer"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

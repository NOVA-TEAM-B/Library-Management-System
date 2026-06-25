import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Mic, Volume2, Sparkles, Star, Bookmark } from 'lucide-react';

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

export default function Search() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const performSearch = async () => {
    setLoading(true);
    let url = `http://127.0.0.1:5000/api/books?title=${encodeURIComponent(query)}&author=${encodeURIComponent(query)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (availability) url += `&availability=${encodeURIComponent(availability)}`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error('Search failed');
      setBooks(data);
      
      // Compute fuzzy search suggestions
      if (query.trim() && data.length > 0) {
        const titles = data.slice(0, 3).map((b: Book) => b.title);
        setSuggestions(titles);
      } else {
        setSuggestions([]);
      }
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch();
  }, [category, availability]);

  // Voice Search (Simulated or Web Speech API)
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Mock Voice Search
      setListening(true);
      setTimeout(() => {
        setQuery('Clean Code');
        setListening(false);
        performSearch();
      }, 2000);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e: any) => {
      const speech = e.results[0][0].transcript;
      setQuery(speech);
      performSearch();
    };

    rec.start();
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
      alert(data.msg);
      performSearch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Header Panel */}
      <div className="glass-panel p-5 border-white/10">
        <h4 className="text-white text-base font-semibold mb-3 flex items-center gap-2"><SearchIcon className="w-5 h-5 text-warning" /> Search Like Google</h4>
        
        {/* Search Bar & Voice Input */}
        <form onSubmit={(e) => { e.preventDefault(); performSearch(); }} className="relative mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, authors, isbn catalog..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-24 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
          />
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/40"><SearchIcon className="w-5 h-5" /></span>
          
          <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={startVoiceSearch}
              className={`p-2 rounded-xl border border-white/10 text-white/60 hover:text-white transition-all flex items-center justify-center ${listening ? 'bg-red-600 animate-ping text-white' : 'bg-white/5 hover:bg-white/10'}`}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition-all shadow-md"
            >
              Search
            </button>
          </div>
        </form>

        {/* Suggestion list */}
        {suggestions.length > 0 && (
          <div className="flex gap-2 items-center flex-wrap pb-3 text-[10px] text-white/50 border-b border-white/5">
            <span>Fuzzy Suggestions:</span>
            {suggestions.map((sug, idx) => (
              <span
                key={idx}
                onClick={() => { setQuery(sug); performSearch(); }}
                className="bg-white/5 border border-white/10 hover:border-cyan-400 text-cyan-300 px-2 py-0.5 rounded-full cursor-pointer transition-all"
              >
                {sug}
              </span>
            ))}
          </div>
        )}

        {/* Advanced Filters */}
        <div className="row g-3 pt-3 border-t border-white/5">
          <div className="col-md-6">
            <label className="text-white/65 text-xs font-semibold block mb-1">Catalog Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              style={{ background: '#1e3b8a' }}
            >
              <option value="">All Categories</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Physics">Physics</option>
              <option value="Literature">Literature</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="text-white/65 text-xs font-semibold block mb-1">Availability Status</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              style={{ background: '#1e3b8a' }}
            >
              <option value="">All Statuses</option>
              <option value="true">In Stock (Available)</option>
              <option value="false">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* SEARCH RESULTS LIST */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {books.length === 0 ? (
            <div className="col-span-full text-center text-white/50 p-10 glass-panel border-white/10">No books found matching search filters.</div>
          ) : (
            books.map(b => (
              <div key={b.id} className="glass-panel overflow-hidden border-white/10 flex flex-col justify-between hover:scale-[1.03] transition-all duration-300">
                <div className="relative h-48 bg-black/20 overflow-hidden">
                  <img src={b.cover_url} className="w-full h-full object-cover" alt="" />
                  <div className="absolute top-2 right-2 bg-purple-600/90 text-white font-bold text-[9px] px-2 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1 shadow-lg">
                    <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                    <span>{b.ai_recommendation_score}% Match</span>
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h5 className="text-white text-sm font-bold truncate leading-tight m-0">{b.title}</h5>
                    <span className="text-[10px] text-white/50 truncate block mt-0.5 mb-2">{b.author}</span>
                    
                    <div className="flex justify-between items-center text-[10px] text-white/50 border-t border-white/5 pt-2">
                      <div className="flex items-center text-yellow-400 gap-0.5 font-bold">
                        <Star className="w-3 h-3 fill-yellow-400 text-transparent" />
                        <span>{b.rating.toFixed(1)}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${b.availability ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>
                        {b.availability ? `Available (${b.quantity})` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleReserve(b.id)}
                    className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    <Bookmark className="w-3.5 h-3.5" /> Hold Reservation
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

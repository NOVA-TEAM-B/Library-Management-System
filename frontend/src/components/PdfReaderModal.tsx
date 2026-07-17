import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2, Minimize2, 
  Moon, Sun, Bookmark, BookmarkCheck, Search, Loader, RefreshCw
} from 'lucide-react';

interface PdfReaderModalProps {
  bookId: number;
  bookTitle: string;
  pdfUrl: string;
  onClose: () => void;
  initialPage?: number;
}

export default function PdfReaderModal({ bookId, bookTitle, pdfUrl, onClose, initialPage = 1 }: PdfReaderModalProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.25);
  const [loading, setLoading] = useState<boolean>(true);
  const [rendering, setRendering] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Bookmarks
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  
  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [searchIndex, setSearchIndex] = useState<number>(-1);
  const [searching, setSearching] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Initialize PDFJS and load document
  useEffect(() => {
    setLoading(true);
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) {
      console.error("PDF.js library not loaded from CDN.");
      return;
    }
    
    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    
    // Load local bookmarks
    const savedBookmarks = localStorage.getItem(`bookmarks_book_${bookId}`);
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }

    // Prepend backend URL if using relative static uploads path
    const resolvedUrl = pdfUrl.startsWith('/static/') ? `http://127.0.0.1:5000${pdfUrl}` : pdfUrl;

    const loadingTask = pdfjsLib.getDocument(resolvedUrl);
    loadingTask.promise.then(
      (pdf: any) => {
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setLoading(false);
        
        // Use saved page memory if available from initialPage prop
        if (initialPage > 0 && initialPage <= pdf.numPages) {
          setPageNumber(initialPage);
        }
      },
      (error: any) => {
        console.error("Error loading PDF: ", error);
        setLoading(false);
        if (window.showToast) {
          window.showToast("Could not load PDF file. Disabling reader.", "error");
        }
      }
    );

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfUrl, bookId, initialPage]);

  // Render canvas page when pageNumber, scale, or pdfDoc changes
  useEffect(() => {
    if (!pdfDoc || loading) return;
    renderPage(pageNumber);
  }, [pdfDoc, pageNumber, scale, loading]);

  const renderPage = (pageNum: number) => {
    if (!pdfDoc) return;
    setRendering(true);

    pdfDoc.getPage(pageNum).then((page: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Cancel previous render task if active
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      renderTask.promise.then(
        () => {
          setRendering(false);
        },
        (err: any) => {
          if (err.name !== 'RenderingCancelledException') {
            console.error("Render task error: ", err);
            setRendering(false);
          }
        }
      );
    });
  };

  // Sync progress to backend
  const syncProgress = async (pageNum: number) => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      if (!token) return;

      const res = await fetch('http://127.0.0.1:5000/api/issues/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          book_id: bookId,
          current_page: pageNum,
          total_pages: numPages
        })
      });
      if (res.ok) {
        // Broadcast custom local sync event to other components (like ReadingHistory)
        window.dispatchEvent(new CustomEvent('nova_sync_local'));
      }
    } catch (e) {
      console.error("Failed to sync reading progress: ", e);
    }
  };

  // Trigger sync on page changes (debounced/delayed or on change)
  useEffect(() => {
    if (numPages > 0) {
      syncProgress(pageNumber);
    }
  }, [pageNumber, numPages]);

  // Fullscreen management
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Fullscreen error: ", err);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Bookmarks
  const toggleBookmark = () => {
    let updated: number[];
    if (bookmarks.includes(pageNumber)) {
      updated = bookmarks.filter(p => p !== pageNumber);
      if (window.showToast) window.showToast(`Removed bookmark for Page ${pageNumber}`, "info");
    } else {
      updated = [...bookmarks, pageNumber].sort((a, b) => a - b);
      if (window.showToast) window.showToast(`Bookmarked Page ${pageNumber}`, "success");
    }
    setBookmarks(updated);
    localStorage.setItem(`bookmarks_book_${bookId}`, JSON.stringify(updated));
  };

  // Search function inside PDF text
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !pdfDoc) return;

    setSearching(true);
    setSearchResults([]);
    setSearchIndex(-1);

    const matches: number[] = [];
    
    try {
      for (let p = 1; p <= numPages; p++) {
        const page = await pdfDoc.getPage(p);
        const textContent = await page.getTextContent();
        const textStr = textContent.items.map((item: any) => item.str).join(' ');
        
        if (textStr.toLowerCase().includes(searchQuery.toLowerCase())) {
          matches.push(p);
        }
      }

      setSearchResults(matches);
      if (matches.length > 0) {
        setSearchIndex(0);
        setPageNumber(matches[0]);
        if (window.showToast) window.showToast(`Found ${matches.length} matches. Displaying match 1.`, "success");
      } else {
        if (window.showToast) window.showToast("No matches found in the document.", "warning");
      }
    } catch (err) {
      console.error("Search failed: ", err);
    } finally {
      setSearching(false);
    }
  };

  const nextSearchResult = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (searchIndex + 1) % searchResults.length;
    setSearchIndex(nextIdx);
    setPageNumber(searchResults[nextIdx]);
  };

  const prevSearchResult = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (searchIndex - 1 + searchResults.length) % searchResults.length;
    setSearchIndex(prevIdx);
    setPageNumber(searchResults[prevIdx]);
  };

  const progressPercentage = numPages > 0 ? Math.min(100, Math.floor((pageNumber / numPages) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in">
      <div 
        ref={containerRef}
        id="pdf-reader-container"
        className="w-full max-w-5xl h-[92vh] glass-panel border-white/10 bg-[#0c101d] rounded-[24px] shadow-2xl flex flex-col overflow-hidden text-xs text-white"
      >
        {/* HEADER TOOLBAR */}
        <header className="px-5 py-3.5 border-b border-white/5 bg-slate-950/40 backdrop-blur-md flex justify-between items-center flex-wrap gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <i className="fas fa-book-open"></i>
            </div>
            <div>
              <h4 className="text-white font-extrabold text-xs m-0 truncate max-w-[200px] sm:max-w-[320px] uppercase tracking-wide" title={bookTitle}>
                {bookTitle}
              </h4>
              <span className="text-[9px] text-cyan-300 font-bold block tracking-widest mt-0.5">PDF VIEWER V2.0</span>
            </div>
          </div>

          {/* Search bar inside PDF */}
          <form onSubmit={handleSearch} className="flex items-center gap-1.5 bg-slate-900/60 border border-white/10 rounded-xl px-2.5 py-1.5 max-w-xs w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-white/40" />
            <input 
              type="text" 
              placeholder="Search text in document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-0 outline-none text-[10px] text-white placeholder-white/30 focus:ring-0 w-24 sm:w-36 font-sans"
            />
            {searching ? (
              <Loader className="w-3 h-3 text-cyan-400 animate-spin" />
            ) : searchResults.length > 0 ? (
              <div className="flex items-center gap-1 shrink-0 text-white/60">
                <span className="text-[8px] font-mono mr-1">
                  {searchIndex + 1}/{searchResults.length}
                </span>
                <button type="button" onClick={prevSearchResult} className="hover:text-white p-0.5 cursor-pointer">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button type="button" onClick={nextSearchResult} className="hover:text-white p-0.5 cursor-pointer">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ) : null}
          </form>

          {/* Top-Right widgets */}
          <div className="flex items-center gap-3">
            {/* Dark Mode toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Toggle Dark Contrast Mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Bookmark button */}
            <button 
              onClick={toggleBookmark}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Bookmark Page"
            >
              {bookmarks.includes(pageNumber) ? (
                <BookmarkCheck className="w-4 h-4 text-cyan-400" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            {/* Fullscreen button */}
            <button 
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close button */}
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all cursor-pointer"
              title="Close PDF Reader"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* READER VIEWPORT BODY */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* LEFT SIDEBAR: BOOKMARKS & JUMP LINKS */}
          {bookmarks.length > 0 && (
            <aside className="w-40 border-r border-white/5 bg-slate-950/20 backdrop-blur-md p-4 shrink-0 overflow-y-auto hidden md:block space-y-3">
              <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider block border-b border-white/5 pb-1 flex items-center gap-1">
                <Bookmark className="w-3 h-3 text-cyan-400" /> Bookmarks ({bookmarks.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {bookmarks.map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPageNumber(pageNum)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg border font-mono transition-all cursor-pointer hover:border-cyan-500/30 ${pageNumber === pageNum ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 font-bold' : 'bg-white/[0.01] border-white/5 text-white/60 hover:text-white'}`}
                  >
                    Page {pageNum}
                  </button>
                ))}
              </div>
            </aside>
          )}

          {/* MAIN PAGE CONTAINER WITH CANVAS */}
          <div className="flex-grow overflow-auto p-6 flex justify-center items-start bg-slate-900/10 relative">
            {loading ? (
              <div className="absolute inset-0 flex flex-col justify-center items-center gap-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="text-white/50 tracking-wider">Loading PDF document streams...</span>
              </div>
            ) : (
              <div className="relative shadow-2xl border border-white/10 rounded-lg overflow-hidden bg-white">
                <canvas 
                  ref={canvasRef} 
                  className={`block transition-all duration-300 ${darkMode ? 'invert-canvas' : ''}`}
                  style={{
                    filter: darkMode ? 'invert(0.9) hue-rotate(180deg)' : 'none'
                  }}
                />
                {rendering && (
                  <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-xs flex items-center justify-center">
                    <Loader className="w-6 h-6 text-cyan-400 animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM NAVIGATION CONTROL BAR */}
        <footer className="px-5 py-3 border-t border-white/5 bg-slate-950/40 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-3.5 shrink-0">
          
          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
              disabled={loading}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-[10px] text-cyan-400 font-bold min-w-[40px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button 
              onClick={() => setScale(s => Math.min(3.0, s + 0.25))}
              disabled={loading}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Page Navigation controls */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              disabled={loading || pageNumber <= 1}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-white/40">Page</span>
              <input 
                type="number" 
                min={1} 
                max={numPages || 1}
                value={pageNumber}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 1 && val <= numPages) {
                    setPageNumber(val);
                  }
                }}
                disabled={loading}
                className="w-12 bg-slate-950 border border-white/10 rounded-lg px-1.5 py-1 text-center font-mono text-white text-xs focus:outline-none focus:border-cyan-400 font-bold"
              />
              <span className="text-white/40">of</span>
              <span className="font-mono text-white font-bold">{numPages || 0}</span>
            </div>

            <button 
              onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
              disabled={loading || pageNumber >= numPages}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Reading progress bar */}
          <div className="flex items-center gap-3 w-full sm:w-44">
            <div className="flex-grow bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="font-mono text-[9px] text-white/50 tracking-wider min-w-[28px] text-right font-bold">
              {progressPercentage}%
            </span>
          </div>

        </footer>
      </div>
    </div>
  );
}

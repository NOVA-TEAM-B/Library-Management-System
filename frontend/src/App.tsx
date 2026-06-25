import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  Sparkles, Moon, Sun, Bell, LayoutDashboard, Search as SearchIcon, Users, 
  BookOpen, Bookmark, Calendar, FileText, Clock, Trophy, User, LogOut, 
  Menu, Building, Activity, Settings as SettingsIcon, ShieldAlert,
  ChevronLeft, ChevronRight, Search, Keyboard, Signal
} from 'lucide-react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BookExplorer from './pages/BookExplorer';
import MemberManagement from './pages/MemberManagement';
import IssueReturn from './pages/IssueReturn';
import Fines from './pages/Fines';
import Reports from './pages/Reports';
import ReadingHistory from './pages/ReadingHistory';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import AIAssistant from './components/AIAssistant';
import Home from './pages/Home';
import Organizations from './pages/Organizations';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthPortal, setShowAuthPortal] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [globalSearch, setGlobalSearch] = useState('');

  // 1. Live Running Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + D -> Dashboard
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setActiveTab('dashboard');
      }
      // Alt + B -> Book catalog
      if (e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setActiveTab('books');
      }
      // Alt + M -> Members (Admin/Librarian only)
      if (e.altKey && e.key.toLowerCase() === 'm' && user && (user.role === 'admin' || user.role === 'librarian')) {
        e.preventDefault();
        setActiveTab('members');
      }
      // Alt + L -> Logout
      if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleLogout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  // Check session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('nova_user');
    const token = localStorage.getItem('nova_jwt_token');
    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Auto redirect to role-specific dashboard by default
      setActiveTab('dashboard');
    }
  }, []);

  // WebSockets setup
  useEffect(() => {
    if (!user) return;

    const socket = io('http://127.0.0.1:5000');

    socket.on('connect', () => {
      console.log('Real-time WebSockets Connected');
    });

    socket.on('notification', (notif: any) => {
      setNotifications(prev => [notif, ...prev]);
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
        audio.volume = 0.2;
        audio.play();
      } catch (e) {}
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    // Role-specific redirect
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  // Helper to trigger global search filters in BookExplorer
  const executeGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      localStorage.setItem('nova_catalog_search', globalSearch);
      setActiveTab('books');
      window.dispatchEvent(new Event('nova_catalog_search_event'));
    }
  };

  if (!user) {
    if (showAuthPortal) {
      return <Login onLoginSuccess={handleLoginSuccess} onBack={() => setShowAuthPortal(false)} />;
    }
    return <Home onEnterPortal={() => setShowAuthPortal(true)} onLoginSuccess={handleLoginSuccess} />;
  }

  // Get localized role badge details
  const getRoleLabel = () => {
    if (user.role === 'superadmin') return 'Super Admin';
    if (user.role === 'admin') return 'Org Admin';
    if (user.role === 'librarian') return 'Librarian Staff';
    return 'Student Member';
  };

  const getDashboardLabel = () => {
    if (user.role === 'superadmin') return 'Super Admin Dashboard';
    if (user.role === 'admin') return 'Organization Dashboard';
    if (user.role === 'librarian') return 'Staff Dashboard';
    return 'Student Dashboard';
  };

  const getRoleColor = () => {
    if (user.role === 'superadmin') return 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30';
    if (user.role === 'admin') return 'from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/30';
    if (user.role === 'librarian') return 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30';
    return 'from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30';
  };

  return (
    <div className={`app-wrapper flex min-h-screen ${darkMode ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* SIDEBAR NAVIGATION - Premium Glassmorphic design */}
      <aside className={`fixed lg:relative z-40 h-screen border-r border-white/5 bg-[#0b0f19]/90 backdrop-blur-2xl flex flex-col justify-between p-4 transition-all duration-300 ${collapsed ? 'w-[80px]' : 'w-[260px]'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="space-y-6">
          {/* Logo brand & Collapsed trigger */}
          <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <img src="/logo.svg" className="w-10 h-10 object-cover" alt="Nova Logo" />
              {!collapsed && (
                <div className="animate-fade-in">
                  <h1 className="text-xs font-extrabold m-0 tracking-widest text-white uppercase truncate max-w-[140px]">{user?.org_name || "NOVA LIBRARY"}</h1>
                  <span className="text-[8px] text-purple-400 font-bold tracking-widest block uppercase">SYS CONSOLE V2.4</span>
                </div>
              )}
            </div>
            
            {/* Collapse toggle button */}
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Menu Links */}
          <nav className="flex flex-col gap-1 overflow-y-auto max-h-[70vh] pr-1">
            {/* 1. SUPER ADMIN LINKS */}
            {user?.role === 'superadmin' && (
              <>
                <button
                  onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <LayoutDashboard className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">{getDashboardLabel()}</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('organizations'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'organizations' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Building className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Organizations</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('audit_logs'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'audit_logs' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Activity className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">System Audit Logs</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <SettingsIcon className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Global Settings</span>}
                </button>
              </>
            )}

            {/* 2. ORG ADMIN LINKS */}
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <LayoutDashboard className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">{getDashboardLabel()}</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('members'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'members' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Users className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Student Registry</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('books'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'books' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <BookOpen className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Master Catalog</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('reports'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'reports' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <FileText className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Analytics Reports</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <SettingsIcon className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Node Settings</span>}
                </button>
              </>
            )}

            {/* 3. LIBRARIAN STAFF LINKS */}
            {user?.role === 'librarian' && (
              <>
                <button
                  onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <LayoutDashboard className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">{getDashboardLabel()}</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('books'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'books' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <BookOpen className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Book Catalog</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('issue'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'issue' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Bookmark className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Lending Desk</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('fines'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'fines' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Clock className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Fine Center</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('reports'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'reports' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <FileText className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">BI Reports</span>}
                </button>
              </>
            )}

            {/* 4. STUDENT / MEMBER LINKS */}
            {user?.role === 'member' && (
              <>
                <button
                  onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <LayoutDashboard className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">{getDashboardLabel()}</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('books'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'books' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <BookOpen className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Book Catalog</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('history'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'history' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Clock className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Borrowing History</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('leaderboard'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'leaderboard' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Trophy className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Member Ranking</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'profile' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <User className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Profile</span>}
                </button>
              </>
            )}
          </nav>
        </div>

        {/* User profile card in footer */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-[10px] border border-cyan-400/30 flex-shrink-0">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="overflow-hidden animate-fade-in">
                <span className="font-bold text-white block truncate max-w-[110px]">{user.username}</span>
                <span className="text-[8px] text-cyan-400 uppercase font-semibold block tracking-wider">{user.role}</span>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer flex-shrink-0" title="Sign Out (Alt + L)">
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER PANEL */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto z-10">
        
        {/* PREMIUM NAVBAR HEADER */}
        <header className="px-6 py-4 border-b border-white/5 bg-[#0b0f19]/60 backdrop-blur-md flex justify-between items-center z-30 sticky top-0">
          {/* Left panel info */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white bg-white/5 border border-white/10 p-2.5 rounded-xl hover:bg-white/10 transition-all">
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="hidden md:block">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Node Active</span>
              </div>
              <h2 className="text-white text-base font-extrabold m-0 uppercase tracking-widest mt-0.5">{activeTab.replace('_', ' ')} Panel</h2>
            </div>
          </div>

          {/* Center search form */}
          <form onSubmit={executeGlobalSearch} className="hidden md:flex max-w-xs w-full relative">
            <input 
              type="text" 
              placeholder="Search library catalog... (Press Enter)" 
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-[#131b2e]/60 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all font-sans"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </form>

          {/* Right Action Widgets */}
          <div className="flex items-center gap-4">
            
            {/* Live Clock Display */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-slate-300 font-mono tracking-widest">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>

            {/* User role badge status */}
            <div className={`hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r ${getRoleColor()}`}>
              {getRoleLabel()}
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-slate-400 hover:text-white transition-all relative cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-[8px] border border-slate-950 animate-bounce">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Overlay List */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-82 glass-panel border-white/10 p-4 space-y-3 shadow-2xl z-50 text-xs bg-[#0b0f19] max-h-72 overflow-y-auto rounded-2xl">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <strong className="text-white font-bold text-[10px] uppercase tracking-wider">System Feed Logging</strong>
                    <span onClick={() => setNotifications([])} className="text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer font-semibold">Clear All</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-[10px]">No active system telemetry.</div>
                  ) : (
                    notifications.map((n, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                        <p className="m-0 text-slate-200 leading-snug font-sans">{n.message}</p>
                        <small className="text-[8px] text-slate-500 block text-right">{n.timestamp}</small>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Dark/Light mode filter toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </header>

        {/* CONTAINER VIEWPORTS */}
        <div className="flex-grow p-6">
          {activeTab === 'dashboard' && <Dashboard user={user} onTabChange={setActiveTab} />}
          {activeTab === 'books' && <BookExplorer />}
          {activeTab === 'members' && <MemberManagement />}
          {activeTab === 'issue' && <IssueReturn />}
          {activeTab === 'fines' && <Fines />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'history' && <ReadingHistory />}
          {activeTab === 'leaderboard' && <Leaderboard />}
          {activeTab === 'profile' && <Profile user={user} onProfileUpdate={setUser} />}
          {activeTab === 'organizations' && <Organizations />}
          {activeTab === 'audit_logs' && <AuditLogs />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </main>

      {/* FLOATING SYSTEM AI NODE */}
      <AIAssistant />
    </div>
  );
}

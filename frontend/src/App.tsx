import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  Sparkles, Moon, Sun, Bell, LayoutDashboard, Search as SearchIcon, Users, 
  BookOpen, Bookmark, Calendar, FileText, Clock, Trophy, User, LogOut, 
  Menu, Building, Activity, Settings as SettingsIcon, ShieldAlert,
  ChevronLeft, ChevronRight, Search, Keyboard, Signal, CreditCard, Info
} from 'lucide-react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

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
import LibraryRequests from './pages/LibraryRequests';
import Billing from './pages/Billing';
import EnterpriseHub from './pages/EnterpriseHub';
import { ToastContainer } from './components/Toast';


// Public Pages & Layouts
import PublicLayout from './components/PublicLayout';
import ScrollToTop from './components/ScrollToTop';
import FeaturesPage from './pages/public/FeaturesPage';
import ServicesPage from './pages/public/ServicesPage';
import PricingPage from './pages/public/PricingPage';
import TestimonialsPage from './pages/public/TestimonialsPage';
import FAQPage from './pages/public/FAQPage';
import ContactPage from './pages/public/ContactPage';
import AboutPage from './pages/public/AboutPage';


function SakuraBackground() {
  const [petals, setPetals] = useState<any[]>([]);

  useEffect(() => {
    const newPetals = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + 'vw',
      delay: Math.random() * 15 + 's',
      duration: (Math.random() * 10 + 8) + 's',
      transform: `rotate(${Math.random() * 360}deg)`
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="sakura-bg">
      {petals.map(p => (
        <div
          key={p.id}
          className="sakura-petal"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: p.transform,
            top: '-20px',
            width: Math.random() * 8 + 6 + 'px',
            height: Math.random() * 10 + 8 + 'px'
          }}
        />
      ))}
    </div>
  );
}

function AccessDenied({ role, tab, onBackToDashboard }: { role: string; tab: string; onBackToDashboard: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6 max-w-md mx-auto animate-fade-in">
      <div className="relative mb-2">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full border border-slate-950 flex items-center justify-center font-bold text-white text-[9px] animate-ping" />
      </div>

      <div className="space-y-2">
        <h3 className="text-white text-base font-extrabold tracking-wider uppercase">System Access Revoked</h3>
        <p className="text-slate-400 text-xs">Your credentials do not possess high-level access keys for the requested node.</p>
      </div>

      <div className="w-full p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5 text-left text-xs">
        <div className="flex justify-between border-b border-white/5 pb-2">
          <span className="text-slate-500">Security Sector:</span>
          <span className="text-red-400 font-mono uppercase font-bold tracking-widest">{tab.replace('_', ' ')} Node</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Authorized Clearence:</span>
          <span className="text-slate-300 font-semibold">Elevated Credentials Only</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Identity Detected:</span>
          <span className="text-slate-300 font-semibold font-mono uppercase">{role}</span>
        </div>
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={onBackToDashboard}
          className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg border border-white/10 text-xs hover:scale-[1.02] transition-all cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  // darkMode state replaced by theme_preference toggle
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthPortal, setShowAuthPortal] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [globalSearch, setGlobalSearch] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);


  // 1. Live Running Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + K -> Command Palette
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
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
      // Auto redirect to billing tab if checkout is pending, else dashboard
      const pendingAction = localStorage.getItem('pending_action');
      const pendingPlan = localStorage.getItem('pending_plan');
      if (pendingAction === 'subscription' && pendingPlan) {
        setActiveTab('billing');
      } else {
        setActiveTab('dashboard');
      }

      const syncProfile = async () => {
        try {
          const res = await fetch('http://127.0.0.1:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const freshUser = await res.json();
            const updatedUser = { ...parsedUser, ...freshUser };
            setUser(updatedUser);
            localStorage.setItem('nova_user', JSON.stringify(updatedUser));
          }
        } catch (err) {
          console.error("Failed to sync profile on mount:", err);
        }
      };
      syncProfile();
    }
  }, []);

  // Navigation guard to prevent authenticated users from dropping out of the workspace or seeing login page via browser Back button
  useEffect(() => {
    if (user && location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [location.pathname, user, navigate]);

  // WebSockets setup
  useEffect(() => {
    if (!user) return;

    const socket = io('http://127.0.0.1:5000', {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('Real-time WebSockets Connected');
    });

    socket.on('notification', (notif: any) => {
      setNotifications(prev => [notif, ...prev]);
      if (window.showToast) {
        window.showToast(notif.message, notif.type || 'info');
      }
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
        audio.volume = 0.2;
        audio.play();
      } catch (e) {}
    });

    socket.on('sync', (data: any) => {
      // Dispatch sync event to tell active pages to fetch new data
      window.dispatchEvent(new CustomEvent('nova_sync', { detail: data }));
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);


  // Lock body/html scroll when logged in to make sidebar stable and fixed
  useEffect(() => {
    if (user) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100vh';
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    };
  }, [user]);

  // Fetch active alerts on mount / authentication changes
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('nova_jwt_token');
        const res = await fetch('http://127.0.0.1:5000/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setNotifications(data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };
    fetchNotifications();
  }, [user]);

  const clearAllNotifications = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      const token = localStorage.getItem('nova_jwt_token');
      await fetch('http://127.0.0.1:5000/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const markAsRead = async (notifId: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === notifId ? { ...n, is_read: true } : n)
    );
    try {
      const token = localStorage.getItem('nova_jwt_token');
      await fetch(`http://127.0.0.1:5000/api/notifications/mark-read/${notifId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };


  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    // Redirect to billing if checkout is pending, else dashboard
    const pendingAction = localStorage.getItem('pending_action');
    const pendingPlan = localStorage.getItem('pending_plan');
    if (pendingAction === 'subscription' && pendingPlan) {
      setActiveTab('billing');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  const isLightTheme = () => {
    const pref = user?.theme_preference || 'tokyo-night';
    const actual = pref === 'system' ? systemTheme : pref;
    return actual === 'soft-sakura' || actual === 'blue-sky' || actual === 'light';
  };

  const toggleThemeMode = async () => {
    const currentTheme = user?.theme_preference || 'tokyo-night';
    let newTheme = 'tokyo-night';
    if (currentTheme === 'tokyo-night' || currentTheme === 'dark') newTheme = 'system';
    else if (currentTheme === 'system') newTheme = 'soft-sakura';
    else if (currentTheme === 'soft-sakura' || currentTheme === 'light') newTheme = 'tokyo-night';
    else if (currentTheme === 'reading-room') newTheme = 'blue-sky';
    else if (currentTheme === 'blue-sky') newTheme = 'reading-room';
    else newTheme = 'tokyo-night';

    const updatedUser = { ...user, theme_preference: newTheme };
    setUser(updatedUser);
    localStorage.setItem('nova_user', JSON.stringify(updatedUser));

    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ theme_preference: newTheme })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('nova_user', JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to sync theme preference with server:', err);
    }
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
    return (
      <>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={
            <PublicLayout onEnterPortal={() => navigate('/login')} onOpenOtpModal={() => navigate('/login')}>
              <Home onEnterPortal={() => navigate('/login')} />
            </PublicLayout>
          } />
          <Route path="/features" element={
            <PublicLayout onEnterPortal={() => navigate('/login')} onOpenOtpModal={() => navigate('/login')}>
              <FeaturesPage />
            </PublicLayout>
          } />
          <Route path="/services" element={
            <PublicLayout onEnterPortal={() => navigate('/login')} onOpenOtpModal={() => navigate('/login')}>
              <ServicesPage />
            </PublicLayout>
          } />
          <Route path="/pricing" element={
            <PublicLayout onEnterPortal={() => navigate('/login')} onOpenOtpModal={() => navigate('/login')}>
              <PricingPage onOpenLogin={() => navigate('/login')} />
            </PublicLayout>
          } />
          <Route path="/testimonials" element={
            <PublicLayout onEnterPortal={() => navigate('/login')} onOpenOtpModal={() => navigate('/login')}>
              <TestimonialsPage />
            </PublicLayout>
          } />
          <Route path="/faq" element={
            <PublicLayout onEnterPortal={() => navigate('/login')} onOpenOtpModal={() => navigate('/login')}>
              <FAQPage />
            </PublicLayout>
          } />
          <Route path="/contact" element={
            <PublicLayout onEnterPortal={() => navigate('/login')} onOpenOtpModal={() => navigate('/login')}>
              <ContactPage />
            </PublicLayout>
          } />
          <Route path="/about" element={
            <PublicLayout onEnterPortal={() => navigate('/login')} onOpenOtpModal={() => navigate('/login')}>
              <AboutPage />
            </PublicLayout>
          } />
          <Route path="/login" element={
            <Login onLoginSuccess={handleLoginSuccess} onBack={() => navigate('/')} />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  }

  // Get localized role badge details
  const getRoleLabel = () => {
    if (user.role === 'superadmin') return 'SUPER ADMIN';
    if (user.role === 'admin') return 'ORG ADMIN';
    if (user.role === 'librarian') return 'LIBRARIAN';
    return 'STUDENT MEMBER';
  };

  const getDashboardLabel = () => {
    if (user.role === 'superadmin') return 'Super Admin Dashboard';
    if (user.role === 'admin') return 'Organization Dashboard';
    if (user.role === 'librarian') return 'Staff Dashboard';
    return 'Student Dashboard';
  };

  const getRoleColor = () => {
    if (user.role === 'superadmin') return 'from-amber-500/35 to-orange-500/35 text-amber-200 border-amber-500/55 shadow-[0_0_12px_rgba(245,158,11,0.25)]';
    if (user.role === 'admin') return 'from-purple-500/35 to-indigo-500/35 text-purple-200 border-purple-500/55 shadow-[0_0_12px_rgba(139,92,246,0.25)]';
    if (user.role === 'librarian') return 'from-emerald-500/35 to-teal-500/35 text-emerald-200 border-emerald-500/55 shadow-[0_0_12px_rgba(16,185,129,0.25)]';
    return 'from-blue-500/35 to-cyan-500/35 text-cyan-200 border-cyan-500/55 shadow-[0_0_12px_rgba(6,182,212,0.25)]';
  };

  const hasAccess = (tab: string) => {
    if (!user) return false;
    if (tab === 'dashboard' || tab === 'profile' || tab === 'billing' || tab === 'enterprise_hub') return true;
    
    if (user.role === 'superadmin') {
      return ['dashboard', 'organizations', 'audit_logs', 'settings', 'profile'].includes(tab);
    }
    if (user.role === 'admin') {
      return ['dashboard', 'members', 'books', 'reports', 'settings', 'profile', 'requests', 'billing'].includes(tab);
    }
    if (user.role === 'librarian') {
      return ['dashboard', 'books', 'issue', 'fines', 'reports', 'profile', 'requests'].includes(tab);
    }
    if (user.role === 'member') {
      return ['dashboard', 'books', 'history', 'leaderboard', 'profile'].includes(tab);
    }
    return false;
  };

  const getThemeClass = () => {
    let pref = user?.theme_preference || 'tokyo-night';
    if (pref === 'system') {
      pref = systemTheme;
    }
    if (pref === 'dark') return 'theme-tokyo-night';
    if (pref === 'light') return 'theme-soft-sakura';
    return `theme-${pref}`;
  };

  return (
    <div className={`app-wrapper flex min-h-screen relative overflow-hidden ${getThemeClass()}`}>
      <SakuraBackground />
      <div className="aurora-glow-1 top-10 left-10" />
      <div className="aurora-glow-2 bottom-20 right-20" />
      
      {/* SIDEBAR NAVIGATION - Premium Glassmorphic design */}
      <aside className={`fixed top-0 left-0 z-40 h-screen border-r border-white/5 bg-[#0b0f19]/90 backdrop-blur-2xl flex flex-col justify-between p-4 transition-all duration-300 ${collapsed ? 'w-[80px]' : 'w-[260px]'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        <div className="space-y-6">
          {/* Logo brand & Collapsed trigger */}
          <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3 overflow-hidden">
              {user?.org_logo ? (
                <img src={user.org_logo} className="w-10 h-10 object-contain rounded-full bg-white/5 border border-white/10 p-0.5" alt="Org Logo" />
              ) : (
                <img src="/logo.png" className="w-10 h-10 object-cover" alt="Nova Logo" />
              )}
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
                  onClick={() => { setActiveTab('requests'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'requests' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Calendar className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Library Requests</span>}
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
                <button
                  onClick={() => { setActiveTab('billing'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'billing' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <CreditCard className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Billing & Plans</span>}
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
                  onClick={() => { setActiveTab('requests'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'requests' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Calendar className="w-4.5 h-4.5" />
                  {!collapsed && <span className="animate-fade-in">Library Requests</span>}
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
            
            {/* Enterprise Hub Link (Optional Premium Features) */}
            <button
              onClick={() => { setActiveTab('enterprise_hub'); setSidebarOpen(false); }}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'enterprise_hub' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Sparkles className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
              {!collapsed && <span className="animate-fade-in text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-300 font-extrabold">Enterprise Hub</span>}
            </button>
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
      <main className={`flex-1 flex flex-col h-screen overflow-y-auto z-10 transition-all duration-300 ${collapsed ? 'lg:pl-[80px]' : 'lg:pl-[260px]'}`}>

        
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
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-[10px] text-cyan-300 font-bold font-mono tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.15)] animate-pulse">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>

            {/* User role badge status */}
            <div className={`hidden sm:inline-flex items-center px-4 py-1.5 rounded-full border text-[9px] font-extrabold uppercase tracking-widest bg-gradient-to-r transition-all duration-300 hover:scale-105 ${getRoleColor()}`}>
              {getRoleLabel()}
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-slate-400 hover:text-white transition-all relative cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-[8px] border border-slate-950 animate-bounce">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>

              {/* Notification Overlay List */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-82 glass-panel border-white/10 p-4 space-y-3 shadow-2xl z-50 text-xs bg-[#0b0f19] max-h-80 overflow-y-auto rounded-2xl">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <strong className="text-white font-bold text-[10px] uppercase tracking-wider">
                      Telemetry Feed ({notifications.filter(n => !n.is_read).length} Unread)
                    </strong>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <span onClick={clearAllNotifications} className="text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer font-semibold">
                        Mark All Read
                      </span>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-[10px]">No active telemetry alerts.</div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((n) => {
                        const isFine = n.title?.toLowerCase().includes('fine') || n.message?.toLowerCase().includes('fine');
                        const isDue = n.title?.toLowerCase().includes('due') || n.title?.toLowerCase().includes('renew') || n.message?.toLowerCase().includes('due');
                        
                        return (
                          <div 
                            key={n.id || Math.random()} 
                            className={`p-2.5 rounded-xl border flex gap-2.5 items-start transition-all ${
                              n.is_read 
                                ? 'opacity-50 bg-white/[0.01] border-white/5' 
                                : 'bg-white/5 border-white/10 border-l-2 border-l-cyan-400'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isFine ? (
                                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                              ) : isDue ? (
                                <Clock className="w-3.5 h-3.5 text-rose-400" />
                              ) : (
                                <Info className="w-3.5 h-3.5 text-cyan-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-bold text-[9px] text-white/55 block truncate uppercase">{n.title || 'System alert'}</span>
                                {!n.is_read && (
                                  <button
                                    onClick={() => markAsRead(n.id)}
                                    className="text-[8px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer shrink-0"
                                  >
                                    Mark Read
                                  </button>
                                )}
                              </div>
                              <p className="m-0 text-slate-200 leading-snug font-sans text-[10px] break-words">{n.message}</p>
                              <small className="text-[7px] text-slate-500 block text-right font-mono mt-0.5">
                                {n.created_at || 'Just now'}
                              </small>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>


            {/* Command Palette Launcher */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Open Command Palette (Ctrl + K)"
            >
              <Keyboard className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
            </button>

            {/* Dark/Light mode theme mode toggle */}
            <button
              onClick={toggleThemeMode}
              className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Toggle Theme Mode"
            >
              {isLightTheme() ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5 text-amber-400" />}
            </button>
          </div>
        </header>

        {/* CONTAINER VIEWPORTS */}
        <div className="flex-grow p-6">
          {!hasAccess(activeTab) ? (
            <AccessDenied role={user.role} tab={activeTab} onBackToDashboard={() => setActiveTab('dashboard')} />
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard user={user} onTabChange={setActiveTab} />}
              {activeTab === 'books' && <BookExplorer />}
              {activeTab === 'members' && <MemberManagement />}
              {activeTab === 'requests' && <LibraryRequests />}
              {activeTab === 'issue' && <IssueReturn />}
              {activeTab === 'fines' && <Fines />}
              {activeTab === 'reports' && <Reports />}
              {activeTab === 'history' && <ReadingHistory />}
              {activeTab === 'leaderboard' && <Leaderboard />}
              {activeTab === 'profile' && <Profile user={user} onProfileUpdate={setUser} />}
              {activeTab === 'organizations' && <Organizations />}
              {activeTab === 'audit_logs' && <AuditLogs />}
              {activeTab === 'settings' && <Settings />}
              {activeTab === 'billing' && <Billing user={user} onProfileUpdate={setUser} />}
              {activeTab === 'enterprise_hub' && <EnterpriseHub user={user} onTabChange={setActiveTab} />}
            </>
          )}
        </div>
      </main>

      {/* Command Palette Modal */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-md p-4 md:p-20">
          <div className="w-full max-w-2xl bg-[#0b0f19] border border-white/10 rounded-2xl shadow-2xl p-4 overflow-hidden flex flex-col space-y-4">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <Search className="w-5 h-5 text-amber-400" />
              <input 
                type="text"
                placeholder="Search commands, pages, or search catalog..."
                className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-slate-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowCommandPalette(false);
                  }
                }}
              />
              <button 
                onClick={() => setShowCommandPalette(false)}
                className="text-[10px] text-slate-500 hover:text-white border border-white/10 px-2 py-1 rounded-md"
              >
                ESC
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Global Navigation Links</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { label: 'Navigate: Dashboard Dashboard', tab: 'dashboard' },
                  { label: 'Navigate: Book Catalog Explorer', tab: 'books' },
                  { label: 'Navigate: Library Requests Queue', tab: 'requests', privilege: ['admin', 'librarian'] },
                  { label: 'Navigate: Lending Desk', tab: 'issue', privilege: ['librarian'] },
                  { label: 'Navigate: Fine Center', tab: 'fines', privilege: ['librarian'] },
                  { label: 'Navigate: Analytics Reports', tab: 'reports', privilege: ['admin', 'librarian'] },
                  { label: 'Navigate: Student Registry', tab: 'members', privilege: ['admin'] },
                  { label: 'Navigate: System Audit Logs', tab: 'audit_logs', privilege: ['superadmin'] },
                  { label: 'Navigate: Enterprise Premium Suite', tab: 'enterprise_hub' },
                  { label: 'Navigate: Billing & Plans Subscriptions', tab: 'billing', privilege: ['admin'] },
                  { label: 'Navigate: Profile Settings', tab: 'profile' }
                ].filter(cmd => !cmd.privilege || cmd.privilege.includes(user?.role)).map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveTab(cmd.tab);
                      setShowCommandPalette(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.01] hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>{cmd.label}</span>
                    <span className="text-[9px] uppercase bg-slate-900 border border-white/10 px-2 py-0.5 rounded text-slate-500 font-mono">Select</span>
                  </button>
                ))}
              </div>

              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block pt-2">Global System Actions</span>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    toggleThemeMode();
                    setShowCommandPalette(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-white/[0.01] hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>Action: Toggle Dark / Light theme preference</span>
                  <span className="text-[9px] uppercase bg-slate-900 border border-white/10 px-2 py-0.5 rounded text-slate-500 font-mono">Trigger</span>
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowCommandPalette(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-white/[0.01] hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 text-xs text-slate-300 hover:text-red-400 transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>Action: Logout system console session</span>
                  <span className="text-[9px] uppercase bg-slate-900 border border-white/10 px-2 py-0.5 rounded text-slate-500 font-mono">Exit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING SYSTEM AI NODE */}
      <AIAssistant />
      <ToastContainer />
    </div>
  );
}

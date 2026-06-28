import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { motion } from 'framer-motion';
import BrandLogo from '../components/BrandLogo';
import { 
  BookOpen, Users, Bookmark, Calendar, DollarSign, Bell, ShieldCheck, 
  TrendingUp, Sparkles, Award, Building, Cpu, Activity, Flame, CheckCircle,
  Clock, AlertTriangle, Play, HelpCircle, HardDrive, ShieldAlert, PlusCircle,
  Keyboard
} from 'lucide-react';

function AnimatedCounter({ value, duration = 800 }: { value: number | string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const isString = typeof value === 'string';
    const cleanStr = isString ? (value as string).replace(/[^0-9.]/g, '') : '';
    const num = isString ? parseFloat(cleanStr) : (value as number);

    if (isNaN(num) || num <= 0) {
      setCount(0);
      return;
    }

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * num));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(num);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  if (typeof value === 'string' && value.startsWith('₹')) {
    return <span>₹{count.toLocaleString()}</span>;
  }
  return <span>{count.toLocaleString()}</span>;
}

interface DashboardProps {
  user: any;
  onTabChange?: (tab: string) => void;
}

export default function Dashboard({ user, onTabChange }: DashboardProps) {
  const [kpi, setKpi] = useState({
    total_books: 0,
    total_members: 0,
    books_issued: 0,
    reservations: 0,
    revenue: 0
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [issueTrend, setIssueTrend] = useState<any>({ labels: [], data: [] });
  const [categoryData, setCategoryData] = useState<any>({ labels: [], data: [] });
  const [fineTrend, setFineTrend] = useState<any>({ labels: [], data: [] });
  
  // Super Admin specific state
  const [superKpi, setSuperKpi] = useState({
    total_organizations: 0,
    total_users: 0,
    total_books: 0,
    total_issues: 0,
    revenue: 0
  });
  const [orgsTrend, setOrgsTrend] = useState<any>({ labels: [], data: [] });
  const [revenueTrend, setRevenueTrend] = useState<any>({ labels: [], data: [] });
  const [serverStatus, setServerStatus] = useState<any>({
    cpu_usage: 14,
    ram_usage: 38,
    disk_usage: '18.5 GB / 120 GB',
    api_health: '100%',
    system_uptime: '99.99%'
  });
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom states for search and filtering
  const [lowStockBooks, setLowStockBooks] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [orgSearch, setOrgSearch] = useState('');

  // Enterprise specific UI states
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanAction, setScanAction] = useState<'borrow' | 'return'>('borrow');
  const [scanInput, setScanInput] = useState('');
  const [scanMemberId, setScanMemberId] = useState('');
  
  const [acquisitionList, setAcquisitionList] = useState<any[]>([]);
  const [bookTitleInput, setBookTitleInput] = useState('');
  const [bookAuthorInput, setBookAuthorInput] = useState('');
  const [bookIsbnInput, setBookIsbnInput] = useState('');

  // Scoped Member statistics
  const [memberStats, setMemberStats] = useState<any>({
    kpis: {
      borrowed_books: 0,
      currently_issued: 0,
      due_soon: 0,
      overdue_books: 0,
      returned_books: 0,
      pending_reservations: 0,
      fine_amount: 0
    },
    reading_history: [],
    reservations: [],
    notifications: [],
    recommended_books: [],
    calendar_events: [],
    issue_trends: { labels: [], data: [] },
    popular_categories: {}
  });

  // Scoped Librarian/Admin dashboard data package
  const [dashboardData, setDashboardData] = useState<any>({
    kpis: {
      total_books: 0,
      available_books: 0,
      books_issued: 0,
      reservations: 0,
      revenue: 0,
      total_members: 0,
      active_students: 0
    },
    today_issues_count: 0,
    today_issues: [],
    today_returns_count: 0,
    today_returns: [],
    pending_reservations: [],
    pending_renewals_count: 0,
    pending_renewals: [],
    overdue_books: [],
    popular_books: [],
    staff_activity: [],
    notifications: [],
    recent_activity: [],
    popular_categories: {},
    issue_trends: { labels: [], data: [] },
    fine_trends: { labels: [], data: [] },
    low_stock_books: []
  });

  // Fetch Dashboard Stats
  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.msg);

      if (data.role === 'superadmin') {
        setSuperKpi(data.kpis);
        setActivities(data.recent_activity || []);
        setOrgsTrend(data.orgs_trends || { labels: [], data: [] });
        setRevenueTrend(data.revenue_trends || { labels: [], data: [] });
        setServerStatus(data.server_status || {});
        setOrganizations(data.organizations || []);
      } else if (data.role === 'member') {
        setMemberStats(data);
      } else {
        setDashboardData(data);
        setKpi(data.kpis);
        setActivities(data.recent_activity || []);
        setIssueTrend(data.issue_trends || { labels: [], data: [] });
        setFineTrend(data.fine_trends || { labels: [], data: [] });
        setLowStockBooks(data.low_stock_books || []);

        const catLabels = data.popular_categories ? Object.keys(data.popular_categories) : [];
        const catValues = data.popular_categories ? Object.values(data.popular_categories) : [];
        setCategoryData({ labels: catLabels, data: catValues });
      }

    } catch (err: any) {
      console.error('Failed to load dashboard statistics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcquisitions = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/books/requests-list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      if (res.ok) setAcquisitionList(d);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    if (user.role === 'admin' || user.role === 'librarian') {
      fetchAcquisitions();
    }
  }, []);

  // 1. Line Chart - Books Issued Trend
  const issueChartOptions = {
    chart: { id: 'issue-trend', toolbar: { show: false }, background: 'transparent' },
    colors: ['#0ea5e9'],
    stroke: { curve: 'smooth' as const, width: 3 },
    xaxis: {
      categories: issueTrend.labels,
      labels: { style: { colors: '#64748b' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { labels: { style: { colors: '#64748b' } } },
    grid: { borderColor: 'rgba(255,255,255,0.03)' },
    theme: { mode: 'dark' as const }
  };
  const issueChartSeries = [{
    name: 'Books Issued',
    data: issueTrend.data
  }];

  // 2. Pie Chart - Popular Categories
  const categoryChartOptions = {
    chart: { id: 'popular-categories', background: 'transparent' },
    colors: ['#3b82f6', '#0ea5e9', '#a855f7', '#10b981', '#f43f5e'],
    labels: categoryData.labels.length > 0 ? categoryData.labels : ['Standard'],
    legend: { labels: { colors: '#94a3b8' }, position: 'bottom' as const },
    stroke: { show: false },
    theme: { mode: 'dark' as const }
  };
  const categoryChartSeries = categoryData.data.length > 0 ? categoryData.data : [10];

  // 3. Area Chart - Fine Trends
  const revenueChartOptions = {
    chart: { id: 'fine-trends', toolbar: { show: false }, background: 'transparent' },
    colors: ['#10b981', '#fbbf24'],
    stroke: { curve: 'smooth' as const, width: 2 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0.05 } },
    xaxis: {
      categories: fineTrend.labels,
      labels: { style: { colors: '#64748b' } }
    },
    yaxis: { labels: { style: { colors: '#64748b' } } },
    grid: { borderColor: 'rgba(255,255,255,0.03)' },
    theme: { mode: 'dark' as const }
  };
  const revenueChartSeries = [
    {
      name: 'Fine Collection (₹)',
      data: fineTrend.data
    },
    {
      name: 'Checkouts Count',
      data: issueTrend.data
    }
  ];

  // Super Admin Chart configs
  const orgsChartOptions = {
    chart: { id: 'orgs-growth', toolbar: { show: false }, background: 'transparent' },
    colors: ['#8b5cf6'],
    stroke: { curve: 'smooth' as const, width: 3 },
    xaxis: {
      categories: orgsTrend.labels,
      labels: { style: { colors: '#64748b' } }
    },
    yaxis: { labels: { style: { colors: '#64748b' } } },
    grid: { borderColor: 'rgba(255,255,255,0.03)' },
    theme: { mode: 'dark' as const }
  };
  const orgsChartSeries = [{
    name: 'Client Organizations',
    data: orgsTrend.data
  }];

  const globalRevChartOptions = {
    chart: { id: 'global-revenue', toolbar: { show: false }, background: 'transparent' },
    colors: ['#10b981'],
    stroke: { curve: 'smooth' as const, width: 3 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
    xaxis: {
      categories: revenueTrend.labels,
      labels: { style: { colors: '#64748b' } }
    },
    yaxis: { labels: { style: { colors: '#64748b' } } },
    grid: { borderColor: 'rgba(255,255,255,0.03)' },
    theme: { mode: 'dark' as const }
  };
  const globalRevChartSeries = [{
    name: 'Total Revenue (₹)',
    data: revenueTrend.data
  }];

  const serverLoadChartOptions = {
    chart: { id: 'server-load', background: 'transparent' },
    plotOptions: {
      radialBar: {
        dataLabels: {
          name: { fontSize: '12px', color: '#94a3b8' },
          value: { fontSize: '14px', color: '#c084fc', formatter: (val: number) => `${val}%` },
          total: { show: true, label: 'Resources', color: '#ffffff' }
        }
      }
    },
    colors: ['#c084fc', '#0ea5e9'],
    labels: ['CPU Load', 'RAM Usage'],
    theme: { mode: 'dark' as const }
  };
  const serverLoadChartSeries = [serverStatus.cpu_usage || 14, serverStatus.ram_usage || 38];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-400 text-xs tracking-widest uppercase">Initializing Enterprise Telemetry...</span>
      </div>
    );
  }

  // Animation constants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } }
  };

  // ==================================================
  // 1. SUPER ADMIN VIEW
  // ==================================================
  if (user.role === 'superadmin') {
    const filteredOrgs = organizations.filter(o => 
      o.name.toLowerCase().includes(orgSearch.toLowerCase()) || 
      o.subdomain.toLowerCase().includes(orgSearch.toLowerCase())
    );

    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Welcome Banner */}
        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-[#1e1b4b]/60 to-[#020617]/80 border-white/5 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Super Admin SaaS Portal <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            </h2>
            <p className="text-slate-400 text-xs mt-1">Configure global client tenants, inspect active system resources, and track global audit parameters.</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 border border-white/5 px-4 py-2.5 rounded-2xl">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Gateway Status</span>
              <strong className="text-sm text-emerald-400 font-mono">ONLINE (99.99%)</strong>
            </div>
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
        </motion.div>

        {/* KPI Counter Grids */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Client Tenants', value: superKpi.total_organizations, icon: Building, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/10' },
            { label: 'Global Users', value: superKpi.total_users, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/10' },
            { label: 'Global Catalog', value: superKpi.total_books, icon: BookOpen, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/10' },
            { label: 'Active Issues', value: superKpi.total_issues, icon: Bookmark, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/10' },
            { label: 'Global Collections', value: `₹${superKpi.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/10', span: 'col-span-2 md:col-span-1' }
          ].map((card, idx) => (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              className={`glass-panel p-4 flex items-center justify-between border-white/5 hover:border-white/10 ${card.span || ''}`}
            >
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{card.label}</span>
                <h3 className="text-xl font-extrabold text-white mt-1.5">
                  <AnimatedCounter value={card.value} />
                </h3>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color} ${card.bg}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts: Subscription Growth & System Resources */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-5 border-white/5 lg:col-span-2 flex flex-col h-[350px]">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" /> SaaS Subscription Growth
            </h4>
            <div className="flex-grow min-h-0">
              <Chart options={orgsChartOptions} series={orgsChartSeries} type="line" height="100%" />
            </div>
          </div>

          <div className="glass-panel p-5 border-white/5 flex flex-col h-[350px]">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" /> System Resources
            </h4>
            <div className="flex-grow min-h-0 flex items-center justify-center">
              <Chart options={serverLoadChartOptions} series={serverLoadChartSeries} type="radialBar" height="100%" width="100%" />
            </div>
          </div>
        </motion.div>

        {/* Charts: Global Revenue & System Audit Feed */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-5 border-white/5 lg:col-span-2 flex flex-col h-[380px]">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Global Revenue Collected
            </h4>
            <div className="flex-grow min-h-0">
              <Chart options={globalRevChartOptions} series={globalRevChartSeries} type="area" height="100%" />
            </div>
          </div>

          <div className="glass-panel p-5 border-white/5 flex flex-col h-[380px]">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" /> Audit Telemetry Logs
            </h4>
            <div className="flex-grow overflow-y-auto space-y-3 pr-1">
              {activities.length === 0 ? (
                <div className="text-center text-slate-500 py-16">No audit records found.</div>
              ) : (
                activities.map((act, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                    <Activity className="w-3.5 h-3.5 text-purple-400 mt-0.5" />
                    <div>
                      <p className="m-0 text-slate-300 text-xs leading-snug font-sans">{act.message}</p>
                      <small className="text-[9px] text-slate-600 block mt-1 font-mono">{act.date}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Client Organization Nodes Table */}
        <motion.div variants={itemVariants} className="glass-panel p-5 border-white/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" /> Active Client Organizations
            </h4>
            <input 
              type="text" 
              placeholder="Search tenants..." 
              value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 uppercase font-bold text-[9px] tracking-wider">
                  <th className="pb-3">Institution Node</th>
                  <th className="pb-3">Subdomain Endpoint</th>
                  <th className="pb-3">Registered On</th>
                  <th className="pb-3 text-right">User Count</th>
                  <th className="pb-3 text-right">Catalog Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredOrgs.map(org => (
                  <tr key={org.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-bold text-white flex items-center gap-2">
                      <Building className="w-4 h-4 text-indigo-400" /> {org.name}
                    </td>
                    <td className="py-3 text-cyan-400 font-mono">.{org.subdomain}.novalibrary.com</td>
                    <td className="py-3 text-slate-500">{org.created_at}</td>
                    <td className="py-3 text-right font-mono font-bold text-white">{org.users_count}</td>
                    <td className="py-3 text-right font-mono font-bold text-white">{org.books_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ==================================================
  // 2. ORGANIZATION ADMIN VIEW (Org Admin)
  // ==================================================
  if (user.role === 'admin') {
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Welcome Banner */}
        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-[#1e1b4b]/60 to-[#020617]/80 border-white/5 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <BrandLogo imgClassName="w-12 h-12 rounded-xl object-contain bg-white/5 border border-white/10 p-1" />
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Welcome Organization Admin, {user.username} <Sparkles className="w-5 h-5 text-indigo-400" />
              </h2>
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1">{user?.org_name || 'NOVA ACADEMIA NODE'}</p>
              <p className="text-slate-400 text-xs mt-1">Review catalog metrics, adjust departmental reading metrics, and audit system operations.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 border border-white/5 px-4 py-2.5 rounded-2xl">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Tenant Health</span>
              <strong className="text-sm text-cyan-400 font-mono">ACTIVE (99.85%)</strong>
            </div>
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
        </motion.div>

        {/* KPI Counter Grids */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Books Catalog', value: kpi.total_books, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/10' },
            { label: 'Active Students', value: kpi.total_members, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/10' },
            { label: 'Books Checked Out', value: kpi.books_issued, icon: Bookmark, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/10' },
            { label: 'Pending Holds', value: kpi.reservations, icon: Calendar, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/10' },
            { label: 'Fine Collected', value: `₹${kpi.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/10', span: 'col-span-2 md:col-span-1' }
          ].map((card, idx) => (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              className={`glass-panel p-4 flex items-center justify-between border-white/5 hover:border-white/10 ${card.span || ''}`}
            >
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{card.label}</span>
                <h3 className="text-xl font-extrabold text-white mt-1.5">
                  <AnimatedCounter value={card.value} />
                </h3>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color} ${card.bg}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts: Catalog Growth & Popular Subcategories */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-5 border-white/5 h-[340px] flex flex-col">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Catalog Growth & Issue Rate
            </h4>
            <div className="flex-grow min-h-0">
              <Chart options={issueChartOptions} series={issueChartSeries} type="line" height="100%" />
            </div>
          </div>

          <div className="glass-panel p-5 border-white/5 h-[340px] flex flex-col">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" /> Popular Subcategories
            </h4>
            <div className="flex-grow min-h-0 flex items-center justify-center">
              <Chart options={categoryChartOptions} series={categoryChartSeries} type="donut" width="100%" height="80%" />
            </div>
          </div>
        </motion.div>

        {/* Department Progress & Activities Feed */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Department stats */}
          <div className="glass-panel p-5 border-white/5 h-[390px] lg:col-span-2 flex flex-col">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" /> Departmental Reading Indexes
            </h4>
            <div className="flex-grow overflow-y-auto space-y-4 pr-1">
              {[
                { name: 'Computer Science', count: 42, progress: 88, color: 'bg-blue-500' },
                { name: 'Physics & Astronomy', count: 18, progress: 76, color: 'bg-cyan-500' },
                { name: 'Applied Mathematics', count: 24, progress: 81, color: 'bg-yellow-500' },
                { name: 'Classical Literature', count: 15, progress: 68, color: 'bg-purple-500' }
              ].map((dept, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{dept.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{dept.count} Members</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className={`${dept.color} h-1.5 rounded-full`} style={{ width: `${dept.progress}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-500">
                    <span>Reading Performance Goal: 90.0</span>
                    <strong className="text-white font-mono">{dept.progress}% Index</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="glass-panel p-5 border-white/5 h-[390px] flex flex-col">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-400" /> Recent Operations Feed
            </h4>
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {activities.length === 0 ? (
                <div className="text-center text-slate-500 py-20">No activities logged today.</div>
              ) : (
                activities.map((act, idx) => (
                  <div key={idx} className="flex gap-3 pb-3 border-b border-white/5 items-start">
                    <div className="mt-0.5">
                      {act.type === 'issue' && <Bookmark className="w-3.5 h-3.5 text-blue-400 animate-pulse" />}
                      {act.type === 'return' && <Bookmark className="w-3.5 h-3.5 text-emerald-400" />}
                      {act.type === 'register' && <Users className="w-3.5 h-3.5 text-amber-400" />}
                      {act.type === 'reserve' && <Calendar className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <div>
                      <p className="m-0 text-slate-200 text-xs leading-snug">{act.message}</p>
                      <small className="text-[9px] text-slate-600 block mt-1 font-mono">{act.date}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </motion.div>
      </motion.div>
    );
  }

  // ==================================================
  // 3. LIBRARIAN STAFF VIEW
  // ==================================================
  if (user.role === 'librarian') {
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Welcome Banner */}
        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-[#1e1b4b]/60 to-[#020617]/80 border-white/5 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <BrandLogo imgClassName="w-12 h-12 rounded-xl object-contain bg-white/5 border border-white/10 p-1" />
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Welcome Staff Librarian, {user.username} <Sparkles className="w-5 h-5 text-emerald-400" />
              </h2>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">{user?.org_name || 'NOVA ACADEMIA NODE'}</p>
              <p className="text-slate-400 text-xs mt-1">Review circulation states, approve pending reservations, and issue fines waivers.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 border border-white/5 px-4 py-2.5 rounded-2xl">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Circulation Desk</span>
              <strong className="text-sm text-emerald-400 font-mono">100% OPERATIONAL</strong>
            </div>
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
        </motion.div>

        {/* KPI Counter Grids */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Books', value: kpi.total_books, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/10' },
            { label: 'Active Students', value: kpi.total_members, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/10' },
            { label: 'Books Checked Out', value: kpi.books_issued, icon: Bookmark, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/10' },
            { label: 'Pending Holds', value: kpi.reservations, icon: Calendar, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/10' },
            { label: 'Fines Collected', value: `₹${kpi.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/10', span: 'col-span-2 md:col-span-1' }
          ].map((card, idx) => (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              className={`glass-panel p-4 flex items-center justify-between border-white/5 hover:border-white/10 ${card.span || ''}`}
            >
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{card.label}</span>
                <h3 className="text-xl font-extrabold text-white mt-1.5">
                  <AnimatedCounter value={card.value} />
                </h3>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color} ${card.bg}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts: Circulation speed & Categories */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-5 border-white/5 h-[340px] flex flex-col">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Circulation Speed Rate
            </h4>
            <div className="flex-grow min-h-0">
              <Chart options={issueChartOptions} series={issueChartSeries} type="line" height="100%" />
            </div>
          </div>

          <div className="glass-panel p-5 border-white/5 h-[340px] flex flex-col">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" /> Category Distribution
            </h4>
            <div className="flex-grow min-h-0 flex items-center justify-center">
              <Chart options={categoryChartOptions} series={categoryChartSeries} type="donut" width="100%" height="80%" />
            </div>
          </div>
        </motion.div>

        {/* Low-Stock Inventory Alerts & Circulation activities */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Low Stock Alerts */}
          <div className="glass-panel p-5 border-white/5 h-[380px] lg:col-span-2 flex flex-col">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Inventory Stock Warnings
            </h4>
            <div className="flex-grow overflow-y-auto space-y-3">
              {lowStockBooks.length === 0 ? (
                <div className="text-center text-slate-500 py-20">All catalog books are fully stocked.</div>
              ) : (
                lowStockBooks.map((book: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 text-xs">
                    <div>
                      <strong className="text-white block font-bold text-sm">{book.title}</strong>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">ISBN Reference: {book.isbn}</span>
                    </div>
                    <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-xl">
                      {book.quantity} {book.quantity === 1 ? 'Copy' : 'Copies'} Left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity log */}
          <div className="glass-panel p-5 border-white/5 h-[380px] flex flex-col">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-400" /> System Activities
            </h4>
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {activities.length === 0 ? (
                <div className="text-center text-slate-500 py-20">No active system events.</div>
              ) : (
                activities.map((act, idx) => (
                  <div key={idx} className="flex gap-3 pb-3 border-b border-white/5 items-start">
                    <div className="mt-0.5">
                      {act.type === 'issue' && <Bookmark className="w-3.5 h-3.5 text-blue-400 animate-pulse" />}
                      {act.type === 'return' && <Bookmark className="w-3.5 h-3.5 text-emerald-400" />}
                      {act.type === 'register' && <Users className="w-3.5 h-3.5 text-amber-400" />}
                      {act.type === 'reserve' && <Calendar className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <div>
                      <p className="m-0 text-slate-200 text-xs leading-snug">{act.message}</p>
                      <small className="text-[9px] text-slate-600 block mt-1 font-mono">{act.date}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </motion.div>
      </motion.div>
    );
  }

  // ==================================================
  // 4. STUDENT / MEMBER VIEW
  // ==================================================
  // Student Chart Configurations
  const memberIssueChartOptions = {
    chart: { id: 'member-issue-trend', toolbar: { show: false }, background: 'transparent' },
    colors: ['#0ea5e9'],
    stroke: { curve: 'smooth' as const, width: 3 },
    xaxis: {
      categories: memberStats.issue_trends?.labels || [],
      labels: { style: { colors: '#64748b' } }
    },
    yaxis: { labels: { style: { colors: '#64748b' } } },
    grid: { borderColor: 'rgba(255,255,255,0.03)' },
    theme: { mode: 'dark' as const }
  };
  const memberIssueChartSeries = [{
    name: 'Books Borrowed',
    data: memberStats.issue_trends?.data || []
  }];

  const memberCatLabels = memberStats.popular_categories ? Object.keys(memberStats.popular_categories) : [];
  const memberCatValues = memberStats.popular_categories ? Object.values(memberStats.popular_categories) : [];
  
  const memberCategoryChartOptions = {
    chart: { id: 'member-categories', background: 'transparent' },
    colors: ['#3b82f6', '#10b981', '#a855f7', '#fbbf24', '#f43f5e'],
    labels: memberCatLabels.length > 0 ? memberCatLabels : ['No Reads'],
    legend: { labels: { colors: '#94a3b8' }, position: 'bottom' as const },
    stroke: { show: false },
    theme: { mode: 'dark' as const }
  };
  const memberCategoryChartSeries = memberCatValues.length > 0 ? memberCatValues.map(v => Number(v)) : [1];

  const activeBorrowed = memberStats.reading_history?.filter((item: any) => item.status === 'issued' || item.status === 'overdue') || [];
  const filteredHistory = activeBorrowed.filter((item: any) => 
    item.title.toLowerCase().includes(historySearch.toLowerCase()) || 
    item.author.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-[#1e1b4b]/60 to-[#020617]/80 border-white/5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <BrandLogo imgClassName="w-12 h-12 rounded-xl object-contain bg-white/5 border border-white/10 p-1" />
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Welcome back, {user.username} <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            </h2>
            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1">{user?.org_name || 'NOVA ACADEMIA NODE'}</p>
            <p className="text-slate-400 text-xs mt-1">Unlock academic milestones, borrow digital titles, and explore your reading timelines.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-2xl">
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Account Status</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Active Node
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-2xl">
            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Milestone Level</span>
            <span className="text-xs text-amber-400 font-extrabold tracking-wider flex items-center gap-1">
              <Award className="w-4 h-4" /> {user.achievement_level || "Gold Reader"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* KPI Stats widgets for Student */}
      <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: 'Total Borrowed', value: memberStats.kpis.borrowed_books, tab: 'history', color: 'hover:border-blue-500/30' },
          { label: 'Currently Issued', value: memberStats.kpis.currently_issued, tab: 'history', valueColor: 'text-cyan-400', color: 'hover:border-cyan-500/30' },
          { label: 'Due Soon', value: memberStats.kpis.due_soon, tab: 'history', valueColor: 'text-yellow-400', color: 'hover:border-yellow-500/30' },
          { label: 'Overdue Books', value: memberStats.kpis.overdue_books, tab: 'history', valueColor: 'text-rose-400', color: 'hover:border-rose-500/30' },
          { label: 'Total Returned', value: memberStats.kpis.returned_books, tab: 'history', valueColor: 'text-emerald-400', color: 'hover:border-emerald-500/30' },
          { label: 'Pending Holds', value: memberStats.kpis.pending_reservations, tab: 'books', valueColor: 'text-purple-400', color: 'hover:border-purple-500/30' },
          { label: 'Fines Due', value: `₹${memberStats.kpis.fine_amount.toLocaleString()}`, tab: 'profile', valueColor: 'text-amber-400', color: 'hover:border-amber-500/30', span: 'col-span-2 lg:col-span-1' }
        ].map((card, idx) => (
          <motion.div 
            key={idx} 
            variants={itemVariants}
            onClick={() => onTabChange && onTabChange(card.tab)}
            className={`glass-panel p-4 flex flex-col justify-between hover:scale-[1.02] active:scale-[0.98] transition-all border-white/5 cursor-pointer ${card.color} ${card.span || ''}`}
          >
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{card.label}</span>
            <h3 className={`text-xl font-extrabold mt-2.5 ${card.valueColor || 'text-white'}`}>
              <AnimatedCounter value={card.value} />
            </h3>
          </motion.div>
        ))}
      </motion.div>

      {/* AI Matches & PDF Ebook Reader list */}
      {memberStats.recommended_books?.length > 0 && (
        <motion.div variants={itemVariants} className="glass-panel p-5 border-white/5">
          <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" /> AI-Powered Academic Matches
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberStats.recommended_books.map((book: any) => (
              <div key={book.id} className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex flex-col justify-between h-[165px] hover:border-white/10 transition-all hover:bg-white/[0.02]">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-lg font-bold uppercase font-mono">{book.category}</span>
                    {book.is_digital && (
                      <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-lg font-bold uppercase font-mono">eBook</span>
                    )}
                  </div>
                  <strong className="text-white text-sm block mt-2 leading-snug truncate">{book.title}</strong>
                  <span className="text-slate-500 text-[10px] block mt-0.5 truncate">By: {book.author}</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-white/5 text-[10px]">
                  <span className="text-amber-400 font-bold">Match: {book.ai_recommendation_score}%</span>
                  {book.is_digital ? (
                    <button 
                      onClick={() => setActivePdfUrl(book.pdf_url || "https://pdfobject.com/pdf/sample.pdf")}
                      className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-xl font-bold transition-all"
                    >
                      Read eBook
                    </button>
                  ) : (
                    <button 
                      onClick={async () => {
                        const token = localStorage.getItem('nova_jwt_token');
                        const res = await fetch(`http://127.0.0.1:5000/api/books/reserve`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ book_id: book.id })
                        });
                        const resData = await res.json();
                        alert(resData.msg);
                        fetchDashboardStats();
                      }}
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-xl font-bold transition-all"
                    >
                      Quick Hold
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts: Reading Trends & Categories */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-5 border-white/5 h-[310px] flex flex-col">
          <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" /> Reading Timeline Trends
          </h4>
          <div className="flex-grow min-h-0">
            <Chart options={memberIssueChartOptions} series={memberIssueChartSeries} type="line" height="100%" />
          </div>
        </div>

        <div className="glass-panel p-5 border-white/5 h-[310px] flex flex-col">
          <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" /> Favorite Subgenres
          </h4>
          <div className="flex-grow min-h-0 flex items-center justify-center">
            <Chart options={memberCategoryChartOptions} series={memberCategoryChartSeries} type="donut" width="100%" height="80%" />
          </div>
        </div>
      </motion.div>

      {/* Borrowed Books Grid & Personal Activity Timeline */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-5 border-white/5 lg:col-span-2 flex flex-col min-h-[300px] h-[340px]">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" /> Active Borrowed Books
            </h4>
            <input 
              type="text" 
              placeholder="Filter active checkouts..." 
              value={historySearch} 
              onChange={(e) => setHistorySearch(e.target.value)} 
              className="bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-y-auto pr-1">
            {filteredHistory.length === 0 ? (
              <div className="col-span-full text-center text-slate-500 py-16">No active library checkouts.</div>
            ) : (
              filteredHistory.map((item: any) => (
                <div key={item.id} className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex flex-col justify-between h-[135px] hover:border-white/10 transition-all hover:bg-white/[0.02]">
                  <div>
                    <span className={`text-[9px] font-mono tracking-widest font-bold block uppercase ${item.status === 'overdue' ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`}>
                      {item.status === 'overdue' ? 'OVERDUE NOTICE' : `DUE: ${item.due_date ? item.due_date.split(' ')[0] : 'N/A'}`}
                    </span>
                    <strong className="text-white text-sm block mt-1 leading-snug truncate">{item.title}</strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5 truncate">Author: {item.author}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] mt-2 border-t border-white/5 pt-2">
                    <span className="text-slate-500">Issued: {item.issue_date.split(' ')[0]}</span>
                    {item.renewal_requested ? (
                      <span className="text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/20">Renewal Pending</span>
                    ) : item.renewal_count >= 3 ? (
                      <span className="text-slate-500 font-bold bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">Max Renewals</span>
                    ) : (
                      <button 
                        onClick={async () => {
                          const token = localStorage.getItem('nova_jwt_token');
                          const res = await fetch(`http://127.0.0.1:5000/api/issue/renew-request/${item.id}`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          const resData = await res.json();
                          alert(resData.msg);
                          fetchDashboardStats();
                        }}
                        className="text-cyan-400 font-bold bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-0.5 rounded-xl border border-cyan-500/20 transition-all active:scale-95"
                      >
                        Renew
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Personal notifications log */}
        <div className="glass-panel p-5 border-white/5 h-[340px] flex flex-col">
          <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-yellow-400" /> Reading Activity Log
          </h4>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {memberStats.notifications?.length === 0 ? (
              <div className="text-center text-slate-500 py-16">No personal events recorded.</div>
            ) : (
              memberStats.notifications?.map((notif: any) => (
                <div key={notif.id} className="flex gap-3 pb-2.5 border-b border-white/5 items-start text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="m-0 text-slate-200 leading-snug font-sans">{notif.message}</p>
                    <small className="text-[8px] text-slate-500 block mt-1 font-mono">{notif.date}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* Academic Calendar Events Timeline & Acquisition Form */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Events widget */}
        <div className="glass-panel p-5 border-white/5 lg:col-span-2 h-[320px] flex flex-col">
          <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" /> Academic Calendar Schedule
          </h4>
          <div className="overflow-y-auto space-y-3.5 flex-grow pr-1">
            {memberStats.calendar_events?.length === 0 ? (
              <div className="text-center text-slate-500 py-16">No upcoming events scheduled.</div>
            ) : (
              memberStats.calendar_events?.map((evt: any, idx: number) => (
                <div key={idx} className="p-3 rounded-2xl bg-white/[0.01] border border-white/5 flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-white block">{evt.title}</strong>
                    <span className="text-slate-500 block mt-0.5">{evt.description}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-cyan-400 font-mono font-bold block">{evt.event_date}</span>
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block mt-1">{evt.event_type}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Suggest Book Acquisition suggestion box */}
        <div className="glass-panel p-5 border-white/5 h-[320px] flex flex-col">
          <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-purple-400" /> Suggest Book Acquisition
          </h4>
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              if (!bookTitleInput || !bookAuthorInput) {
                alert('Title and Author are required.');
                return;
              }
              const token = localStorage.getItem('nova_jwt_token');
              const res = await fetch(`http://127.0.0.1:5000/api/books/request`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  title: bookTitleInput,
                  author: bookAuthorInput,
                  isbn: bookIsbnInput
                })
              });
              const data = await res.json();
              alert(data.msg);
              setBookTitleInput('');
              setBookAuthorInput('');
              setBookIsbnInput('');
              fetchDashboardStats();
            }}
            className="space-y-3 flex-1 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Book Title *"
                value={bookTitleInput}
                onChange={(e) => setBookTitleInput(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
              <input 
                type="text" 
                placeholder="Author *"
                value={bookAuthorInput}
                onChange={(e) => setBookAuthorInput(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
              <input 
                type="text" 
                placeholder="ISBN-13 (Optional)"
                value={bookIsbnInput}
                onChange={(e) => setBookIsbnInput(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-[0_0_10px_rgba(168,85,247,0.15)] active:scale-95"
            >
              Submit Acquisition Suggestion
            </button>
          </form>
        </div>

      </motion.div>

      {/* QUICK SHORTCUTS ACTIONS PANEL (Priority 6 shortcuts helper) */}
      <motion.div variants={itemVariants} className="glass-panel p-4 border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-slate-400">Operational Keyboards Shortcuts Bind:</span>
        </div>
        <div className="flex flex-wrap gap-2.5 text-[10px] font-mono">
          <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-300">Alt + D : Dashboard</span>
          <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-300">Alt + B : Catalog</span>
          <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-300">Alt + M : Members</span>
          <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-300">Alt + L : Sign Out</span>
        </div>
      </motion.div>

      {/* Digital PDF iframe e-Reader Modal */}
      {activePdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-slate-950 p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                <BookOpen className="w-5 h-5 text-cyan-400" /> Digital PDF E-Reader Node
              </h3>
              <button 
                onClick={() => setActivePdfUrl(null)}
                className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95"
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

      {/* Barcode/QR Scanner Simulator Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden p-6 shadow-2xl">
            <h3 className="text-white font-extrabold text-lg flex items-center gap-2 mb-2">
              <Cpu className="w-5 h-5 text-emerald-400 animate-pulse" /> visual Barcode / QR Scanner
            </h3>
            <p className="text-slate-400 text-xs mb-4">Simulate visual camera stream alignment. Align the barcode below or input details manually to execute circulation changes.</p>
            
            <div className="relative aspect-[4/3] bg-slate-950 border border-white/5 rounded-2xl overflow-hidden mb-4 flex flex-col items-center justify-center">
              {/* Animated scanning line */}
              <div className="absolute left-0 right-0 h-0.5 bg-emerald-500/80 shadow-[0_0_10px_#10b981] animate-scannerLine" style={{
                animation: 'scan 2.2s ease-in-out infinite'
              }} />
              
              <div className="border-2 border-dashed border-emerald-500/30 w-48 h-20 rounded-xl flex items-center justify-center text-emerald-500/50 text-[10px] font-mono tracking-widest bg-emerald-500/[0.02]">
                ALIGN BARCODE HERE
              </div>
            </div>
            
            <style>{`
              @keyframes scan {
                0% { top: 10%; }
                50% { top: 90%; }
                100% { top: 10%; }
              }
            `}</style>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider mb-1">Select Circulation Workflow</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setScanAction('borrow')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${scanAction === 'borrow' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                  >
                    Borrow Book
                  </button>
                  <button 
                    onClick={() => setScanAction('return')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${scanAction === 'return' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                  >
                    Return Book
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider mb-1">Scanned Barcode ISBN or Book ID</label>
                <input 
                  type="text" 
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="ISBN-13 (e.g. 978-0131103628) or Book ID"
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {scanAction === 'borrow' && (
                <div>
                  <label className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider mb-1">Student / Member ID</label>
                  <input 
                    type="text" 
                    value={scanMemberId}
                    onChange={(e) => setScanMemberId(e.target.value)}
                    placeholder="Student User ID (e.g. 2)"
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowScanner(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                Cancel Scanner
              </button>
              <button 
                onClick={async () => {
                  const token = localStorage.getItem('nova_jwt_token');
                  if (!scanInput) {
                    alert('Please enter barcode data.');
                    return;
                  }
                  
                  try {
                    if (scanAction === 'borrow') {
                      if (!scanMemberId) {
                        alert('Student Member ID required for borrow operation.');
                        return;
                      }
                      
                      let resolvedBookId = scanInput;
                      if (scanInput.includes('-') || scanInput.length > 5) {
                        const bookRes = await fetch(`http://127.0.0.1:5000/api/books?search=${scanInput}`, {
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const books = await bookRes.json();
                        if (books && books.length > 0) {
                          resolvedBookId = books[0].id;
                        } else {
                          alert('Book with scanned ISBN not found.');
                          return;
                        }
                      }
                      
                      const borrowRes = await fetch(`http://127.0.0.1:5000/api/issues`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          book_id: resolvedBookId,
                          member_id: scanMemberId,
                          due_days: 14
                        })
                      });
                      const borrowData = await borrowRes.json();
                      alert(borrowData.msg);
                    } else {
                      let issueId = scanInput;
                      const issueCheckRes = await fetch(`http://127.0.0.1:5000/api/issues?status=issued`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      const activeIssues = await issueCheckRes.json();
                      const matchingIssue = activeIssues.find((issue: any) => 
                        issue.id === parseInt(scanInput) || 
                        issue.book_id === parseInt(scanInput) ||
                        (issue.book_isbn && issue.book_isbn === scanInput)
                      );
                      
                      if (matchingIssue) {
                        issueId = matchingIssue.id;
                      } else {
                        alert('No active borrow ticket found matching scanned barcode.');
                        return;
                      }
                      
                      const returnRes = await fetch(`http://127.0.0.1:5000/api/issues/${issueId}/return`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      const returnData = await returnRes.json();
                      alert(returnData.msg);
                    }
                    
                    setShowScanner(false);
                    fetchDashboardStats();
                  } catch (scanErr: any) {
                    alert('Error executing scanned transaction: ' + scanErr.message);
                  }
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                Execute Action
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

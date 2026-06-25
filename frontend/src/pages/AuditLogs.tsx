import React, { useState, useEffect } from 'react';
import { Activity, Search, ShieldAlert, Laptop, Globe, Clock, RefreshCw } from 'lucide-react';

interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  details: string;
  ip_address: string;
  browser: string;
  created_at: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/admin/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to load logs');
      setLogs(data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.username.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5.5 h-5.5 text-cyan-400" /> Platform Audit Trails & Security Logs
          </h2>
          <p className="text-xs text-white/50">Track cross-tenant checkouts, returns, administrative updates, and biometric events.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="bg-white/5 hover:bg-white/10 border border-white/10 p-2.5 rounded-xl text-white/60 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 animate-spin-slow" />
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex bg-white/5 border border-white/10 p-2 rounded-2xl max-w-md">
        <Search className="w-4 h-4 text-white/40 my-auto ml-2" />
        <input
          type="text"
          placeholder="Filter logs by username, action, details..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-0 outline-none text-xs text-white px-3 focus:ring-0"
        />
      </div>

      {/* TABLE DATA */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="w-6 h-6 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-panel p-10 text-center text-white/50 text-xs">No active security audit events recorded.</div>
      ) : (
        <div className="glass-panel border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-white/60 uppercase text-[9px] tracking-wider font-semibold border-b border-white/10">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User node</th>
                  <th className="p-4">Action type</th>
                  <th className="p-4">Event description</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4">Agent Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 whitespace-nowrap text-white/50 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-cyan-400" /> {log.created_at}</td>
                    <td className="p-4 whitespace-nowrap font-bold text-white">{log.username}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-600/10 border border-blue-500/20 text-blue-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate leading-normal" title={log.details}>{log.details}</td>
                    <td className="p-4 whitespace-nowrap text-emerald-400 font-mono"><Globe className="w-3.5 h-3.5 inline mr-1 text-emerald-400/40" /> {log.ip_address || "127.0.0.1"}</td>
                    <td className="p-4 whitespace-nowrap text-white/40 max-w-[150px] truncate" title={log.browser}><Laptop className="w-3.5 h-3.5 inline mr-1 text-white/20" /> {log.browser ? log.browser.substring(0, 30) : "System API Core"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

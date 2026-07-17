import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, UserMinus, Search, Edit2, ShieldAlert, Award } from 'lucide-react';

interface Member {
  id: number;
  username: string;
  email: string;
  role: string;
  membership_id: string;
  department: string;
  phone: string;
  status: string;
  reading_score: number;
  achievement_level: string;
  late_return_risk: string;
  books_issued: number;
}

export default function MemberManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, new_registrations: 0 });
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit states
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editScore, setEditScore] = useState(80);

  const handleUpdateStatus = async (memberId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);
      
      fetchMembers();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      let url = `http://127.0.0.1:5000/api/members?search=${encodeURIComponent(search)}`;
      if (dept) url += `&department=${encodeURIComponent(dept)}`;
      if (status) url += `&status=${encodeURIComponent(status)}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);
      
      setMembers(data.members);
      setStats(data.stats);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [dept, status]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/members/${selectedMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reading_score: editScore })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);
      
      alert('Member AI score updated successfully!');
      setSelectedMember(null);
      fetchMembers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 flex items-center justify-between border-white/10">
          <div>
            <span className="text-[10px] text-white/50 uppercase font-semibold">Total Registry</span>
            <h3 className="text-xl font-bold text-white mt-1 m-0">{stats.total}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400"><Users className="w-5 h-5" /></div>
        </div>
        <div className="glass-panel p-4 flex items-center justify-between border-white/10">
          <div>
            <span className="text-[10px] text-white/50 uppercase font-semibold">Active Nodes</span>
            <h3 className="text-xl font-bold text-emerald-400 mt-1 m-0">{stats.active}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-600/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><UserCheck className="w-5 h-5" /></div>
        </div>
        <div className="glass-panel p-4 flex items-center justify-between border-white/10">
          <div>
            <span className="text-[10px] text-white/50 uppercase font-semibold">Inactive Nodes</span>
            <h3 className="text-xl font-bold text-red-400 mt-1 m-0">{stats.inactive}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-600/20 border border-red-500/20 flex items-center justify-center text-red-400"><UserX className="w-5 h-5" /></div>
        </div>
        <div className="glass-panel p-4 flex items-center justify-between border-white/10">
          <div>
            <span className="text-[10px] text-white/50 uppercase font-semibold">New Enrolls</span>
            <h3 className="text-xl font-bold text-cyan-400 mt-1 m-0">{stats.new_registrations}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-600/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400"><Users className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="glass-panel p-4 border-white/10">
        <form onSubmit={(e) => { e.preventDefault(); fetchMembers(); }} className="row g-2">
          <div className="col-md-5">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search directory by email, ID or student files..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none"
              />
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40"><Search className="w-4 h-4" /></span>
            </div>
          </div>
          <div className="col-md-3">
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white"
              style={{ background: '#1e3a8a' }}
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Physics">Physics</option>
              <option value="Literature">Literature</option>
              <option value="Mathematics">Mathematics</option>
            </select>
          </div>
          <div className="col-md-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              style={{ background: '#1e3a8a' }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending Approval</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="col-md-1">
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-2.5 rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all">Filter</button>
          </div>
        </form>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.length === 0 ? (
            <div className="col-span-full text-center text-white/50 py-10 glass-panel">No student records found.</div>
          ) : (
            members.map(m => (
              <div key={m.id} className="glass-panel p-5 border-white/10 flex flex-col justify-between hover:scale-[1.02] duration-300">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-2 border-yellow-400 flex items-center justify-center font-bold text-white bg-white/10 text-sm">
                        {m.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="text-white text-sm font-bold m-0 leading-tight">{m.username}</h5>
                        <span className="text-[10px] text-cyan-400 font-semibold">{m.membership_id}</span>
                      </div>
                    </div>
                    <span className={`badge-status text-[8px] px-2 py-0.5 rounded-full border ${
                      m.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                      m.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
                      m.status === 'inactive' ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' :
                      'bg-slate-500/20 text-slate-400 border-slate-500/20'
                    }`}>
                      {m.status === 'active' && '🟢 Active'}
                      {m.status === 'pending' && '🟡 Pending'}
                      {m.status === 'inactive' && '🔴 Inactive'}
                      {m.status === 'suspended' && '⚫ Suspended'}
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-3 text-xs text-white/70">
                    <div className="flex justify-between"><span>Dept:</span><strong className="text-white">{m.department}</strong></div>
                    <div className="flex justify-between"><span>Email:</span><strong className="text-white truncate max-w-[150px]">{m.email}</strong></div>
                    <div className="flex justify-between"><span>Books Issued:</span><strong className="text-yellow-400">{m.books_issued} issued</strong></div>
                  </div>

                  {/* AI & Gamification metrics */}
                  <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-white/50">
                      <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-yellow-300" /> Reading Rank</span>
                      <strong className="text-white font-bold">{m.achievement_level}</strong>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-white/50">
                      <span className="flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-orange-400" /> Late Return Risk</span>
                      <strong className={`font-bold ${m.late_return_risk === 'High' ? 'text-red-400' : m.late_return_risk === 'Medium' ? 'text-orange-400' : 'text-emerald-400'}`}>{m.late_return_risk}</strong>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="pt-1">
                      <div className="flex justify-between text-[8px] text-white/40 mb-1">
                        <span>Reading Score</span>
                        <span>{m.reading_score}/100</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                        <div className="bg-yellow-400 h-1" style={{ width: `${m.reading_score}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedMember(m); setEditScore(m.reading_score); }}
                      className="flex-1 bg-white/5 border border-white/15 text-white/80 hover:bg-white/10 rounded-lg py-1.5 text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Adjust Score
                    </button>
                  </div>
                  
                  {/* Inline quick status updates */}
                  <div className="flex flex-wrap gap-1 pt-1 justify-between items-center text-[10px]">
                    <span className="text-white/40 font-semibold">Change Status:</span>
                    <div className="flex gap-1">
                      {m.status !== 'active' && (
                        <button 
                          onClick={() => handleUpdateStatus(m.id, 'active')}
                          className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all text-[9px] font-bold cursor-pointer"
                        >
                          Activate
                        </button>
                      )}
                      {m.status === 'active' && (
                        <button 
                          onClick={() => handleUpdateStatus(m.id, 'inactive')}
                          className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-[9px] font-bold cursor-pointer"
                        >
                          Deactivate
                        </button>
                      )}
                      {m.status !== 'suspended' && (
                        <button 
                          onClick={() => handleUpdateStatus(m.id, 'suspended')}
                          className="px-2 py-0.5 rounded bg-slate-500/10 border border-slate-500/30 text-slate-400 hover:bg-slate-500 hover:text-slate-950 transition-all text-[9px] font-bold cursor-pointer"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* EDIT AI SCORE MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm border-white/20 p-5 relative bg-gradient-to-br from-blue-900 to-slate-900 rounded-[20px]">
            <h5 className="text-white font-bold text-sm mb-4">Adjust Reading score: {selectedMember.username}</h5>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-white/60 text-xs font-semibold block mb-1">Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editScore}
                  onChange={(e) => setEditScore(parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-2 rounded-xl text-xs">Save</button>
                <button type="button" onClick={() => setSelectedMember(null)} className="btn btn-glass py-2 text-xs text-white">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

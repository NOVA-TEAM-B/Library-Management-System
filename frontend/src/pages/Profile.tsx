import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, Phone, ShieldCheck, Sparkles } from 'lucide-react';

interface ProfileProps {
  user: any;
  onProfileUpdate: (updatedUser: any) => void;
}

export default function Profile({ user, onProfileUpdate }: ProfileProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dept, setDept] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setPhone(user.phone || '');
      setDept(user.department || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    setLoading(true);
    const body: any = { email, phone };
    if (password) body.password = password;

    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);

      alert('Profile updated successfully!');
      localStorage.setItem('nova_user', JSON.stringify(data.user));
      onProfileUpdate(data.user);
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="row g-4">
        {/* Left Side: Credentials card */}
        <div className="col-lg-4">
          <div className="glass-panel p-6 border-white/10 text-center h-100 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block border-b border-white/5 pb-2">Credentials File</span>
              
              <div className="w-16 h-16 rounded-full border-2 border-amber-400 mx-auto flex items-center justify-center font-bold text-white text-lg bg-white/10">
                {user.username.substring(0, 2).toUpperCase()}
              </div>

              <h4 className="text-white font-extrabold m-0 text-lg">{user.username}</h4>
              <span className="bg-blue-600/30 border border-blue-500/30 text-blue-300 font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider block max-w-xs mx-auto">
                {user.role}
              </span>

              <div className="text-left text-xs text-white/70 space-y-2.5 pt-4 border-t border-white/5">
                <div className="flex justify-between"><span>Membership ID:</span><strong className="text-white">{user.membership_id || 'N/A'}</strong></div>
                <div className="flex justify-between"><span>Department:</span><strong className="text-white">{user.department}</strong></div>
                <div className="flex justify-between"><span>Reading Score:</span><strong className="text-cyan-400">{user.reading_score} pts</strong></div>
                <div className="flex justify-between"><span>Rank Level:</span><strong className="text-yellow-400">{user.achievement_level}</strong></div>
                <div className="flex justify-between items-center">
                  <span>Account Status:</span>
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-full border ${
                    user.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                    user.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
                    user.status === 'inactive' ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' :
                    'bg-slate-500/20 text-slate-400 border-slate-500/20'
                  }`}>
                    {user.status === 'active' && '🟢 Active'}
                    {user.status === 'pending' && '🟡 Pending'}
                    {user.status === 'inactive' && '🔴 Inactive'}
                    {user.status === 'suspended' && '⚫ Suspended'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-white/35 mt-6">
              Neural Node registered: {user.created_at ? user.created_at.split(' ')[0] : '-'}
            </div>
          </div>
        </div>

        {/* Right Side: Edit Form */}
        <div className="col-lg-8">
          <div className="glass-panel p-6 border-white/10 h-100">
            <h4 className="text-white text-base font-semibold mb-6 flex items-center gap-2"><User className="w-5 h-5 text-warning" /> Modify Registry Details</h4>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="text-white/60 text-xs font-semibold block mb-1">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40"><Mail className="w-4 h-4" /></span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="text-white/60 text-xs font-semibold block mb-1">Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40"><Phone className="w-4 h-4" /></span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-white/60 text-xs font-semibold block mb-1">Department</label>
                <input
                  type="text"
                  value={dept}
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white/50 cursor-not-allowed"
                />
                <small className="text-[10px] text-white/40 mt-1 d-block">Department registry locks are managed by system administrators.</small>
              </div>

              <h5 className="text-white font-bold text-xs mt-6 mb-3 flex items-center gap-1.5"><Lock className="w-4.5 h-4.5 text-warning" /> Modify Access Key</h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="text-white/60 text-xs font-semibold block mb-1">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to preserve current"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="col-md-6">
                  <label className="text-white/60 text-xs font-semibold block mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Leave blank to preserve current"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold px-6 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" /> Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

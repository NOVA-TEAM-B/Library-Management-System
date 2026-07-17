import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, Database, Key, Building, Save, CheckCircle, 
  RefreshCw, Upload, Shield, CreditCard, Plus, Trash, UserCheck, HardDrive, Check 
} from 'lucide-react';

export default function Settings() {
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'roles' | 'api' | 'subscription'>('branding');
  
  // Organization General parameters
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [fineRate, setFineRate] = useState('5.0');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Upload and DB Backup
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  // Theme selection configuration (persisted to localStorage org info)
  const [orgTheme, setOrgTheme] = useState('tokyo-night');

  // API Credentials States
  const [apiKeys, setApiKeys] = useState<any[]>([
    { id: 1, name: 'Client Portal Production', key: 'nova_live_key_a8f9024bc61e1b4b', created: '2026-04-12' },
    { id: 2, name: 'Analytics Sync Stream', key: 'nova_live_key_33ad789ff2bf3e2d', created: '2026-06-18' }
  ]);
  const [newKeyName, setNewKeyName] = useState('');

  // Staff registry
  const [staffList, setStaffList] = useState<any[]>([
    { id: 1, username: 'admin_primary', email: 'admin@nova.edu', role: 'admin', privileges: 'Full System Admin Access' },
    { id: 2, username: 'librarian_clara', email: 'clara@nova.edu', role: 'librarian', privileges: 'Catalog, Circulation & Reports' },
    { id: 3, username: 'staff_alex', email: 'alex@nova.edu', role: 'librarian', privileges: 'Catalog & Borrow Checkouts' }
  ]);
  const [newStaffUser, setNewStaffUser] = useState({ username: '', email: '', role: 'librarian', privileges: 'Catalog & Borrow Checkouts' });

  // Subscription Mock Telemetry
  const billingHistory = [
    { invoice: 'INV-2026-004', date: '2026-07-01', plan: 'Enterprise Hub', amount: '₹4,120.00', status: 'Paid' },
    { invoice: 'INV-2026-003', date: '2026-06-01', plan: 'Enterprise Hub', amount: '₹4,120.00', status: 'Paid' },
    { invoice: 'INV-2026-002', date: '2026-05-01', plan: 'Enterprise Hub', amount: '₹4,120.00', status: 'Paid' }
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('nova_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setName(parsed.org_name || 'MIT Tech Institute');
      setFineRate(parsed.fine_rate || '5.0');
      setLogoUrl(parsed.org_logo || '/logo.png');
      setOrgTheme(parsed.org_theme || 'tokyo-night');
    }
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setErrorMsg('');

    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          logo_url: logoUrl,
          fine_rate: parseFloat(fineRate)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to update settings');

      setMsg('Organization settings updated successfully!');
      
      // Update local storage values too
      const storedUser = localStorage.getItem('nova_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.org_name = name;
        parsed.fine_rate = parseFloat(fineRate);
        parsed.org_logo = logoUrl;
        parsed.org_theme = orgTheme;
        localStorage.setItem('nova_user', JSON.stringify(parsed));
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Logo size exceeds 5 MB limit.");
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.");
      return;
    }

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/admin/upload-logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Logo upload failed");

      setLogoUrl(data.logo_url);
      alert("Logo uploaded successfully!");
    } catch (err: any) {
      alert("Logo upload failed: " + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBackup = () => {
    setBackingUp(true);
    setBackupSuccess(false);
    setTimeout(() => {
      setBackingUp(false);
      setBackupSuccess(true);
    }, 1800);
  };

  const handleGenerateApiKey = () => {
    if (!newKeyName.trim()) return;
    const randomHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newKeyObj = {
      id: Date.now(),
      name: newKeyName,
      key: `nova_live_key_${randomHex}`,
      created: new Date().toISOString().split('T')[0]
    };
    setApiKeys([...apiKeys, newKeyObj]);
    setNewKeyName('');
    alert('API Credential Key generated successfully!');
  };

  const handleDeleteApiKey = (id: number) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffUser.username.trim() || !newStaffUser.email.trim()) return;
    setStaffList([...staffList, { ...newStaffUser, id: Date.now() }]);
    setNewStaffUser({ username: '', email: '', role: 'librarian', privileges: 'Catalog & Borrow Checkouts' });
    alert('Staff invitation node registered successfully!');
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-5.5 h-5.5 text-cyan-400" /> Platform & Organization Settings
        </h2>
        <p className="text-xs text-white/50">Manage branding defaults, staff permissions, webhook API keys, and subscription limits.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Settings Left Navigation Sidebar */}
        <aside className="w-full lg:w-60 shrink-0 glass-panel border-white/5 bg-slate-900/30 p-4 rounded-2xl space-y-1.5 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible">
          {[
            { id: 'branding', label: 'Identity & Colors', icon: Building },
            { id: 'roles', label: 'Staff Privileges', icon: UserCheck },
            { id: 'api', label: 'API Credentials', icon: Key },
            { id: 'subscription', label: 'Plan & Telemetry', icon: CreditCard }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === tab.id 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Settings Tab Workspaces */}
        <div className="flex-1 w-full space-y-6">

          {/* 1. IDENTITY & BRANDING TAB */}
          {activeSubTab === 'branding' && (
            <div className="glass-panel p-5 border-white/10 space-y-6">
              <div>
                <h4 className="text-white text-sm font-bold flex items-center gap-2 m-0 border-b border-white/5 pb-2">
                  <Building className="w-4 h-4 text-blue-400" /> Brand Identity & Customization
                </h4>
                <p className="text-white/40 text-[10px] mt-1">Settle your college node defaults, logos, and custom accent styles.</p>
              </div>

              {msg && <div className="p-2.5 rounded bg-green-500/10 border border-green-500/20 text-green-300 text-[10px] text-center flex items-center justify-center gap-1.5"><CheckCircle className="w-4 h-4" /> {msg}</div>}
              {errorMsg && <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] text-center">{errorMsg}</div>}

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 block mb-1 font-semibold">Institution Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 block mb-1 font-semibold">Fine Rate Per Day (INR)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={fineRate}
                      onChange={e => setFineRate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/60 block mb-1 font-semibold">Institution Logo Image</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={e => setLogoUrl(e.target.value)}
                      placeholder="Logo URL path"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Upload className="w-3.5 h-3.5" /> {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </button>
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Accent Theme Customizer */}
                <div>
                  <label className="text-white/60 block mb-2 font-semibold">Default Accent Branding Theme</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'tokyo-night', name: 'Tokyo Night', desc: 'Neon Cyber Dark', color: 'bg-[#8b5cf6]' },
                      { id: 'soft-sakura', name: 'Soft Sakura', desc: 'Cherry Blossom Light', color: 'bg-[#f43f5e]' },
                      { id: 'reading-room', name: 'Reading Room', desc: 'Vintage Academia', color: 'bg-[#fbbf24]' },
                      { id: 'blue-sky', name: 'Blue Sky', desc: 'Vibrant Sky Day', color: 'bg-[#0284c7]' }
                    ].map(theme => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setOrgTheme(theme.id)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                          orgTheme === theme.id 
                            ? 'border-cyan-400 bg-white/10 shadow-lg scale-102' 
                            : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg ${theme.color} border border-white/15`} />
                        <div>
                          <strong className="text-[10px] text-white block mt-2 font-bold">{theme.name}</strong>
                          <span className="text-[8px] text-white/40 block mt-0.5">{theme.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-600 hover:to-blue-600 text-white font-bold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> {loading ? 'Saving Parameters...' : 'Save Settings'}
                  </button>
                </div>
              </form>

              {/* Database Backups Workspace */}
              <div className="border-t border-white/5 pt-5 space-y-4">
                <div>
                  <h5 className="text-white font-bold flex items-center gap-2 m-0">
                    <Database className="w-4 h-4 text-emerald-400" /> Database Backup Snapping
                  </h5>
                  <p className="text-white/40 text-[10px] mt-1">Export full telemetry, catalog details, and checkout history into a secure JSON schema.</p>
                </div>

                {backupSuccess && (
                  <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] text-center font-mono">
                    System Backup Node [MIT_SYS_SNAPSHOT_{new Date().toISOString().split('T')[0]}.json] Created successfully!
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleBackup}
                  disabled={backingUp}
                  className="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {backingUp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Compiling Backup Node...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 text-emerald-400" /> Compile DB Backup
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 2. STAFF ROLES & PRIVILEGES TAB */}
          {activeSubTab === 'roles' && (
            <div className="glass-panel p-5 border-white/10 space-y-6">
              <div>
                <h4 className="text-white text-sm font-bold flex items-center gap-2 m-0 border-b border-white/5 pb-2">
                  <UserCheck className="w-4 h-4 text-purple-400" /> Staff Roles & Privileges
                </h4>
                <p className="text-white/40 text-[10px] mt-1">List active staff delegates and invite new nodes to manage catalog circulation.</p>
              </div>

              {/* Invite staff form */}
              <form onSubmit={handleAddStaff} className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 space-y-4">
                <h5 className="text-white font-bold m-0">Invite New Staff Console</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Username"
                    value={newStaffUser.username}
                    onChange={(e) => setNewStaffUser({ ...newStaffUser, username: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={newStaffUser.email}
                    onChange={(e) => setNewStaffUser({ ...newStaffUser, email: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                  <select
                    value={newStaffUser.role}
                    onChange={(e) => {
                      const role = e.target.value;
                      const privileges = role === 'admin' ? 'Full System Admin Access' : 'Catalog & Borrow Checkouts';
                      setNewStaffUser({ ...newStaffUser, role, privileges });
                    }}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    style={{ background: '#0b0f19' }}
                  >
                    <option value="librarian">Librarian (Staff)</option>
                    <option value="admin">Administrator (Org Admin)</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/10 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Send Invite Node
                  </button>
                </div>
              </form>

              {/* Staff table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-white/50 uppercase font-bold text-[9px] tracking-wider">
                      <th className="pb-2">Username</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Role Tag</th>
                      <th className="pb-2">Privilege Console</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {staffList.map(staff => (
                      <tr key={staff.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 font-semibold text-white">{staff.username}</td>
                        <td className="py-3">{staff.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            staff.role === 'admin' 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}>
                            {staff.role}
                          </span>
                        </td>
                        <td className="py-3 text-[10px] text-white/60">{staff.privileges}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. API CREDENTIALS TAB */}
          {activeSubTab === 'api' && (
            <div className="glass-panel p-5 border-white/10 space-y-6">
              <div>
                <h4 className="text-white text-sm font-bold flex items-center gap-2 m-0 border-b border-white/5 pb-2">
                  <Key className="w-4 h-4 text-yellow-400" /> Developer API Credentials
                </h4>
                <p className="text-white/40 text-[10px] mt-1">Generate API key parameters to hook into external catalog feeds and system statistics.</p>
              </div>

              {/* Generate new key form */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-white/60 block mb-1 font-semibold">Key Identifier / Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mobile Catalog Integration"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerateApiKey}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Generate API Key
                </button>
              </div>

              {/* API keys list */}
              <div className="space-y-4">
                <h5 className="text-white font-bold m-0 border-b border-white/5 pb-2">Active Org Client Keys</h5>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">No developer API keys active.</div>
                ) : (
                  <div className="space-y-3.5">
                    {apiKeys.map(key => (
                      <div key={key.id} className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 flex justify-between items-center gap-4">
                        <div className="space-y-1 min-w-0">
                          <strong className="text-white block font-bold text-xs">{key.name}</strong>
                          <code className="text-[9px] text-yellow-300 font-mono block bg-black/30 p-1.5 rounded border border-white/5 truncate max-w-sm mt-1">
                            {key.key}
                          </code>
                          <span className="text-[8px] text-white/40 block">Created on {key.created}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteApiKey(key.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. PLAN & TELEMETRY TAB */}
          {activeSubTab === 'subscription' && (
            <div className="glass-panel p-5 border-white/10 space-y-6">
              <div>
                <h4 className="text-white text-sm font-bold flex items-center gap-2 m-0 border-b border-white/5 pb-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" /> Subscription & Storage Telemetry
                </h4>
                <p className="text-white/40 text-[10px] mt-1">Inspect your system quotas, active contract pricing, and transaction logs.</p>
              </div>

              {/* Telemetry metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Plan status card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-white/5 space-y-3">
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">Current Package Tier</span>
                  <div className="flex justify-between items-center">
                    <strong className="text-lg text-white font-extrabold">NOVA Enterprise Hub</strong>
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-bold text-[8px] uppercase">
                      Active
                    </span>
                  </div>
                  <p className="text-white/50 text-[10px]">Your institutional billing cycle renews on August 01, 2026. Rate is $49.00/month.</p>
                </div>

                {/* Storage usage metric */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-white/5 space-y-3">
                  <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider block">Digital PDF Cloud Storage</span>
                  <div className="flex justify-between items-baseline text-white">
                    <strong className="text-lg font-extrabold">42.5 MB</strong>
                    <span className="text-[10px] text-white/40">of 500.0 MB Limit (8.5%)</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: '8.5%' }}></div>
                  </div>
                </div>

              </div>

              {/* Billing history table */}
              <div className="space-y-3">
                <h5 className="text-white font-bold m-0 border-b border-white/5 pb-2">Recent Invoices</h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-white/50 uppercase font-bold text-[9px] tracking-wider">
                        <th className="pb-2">Invoice ID</th>
                        <th className="pb-2">Billing Date</th>
                        <th className="pb-2">Subscribed Plan</th>
                        <th className="pb-2">Total amount</th>
                        <th className="pb-2">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      {billingHistory.map((invoice, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.01]">
                          <td className="py-3 font-semibold text-white">{invoice.invoice}</td>
                          <td className="py-3 font-mono">{invoice.date}</td>
                          <td className="py-3">{invoice.plan}</td>
                          <td className="py-3 text-emerald-400 font-bold">{invoice.amount}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-max">
                              <Check className="w-3 h-3" /> {invoice.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

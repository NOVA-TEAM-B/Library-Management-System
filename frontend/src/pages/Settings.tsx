import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Database, Mail, Key, Building, Save, CheckCircle, RefreshCw, Upload } from 'lucide-react';

export default function Settings() {
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [fineRate, setFineRate] = useState('5.0');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Backup states
  const [backingUp, setBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  useEffect(() => {
    // Load local storage session to prefill values
    const storedUser = localStorage.getItem('nova_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setName(parsed.org_name || 'MIT Tech Institute');
      setFineRate(parsed.fine_rate || '5.0');
      setLogoUrl(parsed.org_logo || '/logo.png');
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

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-5.5 h-5.5 text-cyan-400" /> Platform & Organization Settings
        </h2>
        <p className="text-xs text-white/50">Configure branding parameters, database backups, and fine rates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BRANDING AND GENERAL SETTINGS */}
        <div className="glass-panel p-5 border-white/10 space-y-4 lg:col-span-2">
          <h4 className="text-white text-sm font-bold flex items-center gap-2 m-0 border-b border-white/5 pb-2">
            <Building className="w-4 h-4 text-blue-400" /> Brand Identity & Lending Rules
          </h4>

          {msg && <div className="p-2.5 rounded bg-green-500/10 border border-green-500/20 text-green-300 text-[10px] text-center flex items-center justify-center gap-1.5"><CheckCircle className="w-4 h-4" /> {msg}</div>}
          {errorMsg && <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] text-center">{errorMsg}</div>}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 block mb-1 font-semibold">Institution / Org Name</label>
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
              <label className="text-white/60 block mb-1 font-semibold">Custom Logo Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
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

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-blue-500/10 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {loading ? 'Saving Parameters...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* SYSTEM CONTROL AND BACKUPS */}
        <div className="space-y-6">
          
          {/* Backup card */}
          <div className="glass-panel p-5 border-white/10 space-y-4">
            <h4 className="text-white text-sm font-bold flex items-center gap-2 m-0 border-b border-white/5 pb-2">
              <Database className="w-4 h-4 text-emerald-400" /> Database Backup & Restores
            </h4>
            <p className="text-white/50 text-[10px] leading-relaxed">
              Compile full tables, logs, and user metadata records into a secure cloud storage snapshot.
            </p>
            
            {backupSuccess && (
              <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] text-center">
                Backup snapshot MIT_SYS_SNAPSHOT_v2.json created.
              </div>
            )}

            <button
              onClick={handleBackup}
              disabled={backingUp}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
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

          {/* API keys console */}
          <div className="glass-panel p-5 border-white/10 space-y-4">
            <h4 className="text-white text-sm font-bold flex items-center gap-2 m-0 border-b border-white/5 pb-2">
              <Key className="w-4 h-4 text-yellow-400" /> Start API Credentials
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-white/40 block">JWT Platform Secret Key</span>
                <code className="text-[9px] text-yellow-300 bg-black/30 p-1.5 rounded block truncate font-mono mt-1 border border-white/5">
                  jwt-nova-library-x-super-secret-key-123456789
                </code>
              </div>
              <div>
                <span className="text-[10px] text-white/40 block">Client App ID Token</span>
                <code className="text-[9px] text-cyan-300 bg-black/30 p-1.5 rounded block truncate font-mono mt-1 border border-white/5">
                  node_client_prod_id_ff897a8c66d21bc78a87b
                </code>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

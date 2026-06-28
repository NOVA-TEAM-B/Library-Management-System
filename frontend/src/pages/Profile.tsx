import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Lock, Mail, Phone, ShieldCheck, Sparkles, Camera, 
  Upload, Trash2, Printer, Download, Eye, EyeOff, Globe, Bell, 
  Smartphone, Laptop, Compass, Shield
} from 'lucide-react';

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
  
  // Custom preferences states
  const [avatarUrl, setAvatarUrl] = useState('');
  const [themePref, setThemePref] = useState('tokyo-night');
  const [langPref, setLangPref] = useState('en');
  const [twoFactor, setTwoFactor] = useState(false);
  const [emailNotify, setEmailNotify] = useState(true);
  const [smsNotify, setSmsNotify] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'preferences' | 'security'>('details');

  // Digital ID Flip state
  const [isFlipped, setIsFlipped] = useState(false);

  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Predefined Anime Presets URLs (illustrated Unsplash coordinates)
  const animePresets = [
    { name: 'Sakura Scholar', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&q=80' },
    { name: 'Midnight Cyber', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&q=80' },
    { name: 'Golden Sage', url: 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=150&q=80' },
    { name: 'Sapphire Student', url: 'https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=150&q=80' }
  ];

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setPhone(user.phone || '');
      setDept(user.department || 'General');
      setAvatarUrl(user.avatar_url || '');
      setThemePref(user.theme_preference || 'tokyo-night');
      setLangPref(user.language_preference || 'en');
      setTwoFactor(user.two_factor_enabled || false);
      setEmailNotify(user.notify_email !== false);
      setSmsNotify(user.notify_sms || false);
    }
  }, [user]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // 1. Dynamic Barcode Generator (SVG)
  const generateBarcodeSVG = (id: string) => {
    const bars = [];
    const seed = id || "MEM-1001";
    let x = 12;
    for (let i = 0; i < seed.length; i++) {
      const charCode = seed.charCodeAt(i);
      const w1 = (charCode % 3 === 0) ? 3 : 1;
      const w2 = (charCode % 2 === 0) ? 2 : 1;
      bars.push(<rect key={`b1-${i}`} x={x} y={5} width={w1} height={28} fill="currentColor" />);
      x += w1 + 1;
      bars.push(<rect key={`b2-${i}`} x={x} y={5} width={w2} height={28} fill="currentColor" />);
      x += w2 + 1.5;
    }
    return (
      <svg className="w-full h-11 text-slate-100/90" viewBox="0 0 160 42" xmlns="http://www.w3.org/2000/svg">
        {bars}
        <text x="50%" y="38" fill="currentColor" fontSize="6.5" textAnchor="middle" letterSpacing="2.5" className="font-mono font-semibold">{seed}</text>
      </svg>
    );
  };

  // 2. Dynamic QR Code Generator (SVG)
  const generateQRCodeSVG = (id: string) => {
    const cells = [];
    const seed = id || "MEM-1001";
    
    // Finder Patterns
    // Top-Left
    cells.push(<rect key="tl-out" x={4} y={4} width={12} height={12} fill="currentColor" />);
    cells.push(<rect key="tl-in" x={6} y={6} width={8} height={8} fill="none" stroke="#000000" strokeWidth="2" />);
    // Top-Right
    cells.push(<rect key="tr-out" x={36} y={4} width={12} height={12} fill="currentColor" />);
    cells.push(<rect key="tr-in" x={38} y={6} width={8} height={8} fill="none" stroke="#000000" strokeWidth="2" />);
    // Bottom-Left
    cells.push(<rect key="bl-out" x={4} y={36} width={12} height={12} fill="currentColor" />);
    cells.push(<rect key="bl-in" x={6} y={38} width={8} height={8} fill="none" stroke="#000000" strokeWidth="2" />);

    // Random matrices based on ID hash
    let idx = 0;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const isFinder = (r < 3 && c < 3) || (r < 3 && c > 6) || (r > 6 && c < 3);
        if (!isFinder) {
          const charVal = seed.charCodeAt(idx % seed.length);
          if ((charVal + r * c * 7) % 3 === 0) {
            cells.push(<rect key={`dot-${r}-${c}`} x={4 + c * 4.5} y={4 + r * 4.5} width={3.5} height={3.5} fill="currentColor" />);
          }
          idx++;
        }
      }
    }

    return (
      <svg className="w-20 h-20 text-white" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
        {cells}
      </svg>
    );
  };

  // 3. Camera Controls
  const startCamera = async () => {
    setShowCamera(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 200, height: 200, facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      alert('Camera access denied or unavailable: ' + err.message);
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 150, 150);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setAvatarUrl(dataUrl);
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // 4. File Upload Drag/Drop via multipart/form-data
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5 MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5 MB limit.");
      return;
    }

    // Validate extension
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/auth/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Avatar upload failed");

      setAvatarUrl(data.avatar_url);
      
      // Update local storage user details too
      const storedUser = localStorage.getItem('nova_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.avatar_url = data.avatar_url;
        localStorage.setItem('nova_user', JSON.stringify(parsed));
      }

      alert("Avatar uploaded successfully!");
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // 5. Submit Preferences Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      alert('Access key passwords do not match.');
      return;
    }

    setLoading(true);
    const body: any = { 
      email, 
      phone,
      avatar_url: avatarUrl,
      theme_preference: themePref,
      language_preference: langPref,
      two_factor_enabled: twoFactor,
      notify_email: emailNotify,
      notify_sms: smsNotify
    };
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

      alert('Enterprise profile updated successfully!');
      localStorage.setItem('nova_user', JSON.stringify(data.user));
      onProfileUpdate(data.user);
      setPassword('');
      confirmPassword && setConfirmPassword('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const printIDCard = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5.5 h-5.5 text-cyan-400" /> Member Security Credentials
          </h2>
          <p className="text-xs text-white/50">Redeem awards, scan ID tokens, and modify notification routes.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={printIDCard}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Digital ID
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* LEFT COLUMN: Flippable ID Card & Profile Photo controls */}
        <div className="col-xl-4 col-lg-5">
          <div className="space-y-6">
            
            {/* 3D FLIPPABLE ID CARD CONTAINER */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/40 block mb-2 uppercase tracking-wider font-semibold">Hover / click to flip card</span>
              <div 
                className={`card-flip-container cursor-pointer ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className="card-flip-inner">
                  
                  {/* FRONT SIDE */}
                  <div className="card-flip-front glass-panel p-5 bg-gradient-to-br from-indigo-900/40 via-slate-900/60 to-purple-900/40 border border-indigo-500/20 shadow-2xl flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {user?.org_logo ? (
                          <img src={user.org_logo} className="w-6 h-6 rounded-full object-contain bg-white/5 border border-white/10 p-0.5" alt="Org Logo" />
                        ) : (
                          <img src="/logo-icon.svg?v=2" className="w-6 h-6 object-contain" alt="Logo" />
                        )}
                        <div>
                          <h5 className="font-extrabold text-[10px] text-white uppercase tracking-wider leading-none">{user?.org_name || 'NOVA LIBRARY'}</h5>
                          <span className="text-[7px] text-cyan-400 font-bold block uppercase tracking-widest mt-0.5">ACADEMIC CARD</span>
                        </div>
                      </div>
                      <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-0.5">
                        ✓ Verified
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5 my-3">
                      {avatarUrl ? (
                        <img src={avatarUrl} className="w-13 h-13 rounded-xl object-cover border border-cyan-400/30 bg-slate-950" alt="" />
                      ) : (
                        <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-base border border-cyan-400/20">
                          {user.username.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-extrabold text-sm text-white m-0 tracking-tight leading-tight">{user.username}</h4>
                        <span className="text-[8.5px] text-white/50 block font-bold uppercase tracking-wider mt-0.5">{user.role}</span>
                        <span className="text-[7.5px] text-cyan-300 font-mono block mt-1">ID: {user.membership_id || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Dynamic Barcode element */}
                    <div className="border-t border-white/5 pt-3">
                      {generateBarcodeSVG(user.membership_id)}
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div className="card-flip-back glass-panel p-5 bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-indigo-950/40 border border-purple-500/20 shadow-2xl flex items-center justify-between">
                    <div className="space-y-2 text-white/80">
                      <div>
                        <span className="text-[8px] text-white/40 block uppercase font-bold tracking-wider">Academic Rank</span>
                        <strong className="text-yellow-400 font-bold text-xs">{user.achievement_level || 'Bronze Reader'}</strong>
                      </div>
                      <div>
                        <span className="text-[8px] text-white/40 block uppercase font-bold tracking-wider">Reading Score</span>
                        <strong className="text-cyan-400 font-mono text-[11px]">{user.reading_score || 75} PTS</strong>
                      </div>
                      <div>
                        <span className="text-[8px] text-white/40 block uppercase font-bold tracking-wider">Registered Node</span>
                        <span className="text-white font-mono text-[9px]">{user.created_at ? user.created_at.split(' ')[0] : 'N/A'}</span>
                      </div>
                      <span className="text-[7px] text-white/30 block mt-2">NOVA INTEGRATED SECURE QR</span>
                    </div>

                    {/* Dynamic QR Code element */}
                    <div className="bg-slate-950 p-2 rounded-xl border border-white/10 flex items-center justify-center">
                      {generateQRCodeSVG(user.membership_id)}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* AVATAR PHOTO MANAGEMENT PANEL */}
            <div className="glass-panel p-5 border-white/10 space-y-4">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Camera className="w-4.5 h-4.5 text-cyan-400" /> Identity Avatar Editor
              </h4>

              {/* Photo Options Preview */}
              <div className="flex justify-center">
                {showCamera ? (
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-cyan-400 bg-slate-950">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={capturePhoto} 
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-full p-1.5 shadow-lg border border-white/10"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative group w-28 h-28 rounded-2xl overflow-hidden border border-white/10 bg-slate-950/60 shadow flex items-center justify-center">
                    {uploading && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-filter backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {avatarUrl ? (
                      <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="font-extrabold text-white/30 text-2xl">{user.username.substring(0, 2).toUpperCase()}</div>
                    )}
                    {avatarUrl && (
                      <button 
                        type="button" 
                        onClick={() => setAvatarUrl('')} 
                        className="absolute top-1.5 right-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-white flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                {showCamera ? (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 rounded-xl font-bold text-red-300 flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-white flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" /> Take Photo
                  </button>
                )}
              </div>

              {/* Anime Presets Selection */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-[9px] text-white/40 block font-semibold uppercase tracking-wider">Premium Anime Presets</span>
                <div className="grid grid-cols-4 gap-2">
                  {animePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      className={`relative group rounded-xl overflow-hidden aspect-square border hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer ${avatarUrl === preset.url ? 'border-cyan-400 shadow-md shadow-cyan-500/10' : 'border-white/5'}`}
                      title={preset.name}
                    >
                      <img src={preset.url} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[7px] text-white font-semibold">
                        Select
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Control details & preferences tabs */}
        <div className="col-xl-8 col-lg-7">
          <div className="glass-panel p-6 h-100 flex flex-col justify-between border-white/10">
            
            {/* TABS SELECTOR */}
            <div>
              <div className="flex border-b border-white/10 pb-1 mb-6 text-xs text-white/50 gap-6 font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('details')}
                  className={`pb-2.5 transition-all flex items-center gap-1 cursor-pointer ${activeSubTab === 'details' ? 'border-b-2 border-cyan-400 text-white' : 'hover:text-white'}`}
                >
                  <User className="w-4 h-4" /> Personal Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('preferences')}
                  className={`pb-2.5 transition-all flex items-center gap-1 cursor-pointer ${activeSubTab === 'preferences' ? 'border-b-2 border-cyan-400 text-white' : 'hover:text-white'}`}
                >
                  <Globe className="w-4 h-4" /> App Preferences
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('security')}
                  className={`pb-2.5 transition-all flex items-center gap-1 cursor-pointer ${activeSubTab === 'security' ? 'border-b-2 border-cyan-400 text-white' : 'hover:text-white'}`}
                >
                  <Shield className="w-4 h-4" /> Security Logs
                </button>
              </div>

              {/* TABS VIEWS */}
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. PERSONAL DETAILS TAB */}
                {activeSubTab === 'details' && (
                  <div className="space-y-4">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="text-white/60 font-semibold block mb-1">Username (Unchangeable)</label>
                        <input
                          type="text"
                          value={user?.username || ''}
                          disabled
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/40 cursor-not-allowed"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="text-white/60 font-semibold block mb-1">Department</label>
                        <input
                          type="text"
                          value={dept}
                          onChange={(e) => setDept(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="text-white/60 font-semibold block mb-1">Email Address</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40"><Mail className="w-4 h-4" /></span>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="text-white/60 font-semibold block mb-1">Phone Number</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40"><Phone className="w-4 h-4" /></span>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>
                    </div>

                    <h5 className="text-white font-bold text-xs mt-6 mb-2 border-b border-white/5 pb-2 flex items-center gap-1.5"><Lock className="w-4 h-4 text-warning" /> Change System Password</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="text-white/60 font-semibold block mb-1">New Password</label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Preserve current access key if empty"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="text-white/60 font-semibold block mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Preserve current access key if empty"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PREFERENCES TAB */}
                {activeSubTab === 'preferences' && (
                  <div className="space-y-5">
                    
                    {/* Theme selector */}
                    <div>
                      <label className="text-white/60 font-semibold block mb-2 flex items-center gap-1"><Compass className="w-4.5 h-4.5 text-cyan-400" /> Academic Theme Preferences</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { id: 'tokyo-night', name: 'Tokyo Night', desc: 'Neon Cyber Dark', color: 'bg-gradient-to-br from-[#0c0f1d] to-[#8b5cf6]' },
                          { id: 'soft-sakura', name: 'Soft Sakura', desc: 'Cherry Blossom Pastel', color: 'bg-gradient-to-br from-[#fff3f5] to-[#f43f5e]' },
                          { id: 'reading-room', name: 'Reading Room', desc: 'Vintage Academia', color: 'bg-gradient-to-br from-[#1c1410] to-[#fbbf24]' },
                          { id: 'blue-sky', name: 'Blue Sky', desc: 'Vibrant Light Day', color: 'bg-gradient-to-br from-[#e0f2fe] to-[#0284c7]' }
                        ].map(theme => (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => setThemePref(theme.id)}
                            className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${themePref === theme.id ? 'border-cyan-400 bg-white/10 shadow-lg shadow-cyan-500/5 scale-102' : 'border-white/5 bg-white/[0.02] hover:bg-white/5'}`}
                          >
                            <div className={`w-6 h-6 rounded-lg ${theme.color} border border-white/15`} />
                            <div>
                              <strong className="text-[10px] text-white block mt-2 font-bold">{theme.name}</strong>
                              <span className="text-[8px] text-white/40 block mt-0.5">{theme.desc}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language selector */}
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="text-white/60 font-semibold block mb-1 flex items-center gap-1"><Globe className="w-4 h-4 text-purple-400" /> System Language Node</label>
                        <select
                          value={langPref}
                          onChange={(e) => setLangPref(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                          style={{ background: '#0c0f1d' }}
                        >
                          <option value="en">English (Default)</option>
                          <option value="ja">日本語 (Japanese)</option>
                          <option value="es">Español (Spanish)</option>
                        </select>
                      </div>
                      
                      <div className="col-md-6">
                        <label className="text-white/60 font-semibold block mb-1.5 flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Two-Factor Authentication</label>
                        <div className="flex items-center gap-3 p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={twoFactor} 
                              onChange={(e) => setTwoFactor(e.target.checked)}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:width-4 after:transition-all peer-checked:bg-cyan-500"></div>
                            <span className="ml-3 font-semibold text-white">Enable OTP resends</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Notifications settings */}
                    <div className="space-y-2 pt-2">
                      <label className="text-white/60 font-semibold block flex items-center gap-1"><Bell className="w-4.5 h-4.5 text-yellow-400" /> Notifications & Telemetry Paths</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={emailNotify} 
                            onChange={(e) => setEmailNotify(e.target.checked)}
                            className="rounded bg-transparent border-white/20 text-cyan-500 focus:ring-0" 
                          />
                          <div className="flex items-center gap-2 text-white">
                            <Mail className="w-4 h-4 text-cyan-400" />
                            <div>
                              <strong className="block font-bold">Email Notifications</strong>
                              <span className="text-[8px] text-white/40 block">Due alerts and approvals</span>
                            </div>
                          </div>
                        </label>

                        <label className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={smsNotify} 
                            onChange={(e) => setSmsNotify(e.target.checked)}
                            className="rounded bg-transparent border-white/20 text-cyan-500 focus:ring-0" 
                          />
                          <div className="flex items-center gap-2 text-white">
                            <Smartphone className="w-4 h-4 text-purple-400" />
                            <div>
                              <strong className="block font-bold">SMS Notifications</strong>
                              <span className="text-[8px] text-white/40 block">Real-time check-out feeds</span>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                  </div>
                )}

                {/* 3. SECURITY LOGS TAB */}
                {activeSubTab === 'security' && (
                  <div className="space-y-4">
                    <label className="text-white/60 font-semibold block flex items-center gap-1.5"><Shield className="w-4.5 h-4.5 text-rose-400" /> Active Session Diagnostics</label>
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {[
                        { device: 'Windows Desktop Node', agent: 'Chrome Enterprise v118', ip: '127.0.0.1 (Localhost)', status: 'Active Session', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: Laptop },
                        { device: 'Safari Mobile Device', agent: 'Safari iOS Mobile v17.1', ip: '192.168.1.108 (Wi-Fi)', status: 'Inactive / Logged Out', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Smartphone },
                        { device: 'Linux Admin CLI Node', agent: 'Gemini CLI Secure Agent', ip: '10.0.0.45 (Intranet)', status: 'Credential Expired', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: Laptop }
                      ].map((session, idx) => (
                        <div key={idx} className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
                              <session.icon className="w-4 h-4" />
                            </div>
                            <div>
                              <strong className="text-white block font-bold">{session.device}</strong>
                              <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{session.agent} • IP: {session.ip}</span>
                            </div>
                          </div>
                          <span className={`text-[8.5px] px-2 py-0.5 rounded-full border font-bold ${session.color}`}>
                            {session.status}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-center justify-between text-[10px] text-red-300">
                      <span>Suspicious system activity detected? Lock all other active nodes.</span>
                      <button type="button" onClick={() => alert('All other session nodes successfully expired.')} className="px-3 py-1 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all cursor-pointer">Expel Nodes</button>
                    </div>
                  </div>
                )}

                {/* SAVE CONFIG BUTTON */}
                {activeSubTab !== 'security' && (
                  <div className="pt-4 border-t border-white/5 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" /> {loading ? 'Securing Configuration...' : 'Save Configuration'}
                    </button>
                  </div>
                )}

              </form>
            </div>

            {/* Print metadata footer */}
            <div className="text-[8px] text-white/35 flex justify-between border-t border-white/5 pt-4 mt-6">
              <span>SECURITY CERTIFICATE: SHA-256 SYSTEM NODE</span>
              <span>TELEMETRY LEVEL: OPERATIONAL</span>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

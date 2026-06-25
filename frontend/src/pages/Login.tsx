import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Lock, User, Eye, EyeOff, Key, Cpu, BookOpen, Users, Bookmark, 
  X, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Mail, Phone 
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  onBack?: () => void;
}

export default function Login({ onLoginSuccess, onBack }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  
  // Register Fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDept, setRegDept] = useState('Computer Science');
  const [regPhone, setRegPhone] = useState('');

  // OTP States
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [otpTimer, setOtpTimer] = useState(0);

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown hook for OTP
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Autofocus the first OTP input digit box when modal opens
  useEffect(() => {
    if (otpStep === 2) {
      setOtpDigits(Array(6).fill(''));
      setTimeout(() => {
        digitRefs.current[0]?.focus();
      }, 150);
    }
  }, [otpStep]);

  // Mask Identifier Utility
  const maskIdentifier = (id: string) => {
    if (!id) return '';
    if (id.includes('@')) {
      const [local, domain] = id.split('@');
      if (local.length <= 2) {
        return `${local[0]}***@${domain}`;
      }
      const visibleStart = local.slice(0, 2);
      const visibleEnd = local.slice(-1);
      return `${visibleStart}***${visibleEnd}@${domain}`;
    } else {
      const cleaned = id.replace(/\D/g, '');
      if (cleaned.length >= 10) {
        const countryCode = id.startsWith('+') ? id.slice(0, id.length - 10) : '';
        const last4 = cleaned.slice(-4);
        return `${countryCode} ******${last4}`;
      }
      return id;
    }
  };

  const handleGenerateOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpIdentifier.trim()) {
      triggerNotification('Email or Mobile number is required.', 'error');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_or_phone: otpIdentifier })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || data.msg || 'Server Error');

      setOtpStep(2);
      setOtpTimer(30);
      triggerNotification('OTP code has been sent successfully. Please check: Inbox, Spam, Promotions, Updates.', 'success');
    } catch (err: any) {
      triggerNotification('Unable to send OTP. Reason: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('');
    await submitOtpCode(code);
  };

  const submitOtpCode = async (code: string) => {
    if (code.length < 6) {
      triggerNotification('Please enter all 6 digits of the verification code.', 'error');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_or_phone: otpIdentifier, otp_code: code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'OTP validation failed');

      localStorage.setItem('nova_jwt_token', data.token);
      const userObj = { 
        ...data.user, 
        org_name: data.organization?.name, 
        org_logo: data.organization?.logo_url,
        fine_rate: data.organization?.fine_rate
      };
      localStorage.setItem('nova_user', JSON.stringify(userObj));
      triggerNotification('Access code verified! Launching dashboard...', 'success');
      setTimeout(() => {
        onLoginSuccess(userObj);
      }, 1000);
    } catch (err: any) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const numVal = val.replace(/\D/g, '');
    if (!numVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }
    const singleChar = numVal[numVal.length - 1];
    const newDigits = [...otpDigits];
    newDigits[index] = singleChar;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (index < 5 && singleChar) {
      digitRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all digits filled
    const completedCode = newDigits.join('');
    if (completedCode.length === 6) {
      submitOtpCode(completedCode);
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        digitRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const chars = pasted.split('');
      setOtpDigits(chars);
      digitRefs.current[5]?.focus();
      submitOtpCode(pasted);
    }
  };

  // Canvas starfield particle background
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{ x: number; y: number; speedX: number; speedY: number; size: number }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Create particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 2 + 1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      
      particles.forEach((p, idx) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw connections
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 100) {
            ctx.strokeStyle = `rgba(14, 165, 233, ${0.1 * (1 - dist/100)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      triggerNotification('Username and password are required', 'error');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.msg || 'Login failed');
      }

      localStorage.setItem('nova_jwt_token', data.token);
      const userObj = { 
        ...data.user, 
        org_name: data.organization?.name, 
        org_logo: data.organization?.logo_url,
        fine_rate: data.organization?.fine_rate
      };
      localStorage.setItem('nova_user', JSON.stringify(userObj));
      
      triggerNotification('Welcome to Nova Library - Smart Library Management System', 'success');
      setTimeout(() => {
        onLoginSuccess(userObj);
      }, 1000);

    } catch (err: any) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          password: regPassword,
          department: regDept,
          phone: regPhone,
          role: 'member'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Registration failed');

      triggerNotification('Member registration successful. Please log in.', 'success');
      setTimeout(() => {
        setIsRegister(false);
        setUsername(regUsername);
      }, 1500);
      
    } catch (err: any) {
      triggerNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const triggerNotification = (text: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMsg(text);
      setErrorMsg('');
    } else {
      setErrorMsg(text);
      setSuccessMsg('');
    }
  };

  // SVG Circular countdown parameters
  const radius = 20;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (otpTimer / 30) * circumference;

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center p-4 overflow-hidden bg-radial from-slate-900 to-slate-950">
      {/* Background Star Constellation Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Auth Box Container */}
      <motion.div 
        layout
        className="relative z-10 glass-panel max-w-md w-full p-8 overflow-hidden rounded-[30px] pt-12 bg-slate-900/40 border border-white/10 shadow-2xl" 
        style={{ backdropFilter: 'blur(40px)' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-4 left-6 text-[10px] font-bold text-white/50 hover:text-white transition-colors flex items-center gap-1 cursor-pointer z-20"
          >
            ← Back to Home
          </button>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-filter backdrop-blur-sm z-50 flex flex-col justify-center items-center rounded-[30px]">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="mt-4 text-white text-sm font-semibold tracking-wide">Initiating Security Node...</span>
          </div>
        )}

        {/* LOGO AND BRANDING */}
        <div className="text-center mb-6">
          <img
            src="/logo.svg"
            alt="Nova Logo"
            className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-cyan-500/20 shadow-2xl hover:border-cyan-400 duration-300"
          />
          <h2 className="text-xl font-extrabold text-white tracking-wide font-sans m-0 uppercase bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">NOVA LIBRARY</h2>
          <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest block mt-1">Smart Library Management System</span>
        </div>

        {/* ALERTS */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs p-3 rounded-lg mb-4 text-center flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs p-3 rounded-lg mb-4 text-center flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SWITCH PANEL WITH FRAMER MOTION */}
        <AnimatePresence mode="wait">
          {!isRegister ? (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              {/* LOGIN METHOD SELECTION */}
              <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-6 text-xs text-white/70">
                <button
                  onClick={() => setLoginMethod('password')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${loginMethod === 'password' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/10' : 'hover:bg-white/5 hover:text-white'}`}
                >
                  Password Access
                </button>
                <button
                  onClick={() => setLoginMethod('otp')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${loginMethod === 'otp' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/10' : 'hover:bg-white/5 hover:text-white'}`}
                >
                  Secure OTP
                </button>
              </div>

              {/* PASSWORD LOGIN FORM */}
              {loginMethod === 'password' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="text-white/60 text-xs font-semibold block mb-1">Username / Email</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40"><User className="w-4 h-4" /></span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username or email"
                        required
                        className="w-full bg-slate-950/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-white/60 text-xs font-semibold block mb-1">Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40"><Lock className="w-4 h-4" /></span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                        className="w-full bg-slate-950/40 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white"
                      >
                        {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-white/50 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" className="rounded bg-transparent border-white/20 focus:ring-0 focus:ring-offset-0 text-cyan-500" />
                      <span>Keep Node Active</span>
                    </label>
                    <a href="#" onClick={() => triggerNotification('Reset instructions generated!', 'success')} className="hover:text-cyan-400">Forget Access Key?</a>
                  </div>

                  <button type="submit" className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold py-2.5 rounded-xl shadow-lg border border-white/10 text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                    Sign In to System
                  </button>

                  {/* QUICK DEMO ACCESS PANEL */}
                  <div className="mt-4 pt-3 border-t border-white/10 space-y-2.5">
                    <span className="text-[10px] text-white/40 block text-center uppercase tracking-wider font-semibold">Quick Demo Login Console</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setUsername('superadmin'); setPassword('admin123'); }}
                        className="group flex flex-col justify-between p-3 rounded-2xl bg-slate-950/60 border border-white/10 text-left text-white hover:border-orange-500/40 transition-all hover:scale-[1.03] duration-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white mb-2 shadow shadow-orange-500/10">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold">Super Admin</span>
                        <span className="text-[8px] text-white/40 font-mono">superadmin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setUsername('admin'); setPassword('admin123'); }}
                        className="group flex flex-col justify-between p-3 rounded-2xl bg-slate-950/60 border border-white/10 text-left text-white hover:border-purple-500/40 transition-all hover:scale-[1.03] duration-300 hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center text-white mb-2 shadow shadow-purple-500/10">
                          <Shield className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold">Org Admin</span>
                        <span className="text-[8px] text-white/40 font-mono">admin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setUsername('librarian'); setPassword('lib123'); }}
                        className="group flex flex-col justify-between p-3 rounded-2xl bg-slate-950/60 border border-white/10 text-left text-white hover:border-emerald-500/40 transition-all hover:scale-[1.03] duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center text-white mb-2 shadow shadow-emerald-500/10">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold">Librarian Staff</span>
                        <span className="text-[8px] text-white/40 font-mono">librarian</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setUsername('john_doe'); setPassword('member123'); }}
                        className="group flex flex-col justify-between p-3 rounded-2xl bg-slate-950/60 border border-white/10 text-left text-white hover:border-blue-500/40 transition-all hover:scale-[1.03] duration-300 hover:shadow-[0_0_15px_rgba(37,99,235,0.15)] cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white mb-2 shadow shadow-blue-500/10">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold">Student Member</span>
                        <span className="text-[8px] text-white/40 font-mono">john_doe</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* OTP LOGIN STEP 1 FORM */}
              {loginMethod === 'otp' && (
                <form onSubmit={handleGenerateOTP} className="space-y-4">
                  <div>
                    <label className="text-white/60 text-xs font-semibold block mb-1">Registered Email or Phone</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40"><Mail className="w-4 h-4" /></span>
                      <input
                        type="text"
                        placeholder="e.g. john.doe@mit.edu"
                        value={otpIdentifier}
                        onChange={(e) => setOtpIdentifier(e.target.value)}
                        required
                        className="w-full bg-slate-950/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold py-2.5 rounded-xl shadow-lg border border-white/10 text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                    Request OTP Code
                  </button>
                </form>
              )}

              <div className="text-center mt-6 pt-4 border-t border-white/10">
                <span className="text-xs text-white/50">
                  New student/faculty registry?{' '}
                  <span 
                    className="text-cyan-400 font-semibold cursor-pointer underline hover:text-cyan-300" 
                    onClick={() => setIsRegister(true)}
                  >
                    Register Member
                  </span>
                </span>
              </div>
            </motion.div>
          ) : (
            /* REGISTER VIEW */
            <motion.div
              key="register-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="text-white/60 text-xs font-semibold block mb-1">Username</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. library_guest"
                    required
                    className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs font-semibold block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. guest@mits.edu"
                    required
                    className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs font-semibold block mb-1">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-white/60 text-xs font-semibold block mb-1">Department</label>
                    <select
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      style={{ background: '#0f172a' }}
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Physics">Physics</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Literature">Literature</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-semibold block mb-1">Phone</label>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="e.g. +919876543210"
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-purple-600 hover:to-cyan-600 text-white font-bold py-2.5 rounded-xl shadow-lg border border-white/10 text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  Initialize Membership
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-white/50">
                    Already authenticated?{' '}
                    <span 
                      className="text-cyan-400 font-semibold cursor-pointer underline hover:text-cyan-300" 
                      onClick={() => setIsRegister(false)}
                    >
                      Sign In
                    </span>
                  </span>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* STUNNING PREMIUM GLASSMORPHIC OTP MODAL OVERLAY */}
      <AnimatePresence>
        {otpStep === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md p-8 glass-panel bg-slate-900/60 border border-white/10 rounded-[30px] shadow-2xl text-center"
            >
              {/* Close Button */}
              <button 
                onClick={() => { setOtpStep(1); setOtpDigits(Array(6).fill('')); }}
                className="absolute top-5 right-5 text-white/50 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <Key className="w-6 h-6 text-cyan-400" />
              </div>

              {/* Title & Desc */}
              <h3 className="text-xl font-bold text-white tracking-wide">Enter Verification Code</h3>
              <p className="text-white/60 text-xs mt-2 px-4 leading-relaxed">
                We've sent a 6-digit access code to:<br/>
                <strong className="text-cyan-400 font-mono mt-1 block">{maskIdentifier(otpIdentifier)}</strong>
              </p>

              {/* 6 Digit Inputs container */}
              <form onSubmit={handleVerifyOTP} className="mt-8 space-y-6">
                <div className="flex justify-center gap-2.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-digit-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      onPaste={handleDigitPaste}
                      ref={(el) => { digitRefs.current[idx] = el; }}
                      className="w-12 h-14 text-center font-mono font-bold text-xl bg-slate-950/60 border border-white/10 rounded-xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 focus:outline-none text-white selection:bg-cyan-500/30"
                    />
                  ))}
                </div>

                {/* Resend and Countdown ring */}
                <div className="flex flex-col items-center justify-center gap-3 py-2 border-t border-white/5 mt-6">
                  {otpTimer > 0 ? (
                    <div className="flex items-center gap-3">
                      <svg className="w-10 h-10">
                        <circle
                          cx="20"
                          cy="20"
                          r={radius}
                          className="stroke-white/10 fill-none"
                          strokeWidth={strokeWidth}
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r={radius}
                          className="stroke-cyan-400 fill-none transition-all duration-1000 ease-linear origin-center -rotate-90"
                          strokeWidth={strokeWidth}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                        />
                        <text
                          x="20"
                          y="24"
                          className="fill-white text-[10px] font-bold text-center"
                          textAnchor="middle"
                        >
                          {otpTimer}
                        </text>
                      </svg>
                      <span className="text-[10px] text-white/50 font-semibold tracking-wide">OTP valid for 2 minutes</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleGenerateOTP()}
                      className="group flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 font-bold text-xs bg-white/5 border border-white/10 hover:border-yellow-400/30 rounded-xl px-4 py-2 transition-all cursor-pointer hover:scale-[1.02] shadow-lg shadow-yellow-500/5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 duration-500" />
                      <span>Resend Verification Code</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setOtpStep(1); setOtpDigits(Array(6).fill('')); }}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Change Destination
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-cyan-500/10 transition-all cursor-pointer"
                  >
                    Verify Node
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

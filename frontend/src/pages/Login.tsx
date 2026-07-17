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
  const [loginTheme, setLoginTheme] = useState<'tokyo-night' | 'soft-sakura' | 'reading-room'>(() => {
    return (localStorage.getItem('login_theme') as any) || 'tokyo-night';
  });

  useEffect(() => {
    localStorage.setItem('login_theme', loginTheme);
  }, [loginTheme]);


  const [isRegister, setIsRegister] = useState(false);
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtpVerified, setRegOtpVerified] = useState(false);
  const [regOtpDigits, setRegOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [regOtpTimer, setRegOtpTimer] = useState(0);
  const [regOtpAttemptsRemaining, setRegOtpAttemptsRemaining] = useState(5);
  const [regOtpLoading, setRegOtpLoading] = useState(false);
  const regDigitRefs = useRef<(HTMLInputElement | null)[]>([]);
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

  const [orgLogo, setOrgLogo] = useState('/logo.png');
  
  useEffect(() => {
    if (regOtpTimer <= 0) return;
    const interval = setInterval(() => {
      setRegOtpTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [regOtpTimer]);

  const handleRegDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...regOtpDigits];
    newDigits[index] = val.slice(-1);
    setRegOtpDigits(newDigits);
    if (val && index < 5) {
      regDigitRefs.current[index + 1]?.focus();
    }
  };

  const handleRegDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const newDigits = [...regOtpDigits];
      if (!newDigits[index] && index > 0) {
        newDigits[index - 1] = '';
        setRegOtpDigits(newDigits);
        regDigitRefs.current[index - 1]?.focus();
      } else {
        newDigits[index] = '';
        setRegOtpDigits(newDigits);
      }
    }
  };

  const handleRegDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    if (!/^\d{6}$/.test(pasted)) return;
    const digits = pasted.split('');
    setRegOtpDigits(digits);
    regDigitRefs.current[5]?.focus();
  };

  const handleSendRegOTP = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!regUsername.trim()) {
      triggerNotification("Username is required.", "error");
      return;
    }
    const emailPattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailPattern.test(regEmail)) {
      triggerNotification("Invalid email address format.", "error");
      return;
    }
    const phonePattern = /^\+[1-9]\d{7,14}$/;
    let cleanPhone = regPhone.replace(/[\s()-]/g, '');
    if (cleanPhone && !cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }
    if (!phonePattern.test(cleanPhone)) {
      triggerNotification("Invalid phone number format. Must start with '+' followed by country code (e.g. +91XXXXXXXXXX)", "error");
      return;
    }
    if (regPassword.length < 8) {
      triggerNotification("Password must be at least 8 characters long.", "error");
      return;
    }
    if (!regDept) {
      triggerNotification("Department selection is required.", "error");
      return;
    }

    setRegOtpLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/send-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          phone: cleanPhone,
          password: regPassword,
          department: regDept
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || data.message || 'Failed to send OTP.');

      setRegOtpSent(true);
      setRegOtpTimer(60);
      setRegOtpAttemptsRemaining(5);
      setRegOtpDigits(Array(6).fill(''));
      triggerNotification('OTP sent successfully.', 'success');
    } catch (err: any) {
      triggerNotification(err.message, 'error');
    } finally {
      setRegOtpLoading(false);
    }
  };

  const handleVerifyRegOTP = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const otp = regOtpDigits.join('');
    if (otp.length < 6) {
      triggerNotification("Please enter all 6 digits of the verification code.", "error");
      return;
    }

    setRegOtpLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/verify-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.toLowerCase(),
          otp: otp
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setRegOtpAttemptsRemaining(prev => Math.max(0, prev - 1));
        throw new Error(data.msg || 'Invalid verification code.');
      }

      setRegOtpVerified(true);
      triggerNotification('OTP verified successfully.', 'success');
    } catch (err: any) {
      triggerNotification(err.message, 'error');
    } finally {
      setRegOtpLoading(false);
    }
  };
  const [orgName, setOrgName] = useState('NOVA LIBRARY');
  
  const [selectedOrg, setSelectedOrg] = useState<any>(() => {
    const saved = localStorage.getItem('selected_org');
    return saved ? JSON.parse(saved) : null;
  });
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orgLoading, setOrgLoading] = useState(false);

  useEffect(() => {
    const loadOrgs = async () => {
      setOrgLoading(true);
      try {
        const res = await fetch('http://127.0.0.1:5000/api/auth/organizations');
        if (res.ok) {
          const data = await res.json();
          setOrganizations(data);
        }
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
      } finally {
        setOrgLoading(false);
      }
    };
    loadOrgs();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      setOrgName(selectedOrg.name);
      if (selectedOrg.logo_url) {
        const fullUrl = selectedOrg.logo_url.startsWith('http') ? selectedOrg.logo_url : `http://127.0.0.1:5000${selectedOrg.logo_url}`;
        setOrgLogo(fullUrl);
      }
    } else {
      setOrgName('NOVA LIBRARY');
      setOrgLogo('/logo.png');
    }
  }, [selectedOrg]);

  const handleSelectOrg = (org: any) => {
    setSelectedOrg(org);
    localStorage.setItem('selected_org', JSON.stringify(org));
  };

  const handleChangeOrg = () => {
    setSelectedOrg(null);
    localStorage.removeItem('selected_org');
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        body: JSON.stringify({ email_or_phone: otpIdentifier, org_id: selectedOrg?.id })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || data.msg || 'Server Error');

      setOtpStep(2);
      setOtpTimer(60);
      triggerNotification(data.msg || data.message || 'OTP code has been sent successfully.', 'success');
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
        body: JSON.stringify({ email_or_phone: otpIdentifier, otp_code: code, org_id: selectedOrg?.id })
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
    let particles: Array<{
      x: number;
      y: number;
      speedX: number;
      speedY: number;
      size: number;
      opacity: number;
      fadeDir: number;
      type: 'circle' | 'petal' | 'heart' | 'leaf' | 'dust';
      color: string;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    if (loginTheme === 'soft-sakura') {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Populate particles based on the theme
    const count = 60;
    for (let i = 0; i < count; i++) {
      let type: 'circle' | 'petal' | 'heart' | 'leaf' | 'dust' = 'circle';
      let color = 'rgba(255,255,255,0.2)';
      
      if (loginTheme === 'tokyo-night') {
        type = Math.random() > 0.4 ? 'circle' : 'dust';
        color = Math.random() > 0.5 ? 'rgba(14, 165, 233, 0.4)' : 'rgba(59, 130, 246, 0.3)';
      } else if (loginTheme === 'soft-sakura') {
        const rand = Math.random();
        if (rand < 0.45) {
          type = 'petal';
          color = 'rgba(244, 114, 182, 0.6)';
        } else if (rand < 0.55) {
          type = 'heart';
          color = 'rgba(251, 113, 133, 0.3)';
        } else if (rand < 0.8) {
          type = 'circle'; // bokeh
          color = 'rgba(236, 72, 153, 0.15)';
        } else {
          type = 'dust';
          color = 'rgba(253, 244, 245, 0.5)';
        }
      } else { // reading-room (brown)
        const rand = Math.random();
        if (rand < 0.35) {
          type = 'leaf';
          color = 'rgba(180, 83, 9, 0.4)';
        } else {
          type = 'dust';
          color = Math.random() > 0.5 ? 'rgba(251, 191, 36, 0.4)' : 'rgba(217, 119, 6, 0.3)';
        }
      }

      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speedX: (Math.random() - 0.5) * (loginTheme === 'soft-sakura' ? 1.2 : 0.6),
        speedY: (Math.random() - 0.5) * (loginTheme === 'soft-sakura' ? 1.0 : 0.6) + (loginTheme === 'soft-sakura' ? 0.35 : 0), // slow fall for sakura
        size: Math.random() * (type === 'circle' && loginTheme === 'soft-sakura' ? 18 : 4) + (type === 'circle' && loginTheme === 'soft-sakura' ? 6 : 1),
        opacity: Math.random() * 0.6 + 0.2,
        fadeDir: Math.random() > 0.5 ? 1 : -1,
        type,
        color,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, idx) => {
        // Opacity oscillation
        p.opacity += p.fadeDir * 0.005;
        if (p.opacity <= 0.1) {
          p.opacity = 0.1;
          p.fadeDir = 1;
        } else if (p.opacity >= 0.8) {
          p.opacity = 0.8;
          p.fadeDir = -1;
        }

        // Apply mouse parallax to Sakura petals
        let finalX = p.x;
        let finalY = p.y;
        if (loginTheme === 'soft-sakura') {
          const dx = (mouseX - canvas.width / 2) * 0.015;
          const dy = (mouseY - canvas.height / 2) * 0.015;
          finalX += dx * (p.size / 10);
          finalY += dy * (p.size / 10);
        }

        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Reset or wrap particles
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -20 || p.x > canvas.width + 20) {
          p.x = p.x < -20 ? canvas.width + 20 : -20;
        }

        ctx.save();
        ctx.translate(finalX, finalY);
        ctx.rotate(p.rotation);

        if (p.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.opacity})`);
          ctx.fill();
        } else if (p.type === 'dust') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.opacity * 0.8})`);
          ctx.fill();
        } else if (p.type === 'petal') {
          // Sakura petal shape
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-p.size, -p.size * 1.5, -p.size * 2, p.size * 0.5, 0, p.size * 2);
          ctx.bezierCurveTo(p.size * 2, p.size * 0.5, p.size, -p.size * 1.5, 0, 0);
          ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.opacity})`);
          ctx.fill();
        } else if (p.type === 'heart') {
          // Subtle heart shape
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-p.size / 2, -p.size / 2, -p.size, p.size / 3, 0, p.size);
          ctx.bezierCurveTo(p.size, p.size / 3, p.size / 2, -p.size / 2, 0, 0);
          ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.opacity * 0.4})`);
          ctx.fill();
        } else if (p.type === 'leaf') {
          // Warm leaf shape
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-p.size * 1.2, -p.size * 0.5, 0, -p.size * 2);
          ctx.quadraticCurveTo(p.size * 1.2, -p.size * 0.5, 0, 0);
          ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.opacity})`);
          ctx.fill();
        }

        ctx.restore();

        // Connection lines logic (only for tokyo-night theme)
        if (loginTheme === 'tokyo-night') {
          for (let j = idx + 1; j < particles.length; j++) {
            const p2 = particles[j];
            if (p2.type === 'circle' && p.type === 'circle') {
              const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
              if (dist < 120) {
                ctx.strokeStyle = `rgba(14, 165, 233, ${0.12 * (1 - dist / 120) * p.opacity * p2.opacity})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(finalX, finalY);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            }
          }
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (loginTheme === 'soft-sakura') {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationId);
    };
  }, [loginTheme]);

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
        body: JSON.stringify({ username, password, org_id: selectedOrg?.id })
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
    if (!regOtpVerified) {
      triggerNotification("Please verify your OTP first.", "error");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let cleanPhone = regPhone.replace(/[\s()-]/g, '');
      if (cleanPhone && !cleanPhone.startsWith('+')) {
        cleanPhone = '+' + cleanPhone;
      }

      const res = await fetch('http://127.0.0.1:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          password: regPassword,
          department: regDept,
          phone: cleanPhone,
          role: 'member',
          org_id: selectedOrg?.id
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
  const strokeDashoffset = circumference - (otpTimer / 60) * circumference;

  return (
    <div 
      style={
        loginTheme === 'soft-sakura'
          ? {
              backgroundImage: "url('/anime_sakura_bg.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
            }
          : undefined
      }
      className={`relative min-h-screen w-screen flex items-center justify-center p-4 overflow-hidden transition-all duration-500 ${
        loginTheme === 'tokyo-night' ? 'bg-radial from-slate-900 to-slate-950 text-slate-100' :
        loginTheme === 'soft-sakura' ? 'text-slate-900 bg-pink-50' :
        'text-yellow-100 bg-amber-950'
      }`}
    >
      {/* Translucent blur overlay for Soft Sakura Theme */}
      {loginTheme === 'soft-sakura' && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none transition-all"
          style={{
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(255, 255, 255, 0.18)'
          }}
        />
      )}

      {/* Background Star Constellation Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" style={{ opacity: loginTheme === 'tokyo-night' ? 1 : 0.1 }} />

      {/* Auth Box Container */}
      <motion.div 
        layout
        className={`relative z-10 glass-panel max-w-md w-full p-8 overflow-hidden rounded-[30px] pt-12 border border-white/10 shadow-2xl transition-all duration-300 ${
          loginTheme === 'tokyo-night' ? 'bg-slate-900/40' :
          loginTheme === 'soft-sakura' ? 'bg-white/75 border-pink-300/40 shadow-[0_20px_50px_rgba(236,72,153,0.15)]' :
          'bg-slate-900/40'
        }`}
        style={{ backdropFilter: 'blur(40px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Theme selector pills */}
        <div className="absolute top-4 right-6 flex gap-1.5 z-20">
          <button type="button" onClick={() => setLoginTheme('tokyo-night')} className={`w-3 h-3 rounded-full bg-indigo-900 border ${loginTheme === 'tokyo-night' ? 'border-cyan-400 scale-110' : 'border-white/20'}`} title="Tokyo Night" />
          <button type="button" onClick={() => setLoginTheme('soft-sakura')} className={`w-3 h-3 rounded-full bg-pink-300 border ${loginTheme === 'soft-sakura' ? 'border-rose-500 scale-110' : 'border-white/20'}`} title="Soft Sakura" />
          <button type="button" onClick={() => setLoginTheme('reading-room')} className={`w-3 h-3 rounded-full bg-amber-800 border ${loginTheme === 'reading-room' ? 'border-yellow-400 scale-110' : 'border-white/20'}`} title="Reading Room" />
        </div>
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-4 left-6 px-3 py-1.5 rounded-full text-[10px] font-extrabold text-cyan-300 hover:text-white bg-slate-900/60 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all duration-300 flex items-center gap-1.5 cursor-pointer z-20"
          >
            <i className="fa-solid fa-arrow-left text-[9px] animate-pulse"></i>
            <span>Back to Home</span>
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
            id="orgLogo"
            src={orgLogo || '/logo.png'}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/logo.png';
            }}
            alt="Nova Logo"
            className={`w-[70px] h-[70px] rounded-full mx-auto mb-3 object-contain border-2 shadow-2xl duration-300 ${
              loginTheme === 'soft-sakura'
                ? 'border-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                : 'border-cyan-500/20 hover:border-cyan-400'
            }`}
          />
          <h2 className="text-xl font-extrabold text-white tracking-wide font-sans m-0 uppercase bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">{orgName}</h2>
          <span className={`text-[9px] text-cyan-400 font-bold uppercase tracking-widest block mt-1 ${
            loginTheme === 'soft-sakura' ? 'text-pink-600' : ''
          }`}>Smart Library Management System</span>
        </div>

        {/* ALERTS */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs p-3 rounded-lg mb-4 text-center flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs p-3 rounded-lg mb-4 text-center flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SWITCH PANEL WITH FRAMER MOTION */}
        <AnimatePresence mode="wait">
          {!selectedOrg ? (
            <motion.div
              key="org-selector"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-extrabold text-white tracking-wide uppercase bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent m-0">
                  Choose Your Organization
                </h3>
                <p className="text-white/60 text-xs mt-1 mb-0">Please select your academic or corporate institution to sign in.</p>
              </div>

              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search organizations by name or domain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full bg-slate-950/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 ${
                    loginTheme === 'soft-sakura' ? 'bg-white/85 border-pink-300/60 text-slate-800 placeholder-pink-400/70 focus:border-pink-500' : ''
                  }`}
                />
              </div>

              {/* Grid of Cards */}
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {orgLoading ? (
                  <div className="text-center text-white/50 py-8 text-xs">Loading institutions...</div>
                ) : filteredOrgs.length === 0 ? (
                  <div className="text-center text-white/40 py-8 text-xs">No active organizations found matching '{searchQuery}'</div>
                ) : (
                  filteredOrgs.map(org => {
                    const logoUrl = org.logo_url 
                      ? (org.logo_url.startsWith('http') ? org.logo_url : `http://127.0.0.1:5000${org.logo_url}`)
                      : '/logo.png';
                    return (
                      <motion.div
                        key={org.id}
                        onClick={() => handleSelectOrg(org)}
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        className={`glass-panel p-3.5 border border-white/5 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:border-cyan-500/30 transition-all ${
                          loginTheme === 'soft-sakura' ? 'bg-white/90 border-pink-200 hover:border-pink-400 hover:bg-pink-50/50' : 'bg-slate-950/30 hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={logoUrl} 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/logo.png';
                            }}
                            className={`w-10 h-10 rounded-xl object-contain p-1 border ${
                              loginTheme === 'soft-sakura' ? 'bg-white border-pink-200' : 'bg-slate-950 border-white/10'
                            }`}
                            alt=""
                          />
                          <div className="text-left">
                            <h4 className={`text-xs font-bold leading-tight m-0 ${loginTheme === 'soft-sakura' ? 'text-slate-800' : 'text-white'}`}>
                              {org.name}
                            </h4>
                            <span className={`text-[10px] block mt-0.5 ${loginTheme === 'soft-sakura' ? 'text-pink-600/70' : 'text-cyan-400/70'}`}>
                              .{org.subdomain}.novalibrary.com
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold ${loginTheme === 'soft-sakura' ? 'text-pink-600' : 'text-cyan-400'}`}>Select →</span>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="auth-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {/* Selected Org banner */}
              <div className={`flex items-center justify-between gap-4 bg-white/5 border border-white/15 p-3 rounded-2xl mb-6 ${
                loginTheme === 'soft-sakura' ? 'bg-pink-100/50 border-pink-300/40' : ''
              }`}>
                <div className="flex items-center gap-2.5">
                  <img 
                    src={orgLogo} 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/logo.png';
                    }}
                    className={`w-8 h-8 rounded-lg object-contain border p-0.5 ${
                      loginTheme === 'soft-sakura' ? 'bg-white border-pink-200' : 'bg-white/5 border-white/10'
                    }`} 
                    alt="" 
                  />
                  <div className="text-left">
                    <span className={`text-[9px] uppercase font-extrabold tracking-wider block leading-none ${loginTheme === 'soft-sakura' ? 'text-pink-800/60' : 'text-white/40'}`}>Active Organization</span>
                    <strong className={`text-[11px] font-bold tracking-tight block mt-0.5 leading-snug ${loginTheme === 'soft-sakura' ? 'text-pink-900' : 'text-white'}`}>{orgName}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleChangeOrg}
                  className={`px-2.5 py-1 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                    loginTheme === 'soft-sakura' ? 'bg-pink-200/50 border border-pink-300 hover:bg-pink-200 text-pink-700' : 'bg-white/5 border border-white/15 text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Change
                </button>
              </div>

              {!isRegister ? (
                <div className="space-y-4">
                  {/* LOGIN METHOD SELECTION */}
                  <div className={`flex bg-white/5 border border-white/10 rounded-xl p-1 mb-6 text-xs text-white/70 ${
                    loginTheme === 'soft-sakura' ? 'border-pink-200/45 text-pink-700' : ''
                  }`}>
                    <button
                      onClick={() => setLoginMethod('password')}
                      className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                        loginMethod === 'password'
                          ? loginTheme === 'soft-sakura'
                            ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/10'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/10'
                          : 'hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      Password Access
                    </button>
                    <button
                      onClick={() => setLoginMethod('otp')}
                      className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                        loginMethod === 'otp'
                          ? loginTheme === 'soft-sakura'
                            ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/10'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/10'
                          : 'hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      Secure OTP
                    </button>
                  </div>

                  {/* PASSWORD LOGIN FORM */}
                  {loginMethod === 'password' && (
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div>
                      <label className={`text-xs font-bold block mb-1 ${
                        loginTheme === 'soft-sakura' ? 'text-pink-800' :
                        loginTheme === 'reading-room' ? 'text-amber-200' :
                        'text-slate-300'
                      }`}>Username or Email</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin or email@domain.edu"
                        required
                        className={`w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 ${
                          loginTheme === 'soft-sakura'
                            ? 'bg-white/85 border-pink-300/60 text-slate-800 placeholder-pink-400/70 focus:border-pink-500 shadow-sm'
                            : ''
                        }`}
                      />
                      </div>
                      <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className={`text-xs font-bold ${
                          loginTheme === 'soft-sakura' ? 'text-pink-800' :
                          loginTheme === 'reading-room' ? 'text-amber-200' :
                          'text-slate-300'
                        }`}>Password</label>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className={`w-full bg-slate-950/40 border border-white/10 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 ${
                            loginTheme === 'soft-sakura'
                              ? 'bg-white/85 border-pink-300/60 text-slate-800 placeholder-pink-400/70 focus:border-pink-500 shadow-sm'
                              : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      </div>

                      <button
                        type="submit"
                        className={`w-full mt-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white font-extrabold py-2.5 rounded-xl shadow-lg border border-white/10 text-xs tracking-wider uppercase hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer ${
                          loginTheme === 'soft-sakura'
                            ? 'from-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-600 shadow-pink-500/10 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] border-pink-300/40'
                            : ''
                        }`}
                      >
                        Sign In credentials
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

                  {/* SECURE OTP LOGIN FORM */}
                  {loginMethod === 'otp' && (
                    <form onSubmit={handleGenerateOTP} className="space-y-4">
                      <div>
                        <label className={`text-xs font-bold block mb-1 ${
                          loginTheme === 'soft-sakura' ? 'text-pink-800' :
                          loginTheme === 'reading-room' ? 'text-amber-200' :
                          'text-slate-300'
                        }`}>Registered Email or Mobile</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={otpIdentifier}
                            onChange={(e) => setOtpIdentifier(e.target.value)}
                            placeholder="student@mits.edu or +91XXXXXXXXXX"
                            required
                            className={`w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 ${
                              loginTheme === 'soft-sakura'
                                ? 'bg-white/85 border-pink-300/60 text-slate-800 placeholder-pink-400/70 focus:border-pink-500 shadow-sm'
                                : ''
                            }`}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className={`w-full mt-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white font-extrabold py-2.5 rounded-xl shadow-lg border border-white/10 text-xs tracking-wider uppercase hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer ${
                          loginTheme === 'soft-sakura'
                            ? 'from-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-600 shadow-pink-500/10 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] border-pink-300/40'
                            : ''
                        }`}
                      >
                        Request Access OTP
                      </button>
                    </form>
                  )}

                  <div className="text-center pt-2">
                    <span className={`text-xs font-semibold ${
                      loginTheme === 'soft-sakura' ? 'text-slate-800' :
                      loginTheme === 'reading-room' ? 'text-amber-200' :
                      'text-slate-300'
                    }`}>
                      New student/faculty registry?{' '}
                      <span 
                        className={`font-bold cursor-pointer underline hover:scale-105 transition-all inline-block ${
                          loginTheme === 'soft-sakura' ? 'text-pink-600 hover:text-pink-850' :
                          loginTheme === 'reading-room' ? 'text-cyan-300 hover:text-cyan-200' :
                          'text-cyan-400 hover:text-cyan-300'
                        }`} 
                        onClick={() => setIsRegister(true)}
                      >
                        Register Member
                      </span>
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${
                      loginTheme === 'soft-sakura' ? 'text-pink-800' :
                      loginTheme === 'reading-room' ? 'text-amber-200' :
                      'text-slate-300'
                    }`}>Full Name</label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. Mohammad Bilal"
                      required
                      className={`w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 ${
                        loginTheme === 'soft-sakura'
                          ? 'bg-white/85 border-pink-300/60 text-slate-800 placeholder-pink-400/70 focus:border-pink-500 shadow-sm'
                          : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${
                      loginTheme === 'soft-sakura' ? 'text-pink-800' :
                      loginTheme === 'reading-room' ? 'text-amber-200' :
                      'text-slate-300'
                    }`}>Institutional Email</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="bilal@mits.edu"
                      required
                      className={`w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 ${
                        loginTheme === 'soft-sakura'
                          ? 'bg-white/85 border-pink-300/60 text-slate-800 placeholder-pink-400/70 focus:border-pink-500 shadow-sm'
                          : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${
                      loginTheme === 'soft-sakura' ? 'text-pink-800' :
                      loginTheme === 'reading-room' ? 'text-amber-200' :
                      'text-slate-300'
                    }`}>Password</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      className={`w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 ${
                        loginTheme === 'soft-sakura'
                          ? 'bg-white/85 border-pink-300/60 text-slate-800 placeholder-pink-400/70 focus:border-pink-500 shadow-sm'
                          : ''
                      }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                    <label className={`text-xs font-bold block mb-1 ${
                      loginTheme === 'soft-sakura' ? 'text-pink-800' :
                      loginTheme === 'reading-room' ? 'text-amber-200' :
                      'text-slate-300'
                    }`}>Department</label>
                      <select
                        value={regDept}
                        onChange={(e) => setRegDept(e.target.value)}
                        className={`w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 ${
                          loginTheme === 'soft-sakura'
                            ? 'bg-white/85 border-pink-300/60 text-slate-800 focus:border-pink-500 shadow-sm'
                            : ''
                        }`}
                        style={{ background: loginTheme === 'soft-sakura' ? 'rgba(255, 255, 255, 0.85)' : '#0f172a' }}
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Physics">Physics</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Literature">Literature</option>
                      </select>
                    </div>
                    <div>
                    <label className={`text-xs font-bold block mb-1 ${
                      loginTheme === 'soft-sakura' ? 'text-pink-800' :
                      loginTheme === 'reading-room' ? 'text-amber-200' :
                      'text-slate-300'
                    }`}>Phone</label>
                      <input
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="e.g. +919876543210"
                        className={`w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 ${
                          loginTheme === 'soft-sakura'
                            ? 'bg-white/85 border-pink-300/60 text-slate-800 placeholder-pink-400/70 focus:border-pink-500 shadow-sm'
                            : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Send OTP / Verification Section */}
                  <div className="border-t border-white/5 pt-3 mt-3">
                    {!regOtpSent && !regOtpVerified && (
                      <button
                        type="button"
                        onClick={handleSendRegOTP}
                        disabled={regOtpLoading}
                        className={`w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all hover:scale-[1.01] ${
                          loginTheme === 'soft-sakura' ? 'bg-pink-100 hover:bg-pink-200 border-pink-300 text-pink-700' : ''
                        }`}
                      >
                        {regOtpLoading ? " quantum dispatching..." : "Send OTP"}
                      </button>
                    )}

                    {regOtpSent && !regOtpVerified && (
                      <div className="space-y-3 mt-2">
                        <div className="text-center">
                          <label className={`text-white/60 text-xs font-semibold block mb-2 ${
                            loginTheme === 'soft-sakura' ? 'text-pink-700' : ''
                          }`}>Verification Code</label>
                          <div className="flex justify-center gap-2">
                            {regOtpDigits.map((digit, idx) => (
                              <input
                                key={idx}
                                id={`reg-otp-digit-${idx}`}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleRegDigitChange(idx, e.target.value)}
                                onKeyDown={(e) => handleRegDigitKeyDown(idx, e)}
                                onPaste={handleRegDigitPaste}
                                ref={(el) => { regDigitRefs.current[idx] = el; }}
                                className={`w-10 h-12 text-center font-mono font-bold text-lg bg-slate-950/60 border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none text-white ${
                                  loginTheme === 'soft-sakura' ? 'bg-white border-pink-300 text-slate-800 focus:border-pink-500' : ''
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleVerifyRegOTP}
                            disabled={regOtpLoading || regOtpAttemptsRemaining <= 0}
                            className={`flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-2 rounded-xl text-xs shadow-md cursor-pointer transition-all ${
                              loginTheme === 'soft-sakura' ? 'from-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-600' : ''
                            }`}
                          >
                            Verify OTP
                          </button>
                          <button
                            type="button"
                            onClick={handleSendRegOTP}
                            disabled={regOtpTimer > 0 || regOtpLoading}
                            className={`flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                              loginTheme === 'soft-sakura' ? 'bg-pink-100 hover:bg-pink-200 border-pink-300 text-pink-700' : ''
                            }`}
                          >
                            {regOtpTimer > 0 ? `Resend OTP (${regOtpTimer}s)` : "Resend OTP"}
                          </button>
                        </div>

                        <div className="flex justify-between items-center px-1 text-[10px] text-white/40">
                          <span>Attempts remaining: <strong className="text-rose-400">{regOtpAttemptsRemaining}</strong></span>
                          <span>OTP Status: <strong className="text-yellow-400">Waiting</strong></span>
                        </div>
                      </div>
                    )}

                    {regOtpVerified && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 mt-2">
                        <span>✓ OTP Verified Successfully</span>
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={!regOtpVerified}
                    className={`w-full mt-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-purple-600 hover:to-cyan-600 text-white font-bold py-2.5 rounded-xl shadow-lg border border-white/10 text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${
                      !regOtpVerified ? 'opacity-40 cursor-not-allowed hover:scale-100' : ''
                    } ${
                      loginTheme === 'soft-sakura'
                        ? 'from-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-600 shadow-pink-500/10 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] border-pink-300/40'
                        : ''
                    }`}
                  >
                    Initialize Membership
                  </button>

                  <div className="text-center pt-2">
                    <span className={`text-xs font-semibold ${
                      loginTheme === 'soft-sakura' ? 'text-slate-800' :
                      loginTheme === 'reading-room' ? 'text-amber-200' :
                      'text-slate-300'
                    }`}>
                      Already authenticated?{' '}
                      <span 
                        className={`font-bold cursor-pointer underline hover:scale-105 transition-all inline-block ${
                          loginTheme === 'soft-sakura' ? 'text-pink-600 hover:text-pink-850' :
                          loginTheme === 'reading-room' ? 'text-cyan-300 hover:text-cyan-200' :
                          'text-cyan-400 hover:text-cyan-300'
                        }`} 
                        onClick={() => setIsRegister(false)}
                      >
                        Sign In
                      </span>
                    </span>
                  </div>
                </form>
              )}
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
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${
              loginTheme === 'soft-sakura' ? 'bg-pink-950/20' : 'bg-slate-950/80'
            }`}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative w-full max-w-md p-8 glass-panel border border-white/10 rounded-[30px] shadow-2xl text-center transition-all duration-300 ${
                loginTheme === 'soft-sakura'
                  ? 'bg-white/90 border-pink-300 shadow-[0_20px_50px_rgba(236,72,153,0.15)] text-slate-800'
                  : 'bg-slate-900/60 text-white'
              }`}
            >
              {/* Close Button */}
              <button 
                onClick={() => { setOtpStep(1); setOtpDigits(Array(6).fill('')); }}
                className={`absolute top-5 right-5 p-1.5 rounded-full transition-all cursor-pointer ${
                  loginTheme === 'soft-sakura' ? 'text-pink-400 hover:text-pink-600 hover:bg-pink-100' : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className={`w-14 h-14 border rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(6,182,212,0.15)] ${
                loginTheme === 'soft-sakura'
                  ? 'bg-pink-50 border-pink-300 shadow-[0_0_20px_rgba(236,72,153,0.2)]'
                  : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/30'
              }`}>
                <Key className={`w-6 h-6 ${loginTheme === 'soft-sakura' ? 'text-pink-600' : 'text-cyan-400'}`} />
              </div>

              {/* Title & Desc */}
              <h3 className={`text-xl font-bold tracking-wide ${loginTheme === 'soft-sakura' ? 'text-slate-800' : 'text-white'}`}>Enter Verification Code</h3>
              <p className={`text-xs mt-2 px-4 leading-relaxed ${loginTheme === 'soft-sakura' ? 'text-slate-600' : 'text-white/60'}`}>
                We've sent a 6-digit access code to:<br/>
                <strong className={`font-mono mt-1 block ${loginTheme === 'soft-sakura' ? 'text-pink-600' : 'text-cyan-400'}`}>{maskIdentifier(otpIdentifier)}</strong>
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
                      className={`w-12 h-14 text-center font-mono font-bold text-xl bg-slate-950/60 border border-white/10 rounded-xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 focus:outline-none text-white selection:bg-cyan-500/30 ${
                        loginTheme === 'soft-sakura'
                          ? 'bg-white border-pink-300 text-slate-800 focus:border-pink-500 focus:ring-pink-500/20 shadow-sm'
                          : ''
                      }`}
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
                          className={`${loginTheme === 'soft-sakura' ? 'stroke-pink-100' : 'stroke-white/10'} fill-none`}
                          strokeWidth={strokeWidth}
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r={radius}
                          className={`${loginTheme === 'soft-sakura' ? 'stroke-pink-500' : 'stroke-cyan-400'} fill-none transition-all duration-1000 ease-linear origin-center -rotate-90`}
                          strokeWidth={strokeWidth}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                        />
                        <text
                          x="20"
                          y="24"
                          className={`${loginTheme === 'soft-sakura' ? 'fill-slate-800' : 'fill-white'} text-[10px] font-bold text-center`}
                          textAnchor="middle"
                        >
                          {otpTimer}
                        </text>
                      </svg>
                      <span className={`text-[10px] font-semibold tracking-wide ${loginTheme === 'soft-sakura' ? 'text-slate-500' : 'text-white/50'}`}>OTP valid for 2 minutes</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleGenerateOTP()}
                      className={`group flex items-center gap-1.5 font-bold text-xs bg-white/5 border rounded-xl px-4 py-2 transition-all cursor-pointer hover:scale-[1.02] shadow-lg ${
                        loginTheme === 'soft-sakura'
                          ? 'text-pink-600 border-pink-300 hover:border-pink-500 hover:text-pink-700 bg-white shadow-pink-500/5'
                          : 'text-yellow-400 hover:text-yellow-300 border-white/10 hover:border-yellow-400/30 shadow-yellow-500/5'
                      }`}
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
                    className={`flex-1 font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      loginTheme === 'soft-sakura'
                        ? 'bg-pink-100 hover:bg-pink-200 border border-pink-300/40 text-pink-700'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white'
                    }`}
                  >
                    Change Destination
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg transition-all cursor-pointer ${
                      loginTheme === 'soft-sakura'
                        ? 'bg-gradient-to-r from-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-600 shadow-pink-500/10'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-500 shadow-cyan-500/10'
                    }`}
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

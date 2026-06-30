import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";

interface OTPVerificationProps {
  onVerificationSuccess?: (token?: string) => void;
  emailOrPhone?: string;
  onBack?: () => void;
}

export default function OTPVerification({ 
  onVerificationSuccess, 
  emailOrPhone = "user@example.com", 
  onBack 
}: OTPVerificationProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [timer, setTimer] = useState(60);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value: string, index: number) => {
    // Only allow single digit numbers
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrorMsg("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Empty box backspace navigation
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current box value
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const chars = pastedData.split("");
    setOtp(chars);
    setErrorMsg("");
    
    // Focus the last input box
    inputRefs.current[5]?.focus();
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      // Integration point for Flask API resend OTP
      const res = await fetch("http://127.0.0.1:5000/api/auth/generate-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_or_phone: emailOrPhone }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.msg || "Failed to resend OTP");
      }
      
      setSuccessMsg("A new 6-digit code has been dispatched!");
      setTimer(60);
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const enteredOTP = otp.join("");

    if (enteredOTP.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit OTP code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Flask OTP Verification API call integration
      const response = await fetch("http://127.0.0.1:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email_or_phone: emailOrPhone, 
          otp_code: enteredOTP 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || data.message || "OTP verification failed");
      }

      setIsVerified(true);
      setSuccessMsg("OTP Verified Successfully");
      
      // Store token and user if returned
      if (data.token) {
        localStorage.setItem("nova_jwt_token", data.token);
        const userObj = { 
          ...data.user, 
          org_name: data.organization?.name, 
          org_logo: data.organization?.logo_url,
          fine_rate: data.organization?.fine_rate
        };
        localStorage.setItem("nova_user", JSON.stringify(userObj));
      }

      if (onVerificationSuccess) {
        setTimeout(() => {
          onVerificationSuccess(data.token);
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Invalid security code. Please check and try again.");
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto p-8 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center gap-6"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <ShieldCheck className="w-7 h-7 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-wide">Security Verification</h2>
        <p className="text-xs text-slate-400 max-w-xs">
          Enter the 6-digit authorization code dispatched to <strong className="text-cyan-300 font-mono">{emailOrPhone}</strong>.
        </p>
      </div>

      <div className="flex gap-2.5 my-2">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={loading || isVerified}
            className="w-12 h-14 text-center text-xl font-bold font-mono bg-slate-950/60 border border-white/10 rounded-xl focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold"
          >
            <span>✅ {successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleVerify}
        disabled={loading || isVerified}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 disabled:from-blue-800/40 disabled:to-cyan-800/40 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 duration-200 text-xs"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Access Code...
          </>
        ) : (
          <>
            Verify OTP <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="w-full flex items-center justify-between text-[11px] text-slate-500 border-t border-white/5 pt-4">
        {timer > 0 ? (
          <span>Resend code in <strong className="text-slate-300">{timer}s</strong></span>
        ) : (
          <button
            onClick={handleResendOTP}
            disabled={loading}
            className="text-cyan-400 hover:text-cyan-300 hover:underline transition font-semibold cursor-pointer"
          >
            Resend security code
          </button>
        )}

        {onBack && (
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white transition font-medium cursor-pointer"
          >
            Back to login
          </button>
        )}
      </div>
    </motion.div>
  );
}

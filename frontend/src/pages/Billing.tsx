import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle, AlertCircle, X, Download, Building, 
  Sparkles, ShieldCheck, DollarSign, Receipt, RefreshCw, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface BillingProps {
  user: any;
  onProfileUpdate: (updatedUser: any) => void;
  initialSelectedPlan?: string | null;
}

export default function Billing({ user, onProfileUpdate, initialSelectedPlan }: BillingProps) {
  // Console logging setup
  const logDebug = (message: string, data?: any) => {
    console.log(`[Billing UI] [${new Date().toISOString()}] ${message}`, data || '');
  };

  const [subscription, setSubscription] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Pricing periods and checkout plan
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'Standard' | 'Enterprise' | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Fetch current subscription status
  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      logDebug('Fetching current subscription. Token exists:', !!token);
      
      const res = await fetch('http://127.0.0.1:5000/api/subscription/current', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to load subscription status');
      const data = await res.json();
      logDebug('Current subscription data retrieved:', data);
      setSubscription(data);
    } catch (err: any) {
      logDebug('Error loading current subscription:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment history
  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/subscription/payment-history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to load transaction history');
      const data = await res.json();
      logDebug('Transaction history retrieved:', data);
      setHistory(data);
    } catch (err: any) {
      logDebug('Error loading payment history:', err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // On Mount
  useEffect(() => {
    logDebug('Billing Panel Rendered. User Identity:', { username: user?.username, role: user?.role, org: user?.org_name });
    fetchSubscription();
    fetchPaymentHistory();

    const pendingPlan = localStorage.getItem('pending_plan');
    const pendingPeriod = localStorage.getItem('pending_period');

    console.log("Billing Mounted");
    console.log("Pending Plan", pendingPlan);
    console.log("Payment Modal", false); // initial state
    
    if (pendingPlan === 'Standard' || pendingPlan === 'Enterprise') {
      logDebug('Found pending checkout task in localStorage. Initializing payment modal:', { pendingPlan, pendingPeriod });
      setSelectedPlan(pendingPlan as 'Standard' | 'Enterprise');
      if (pendingPeriod === 'yearly') {
        setPricingPeriod('yearly');
      }
      setPaymentStatus('idle');
      setPaymentError('');
      setPaymentModalOpen(true);
      console.log("Payment Modal", true);
      
      // Clear pending storage so it doesn't reopen
      localStorage.removeItem('pending_action');
      localStorage.removeItem('pending_plan');
      localStorage.removeItem('pending_period');
    } else if (initialSelectedPlan === 'Standard' || initialSelectedPlan === 'Enterprise') {
      logDebug('Found pending checkout task via props. Initializing payment modal:', initialSelectedPlan);
      setSelectedPlan(initialSelectedPlan as 'Standard' | 'Enterprise');
      setPaymentStatus('idle');
      setPaymentError('');
      setPaymentModalOpen(true);
      console.log("Payment Modal", true);
    }
  }, []);

  const handlePlanClick = (plan: 'Standard' | 'Enterprise') => {
    const token = localStorage.getItem('nova_jwt_token');
    logDebug('Plan button clicked:', { plan, tokenExists: !!token });
    
    if (token) {
      setSelectedPlan(plan);
      setPaymentStatus('idle');
      setPaymentError('');
      setPaymentModalOpen(true);
    } else {
      // In case session expired or missing
      logDebug('Session invalid or token missing. Opening alert.');
      alert('Authentication session expired. Please sign in again.');
      window.location.reload();
    }
  };

  // Base and total calculations
  const calculateCosts = () => {
    if (!selectedPlan) return { base: 0, gst: 0, discount: 0, total: 0 };
    
    const isYearly = pricingPeriod === 'yearly';
    let baseRate = 0;
    
    if (selectedPlan === 'Standard') {
      baseRate = isYearly ? 1200 : 1500;
    } else if (selectedPlan === 'Enterprise') {
      baseRate = isYearly ? 3600 : 4500;
    }
    
    const months = isYearly ? 12 : 1;
    const rawCost = baseRate * months;
    
    // 20% discount already calculated in base rate or custom discount applied
    const discount = isYearly ? (baseRate * 0.25 * months) : 0; // Yearly discount display helper
    
    const gstRate = 0.18;
    const gst = parseFloat((rawCost * gstRate).toFixed(2));
    const total = parseFloat((rawCost + gst).toFixed(2));
    
    return {
      base: rawCost,
      gst,
      discount,
      total
    };
  };

  const costs = calculateCosts();

  const handleCreateOrderAndPay = async () => {
    if (!selectedPlan) return;
    
    logDebug('Initiating payment checkout sequence', {
      plan: selectedPlan,
      period: pricingPeriod,
      paymentMethod: selectedMethod,
      costs
    });
    
    setPaymentStatus('processing');
    setPaymentError('');
    
    try {
      const token = localStorage.getItem('nova_jwt_token');
      
      // Step 1: Create Order on Backend
      const orderRes = await fetch('http://127.0.0.1:5000/api/subscription/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_name: selectedPlan,
          billing_period: pricingPeriod
        })
      });
      
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.msg || 'Order creation rejected by backend API');
      }
      
      logDebug('Backend Order created successfully:', orderData);
      console.log("Create Order Called", orderData.order_id);

      // Load Razorpay Script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Check network connectivity.');
      }

      // Configure and open Razorpay test modal
      const options = {
        key: orderData.key_id || 'rzp_test_dummy_key_id',
        amount: costs.total * 100, // paisa
        currency: 'INR',
        name: user?.org_name || 'Nova Library',
        description: `${selectedPlan} Plan Upgrade`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          logDebug('Razorpay payment successful. Verifying signatures:', response);
          setPaymentStatus('processing');
          
          try {
            // Step 2: Verify Payment on Backend
            const verifyRes = await fetch('http://127.0.0.1:5000/api/subscription/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id || orderData.order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: selectedPlan,
                billing_period: pricingPeriod
              })
            });
            
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.msg || 'Payment verification rejected by backend');
            }
            
            logDebug('Payment verification response from backend:', verifyData);
            
            setTransactionId(response.razorpay_order_id || orderData.order_id);
            setInvoiceNumber(verifyData.invoice_number);
            setPaymentStatus('success');
            
            // Update local storage user details
            const storedUser = localStorage.getItem('nova_user');
            if (storedUser) {
              const userObj = JSON.parse(storedUser);
              userObj.subscription_plan = selectedPlan;
              localStorage.setItem('nova_user', JSON.stringify(userObj));
              onProfileUpdate(userObj);
            }
            
            // Refresh statistics
            fetchSubscription();
            fetchPaymentHistory();
            
          } catch (vErr: any) {
            logDebug('Payment signature verification failed:', vErr.message);
            setPaymentError(vErr.message);
            setPaymentStatus('failed');
          }
        },
        modal: {
          ondismiss: function () {
            logDebug('Razorpay payment modal dismissed by user.');
            setPaymentError('Payment checkout cancelled / dismissed by user.');
            setPaymentStatus('failed');
          }
        },
        prefill: {
          name: user?.username,
          email: user?.email || 'admin@library.org'
        },
        theme: {
          color: '#06b6d4'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      
    } catch (err: any) {
      logDebug('Order creation failed:', err.message);
      setPaymentError(err.message);
      setPaymentStatus('failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'expired': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-5.5 h-5.5 text-cyan-400" /> Subscription & Node Billing
          </h3>
          <p className="text-xs text-slate-400 mt-1">Manage system licenses, upgrade workspace capacities, and view billing invoices.</p>
        </div>
        <button 
          onClick={() => { fetchSubscription(); fetchPaymentHistory(); }}
          className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* TOP STATS: Current subscription plan status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="glass-panel p-6 border-white/5 lg:col-span-3 flex justify-center items-center h-44">
            <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Subscription status card */}
            <div className="glass-panel p-6 border-white/5 bg-gradient-to-br from-slate-900/60 to-slate-950/40 col-span-1 lg:col-span-2 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-10" />
              <div>
                <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block">Current Active Plan</span>
                <div className="flex justify-between items-start mt-3">
                  <div>
                    <h4 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                      {subscription?.plan_name || 'Trial'} Plan
                      {subscription?.plan_name === 'Trial' && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                      {subscription?.plan_name === 'Standard' && <Star className="w-4 h-4 text-cyan-400 fill-cyan-400" />}
                      {subscription?.plan_name === 'Enterprise' && <Star className="w-4 h-4 text-purple-400 fill-purple-400" />}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Assigned to: <span className="font-semibold text-slate-300">{user?.org_name || 'Organization'}</span></p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider ${getStatusColor(subscription?.status)}`}>
                    {subscription?.status || 'Active'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-4 border-t border-white/5 text-xs">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">Billing period</span>
                  <span className="text-slate-200 font-bold capitalize mt-1 block">{subscription?.billing_period || 'Monthly'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">License cost</span>
                  <span className="text-slate-200 font-bold mt-1 block">₹{subscription?.price?.toLocaleString() || '0'} INR</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">Start date</span>
                  <span className="text-slate-200 font-mono mt-1 block">{subscription?.start_date ? subscription.start_date.split(' ')[0] : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">Renewal date</span>
                  <span className="text-slate-200 font-mono mt-1 block">{subscription?.expiry_date ? subscription.expiry_date.split(' ')[0] : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Quick stats info widget */}
            <div className="glass-panel p-6 border-white/5 bg-gradient-to-br from-slate-900/60 to-slate-950/40 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -z-10" />
              <div>
                <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest block">Licensing telemetrics</span>
                <h4 className="text-sm font-extrabold text-white mt-4 uppercase tracking-wider">Quota Allocation</h4>
                
                <div className="space-y-3.5 mt-4 text-[10px]">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Database Catalog capacity</span>
                      <strong className="text-slate-200">
                        {subscription?.plan_name === 'Enterprise' ? '10,000 items' : (subscription?.plan_name === 'Standard' ? '1,000 items' : 'Unlimited')}
                      </strong>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full ${subscription?.plan_name === 'Enterprise' ? 'bg-purple-500 w-full' : (subscription?.plan_name === 'Standard' ? 'bg-cyan-500 w-1/10' : 'bg-emerald-500 w-1/2')}`} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Advanced telemetry dashboards</span>
                      <strong className="text-slate-200">{subscription?.plan_name === 'Enterprise' ? 'Enabled' : 'Disabled'}</strong>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>NLP AI float assistant</span>
                      <strong className="text-slate-200">{subscription?.plan_name === 'Enterprise' ? 'Enabled' : 'Disabled'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* PLANS & UPGRADE GRID */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h4 className="text-md font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-cyan-400" /> SaaS Node Upgrade Options
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Scale catalog thresholds, integrate Power BI modules, and deploy AI layers.</p>
          </div>

          {/* Toggle */}
          <div className="inline-flex bg-white/5 border border-white/10 p-1 rounded-full text-[9px] font-bold">
            <button 
              onClick={() => setPricingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-full transition-all ${pricingPeriod === 'monthly' ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white'}`}
            >
              Monthly Term
            </button>
            <button 
              onClick={() => setPricingPeriod('yearly')}
              className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${pricingPeriod === 'yearly' ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white'}`}
            >
              Yearly Term <span className="bg-purple-950 text-purple-300 font-bold px-1.5 py-0.5 rounded text-[7px] uppercase tracking-wider">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          {/* Standard Tier */}
          <div className={`glass-panel p-6 border-white/10 flex flex-col justify-between h-[380px] bg-slate-900/10 hover:border-cyan-500/20 transition-all ${subscription?.plan_name === 'Standard' ? 'border-cyan-500/40 relative shadow-2xl shadow-cyan-500/5' : ''}`}>
            {subscription?.plan_name === 'Standard' && (
              <span className="absolute -top-2.5 left-6 text-[8px] bg-cyan-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Active Plan</span>
            )}
            <div>
              <span className="text-[10px] text-white/50 uppercase block font-bold">Standard Node</span>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                ₹{pricingPeriod === 'monthly' ? '1,500' : '1,200'} <span className="text-xs text-white/40 font-normal">/ month</span>
              </h3>
              <ul className="space-y-2.5 text-[11px] text-white/60 mt-6 list-disc pl-4">
                <li>Up to 1,000 Catalog Books limit</li>
                <li>Basic Issue/Return forms telemetry</li>
                <li>Real-time WebSockets notification alert feed</li>
                <li>Single Tenant Dashboard configuration</li>
              </ul>
            </div>
            
            <button 
              onClick={() => handlePlanClick('Standard')}
              disabled={subscription?.plan_name === 'Standard' && subscription?.status === 'Active'}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${subscription?.plan_name === 'Standard' ? 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed' : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white hover:scale-[1.01]'}`}
            >
              {subscription?.plan_name === 'Standard' ? 'Standard Plan Active' : 'Subscribe Standard'}
            </button>
          </div>

          {/* Enterprise Core Tier */}
          <div className={`glass-panel p-6 bg-gradient-to-b from-blue-950/20 to-slate-950/10 flex flex-col justify-between h-[380px] relative transition-all ${subscription?.plan_name === 'Enterprise' ? 'border-purple-500/40 shadow-2xl shadow-purple-500/5' : 'border-cyan-500/20 hover:border-cyan-500/40 shadow-2xl shadow-cyan-500/5'}`}>
            <span className="absolute top-3 right-4 text-[8px] bg-cyan-400 text-slate-950 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">POPULAR CHOICE</span>
            {subscription?.plan_name === 'Enterprise' && (
              <span className="absolute -top-2.5 left-6 text-[8px] bg-purple-500 text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Active Plan</span>
            )}
            <div>
              <span className="text-[10px] text-cyan-400 uppercase block font-bold">Enterprise Core</span>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                ₹{pricingPeriod === 'monthly' ? '4,500' : '3,600'} <span className="text-xs text-white/40 font-normal">/ month</span>
              </h3>
              <ul className="space-y-2.5 text-[11px] text-white/80 mt-6 list-disc pl-4 font-medium">
                <li>Up to 10,000 Catalog Books limit</li>
                <li>Power BI Interactive Analytics Dashboard</li>
                <li>Floating NLP Artificial Intelligence Assistant</li>
                <li>Member Reading Scores & Audit log systems</li>
                <li>Dedicated SLA Technical Support Node</li>
              </ul>
            </div>
            
            <button 
              onClick={() => handlePlanClick('Enterprise')}
              disabled={subscription?.plan_name === 'Enterprise' && subscription?.status === 'Active'}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${subscription?.plan_name === 'Enterprise' ? 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:scale-[1.01] shadow-lg shadow-cyan-500/10'}`}
            >
              {subscription?.plan_name === 'Enterprise' ? 'Enterprise Active' : 'Deploy Enterprise Core'}
            </button>
          </div>
        </div>
      </div>

      {/* BILLING HISTORY */}
      <div>
        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Receipt className="w-4.5 h-4.5 text-cyan-400" /> Transaction Billing History
        </h4>
        
        {historyLoading ? (
          <div className="glass-panel p-6 border-white/5 flex justify-center items-center h-28">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="glass-panel p-8 border-white/5 text-center text-slate-500 text-xs">
            No transaction records found on this organization ID.
          </div>
        ) : (
          <div className="glass-panel border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-bold">
                    <th className="p-4 uppercase tracking-wider text-[9px]">Invoice ID</th>
                    <th className="p-4 uppercase tracking-wider text-[9px]">Date</th>
                    <th className="p-4 uppercase tracking-wider text-[9px]">Plan details</th>
                    <th className="p-4 uppercase tracking-wider text-[9px]">Gateway</th>
                    <th className="p-4 uppercase tracking-wider text-[9px]">Amount Paid</th>
                    <th className="p-4 uppercase tracking-wider text-[9px]">Status</th>
                    <th className="p-4 uppercase tracking-wider text-[9px] text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {history.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4 font-mono font-bold text-cyan-400">{tx.invoice_number || `INV-MOCK-${tx.id}`}</td>
                      <td className="p-4 font-mono text-[11px]">{tx.created_at || 'N/A'}</td>
                      <td className="p-4 font-semibold text-white">
                        {tx.amount > 30000 ? 'Enterprise Core Plan' : 'Standard Node Plan'}
                      </td>
                      <td className="p-4">{tx.gateway || 'Razorpay'}</td>
                      <td className="p-4 font-mono font-bold text-white">₹{tx.amount?.toLocaleString()} INR</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => alert(`Initiating receipt download for ${tx.invoice_number}`)}
                          className="p-1.5 bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 text-[10px]"
                        >
                          <Download className="w-3 h-3 text-cyan-400" /> Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* PREMIUM CHECKOUT PORTAL MODAL */}
      <AnimatePresence>
        {paymentModalOpen && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-panel w-full max-w-md border-white/10 p-6 space-y-6 relative bg-[#0c101b]/95 shadow-2xl rounded-3xl"
            >
              {/* Close Button */}
              {paymentStatus !== 'processing' && (
                <button 
                  onClick={() => setPaymentModalOpen(false)}
                  className="absolute top-4 right-4 p-1 hover:bg-white/5 border border-white/5 text-white/50 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* IDLE PAYMENT FORM VIEW */}
              {paymentStatus === 'idle' && (
                <>
                  <div className="text-center">
                    <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block">Checkout Portal</span>
                    <h3 className="text-lg font-black text-white mt-1 uppercase tracking-wider">Upgrade Node Plan</h3>
                  </div>

                  <div className="w-full p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3.5 text-xs text-slate-300">
                    <div className="flex justify-between border-b border-white/5 pb-2.5">
                      <span className="text-slate-500">Selected Plan:</span>
                      <strong className="text-white uppercase font-bold">{selectedPlan} Plan</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Organization Name:</span>
                      <span className="text-slate-300 font-semibold">{user?.org_name || 'Nova Library'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Billing Term:</span>
                      <span className="text-slate-300 font-semibold capitalize">{pricingPeriod}ly Billing</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Base Price ({pricingPeriod === 'monthly' ? '1 mo' : '12 mos'}):</span>
                      <span className="text-slate-200 font-mono">₹{costs.base.toLocaleString()}</span>
                    </div>
                    {pricingPeriod === 'yearly' && (
                      <div className="flex justify-between text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded">
                        <span>Yearly Savings Applied (20%):</span>
                        <span className="font-mono">-₹{costs.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">GST (18%):</span>
                      <span className="text-slate-200 font-mono">₹{costs.gst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-3 text-sm">
                      <span className="font-bold text-slate-400">Total Invoice Amount:</span>
                      <strong className="text-cyan-400 font-mono">₹{costs.total.toLocaleString()} INR</strong>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Choose Payment Method</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {['UPI', 'Google Pay', 'PhonePe', 'Paytm', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'].map((m) => (
                        <button
                          key={m}
                          onClick={() => setSelectedMethod(m)}
                          className={`py-2 px-3.5 rounded-xl border text-left font-semibold transition-all cursor-pointer flex items-center justify-between ${selectedMethod === m ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300' : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'}`}
                        >
                          <span>{m}</span>
                          {selectedMethod === m && <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit checkout */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPaymentModalOpen(false)}
                      className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateOrderAndPay}
                      className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
                    >
                      Pay Now
                    </button>
                  </div>
                </>
              )}

              {/* PROCESSING TRANSACTIONS SCREEN */}
              {paymentStatus === 'processing' && (
                <div className="text-center py-10 space-y-5">
                  <div className="w-12 h-12 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Securing Transaction Node...</h4>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] mx-auto leading-normal">Please do not refresh. Verifying details via SSL socket gateway. Initiating API: `POST /verify-payment`...</p>
                  </div>
                </div>
              )}

              {/* SUCCESS VIEW */}
              {paymentStatus === 'success' && (
                <div className="text-center py-6 space-y-6">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white uppercase tracking-wider">Payment Verified</h4>
                    <p className="text-[10px] text-emerald-400/80 mt-1 leading-normal">Your {selectedPlan} plan is now fully active.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 text-left text-xs space-y-2 font-sans text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoice Number:</span>
                      <strong className="text-white font-mono">{invoiceNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transaction ID:</span>
                      <span className="text-slate-400 font-mono">{transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount Settled:</span>
                      <span className="text-white font-bold font-mono">₹{costs.total.toLocaleString()} INR</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setPaymentModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    Enter Platform Dashboard
                  </button>
                </div>
              )}

              {/* FAILED VIEW */}
              {paymentStatus === 'failed' && (
                <div className="text-center py-6 space-y-5">
                  <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white uppercase tracking-wider">Payment Failed</h4>
                    <p className="text-[10px] text-rose-400/80 mt-1 leading-normal">{paymentError || 'The transaction gateway timed out or signature verification was rejected.'}</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setPaymentStatus('idle')}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs cursor-pointer font-bold"
                    >
                      Try Again
                    </button>
                    <button 
                      onClick={() => setPaymentModalOpen(false)}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs cursor-pointer font-bold"
                    >
                      Cancel Checkout
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

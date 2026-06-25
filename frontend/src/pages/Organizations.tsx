import React, { useState, useEffect } from 'react';
import { Building, Plus, Search, Users, BookOpen, Globe, Calendar, DollarSign, Sparkles } from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  subdomain: string;
  logo_url: string;
  fine_rate: number;
  users_count: number;
  books_count: number;
  created_at: string;
}

export default function Organizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [fineRate, setFineRate] = useState('5.0');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchOrgs = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/admin/organizations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to load organizations');
      setOrganizations(data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!name.trim() || !subdomain.trim()) {
      setFormError('Name and subdomain are required.');
      return;
    }

    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/admin/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          subdomain: subdomain.toLowerCase().replace(/\s+/g, ''),
          logo_url: logoUrl || '/logo.svg',
          fine_rate: parseFloat(fineRate)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Registration failed');

      setFormSuccess('Organization registered successfully!');
      setName('');
      setSubdomain('');
      setLogoUrl('');
      setFineRate('5.0');
      
      // Reload lists
      fetchOrgs();
      
      setTimeout(() => {
        setShowForm(false);
        setFormSuccess('');
      }, 1500);

    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.subdomain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building className="w-5.5 h-5.5 text-cyan-400" /> Organizations & Tenant Nodes
          </h2>
          <p className="text-xs text-white/50">Manage subscription branches, client domains, and system scopes.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-all shadow-lg shadow-blue-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Register Organization
        </button>
      </div>

      {/* CREATE FORM OVERLAY */}
      {showForm && (
        <div className="glass-panel p-5 border-white/10 space-y-4 max-w-lg">
          <h4 className="text-white text-sm font-bold m-0 border-b border-white/5 pb-2">Register Client Tenant</h4>
          
          {formError && <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] text-center">{formError}</div>}
          {formSuccess && <div className="p-2.5 rounded bg-green-500/10 border border-green-500/20 text-green-300 text-[10px] text-center">{formSuccess}</div>}

          <form onSubmit={handleCreateOrg} className="grid grid-cols-2 gap-4 text-xs">
            <div className="col-span-2">
              <label className="text-white/60 block mb-1 font-semibold">Institution Name</label>
              <input
                type="text"
                placeholder="e.g. Stanford University"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-white/60 block mb-1 font-semibold">Subdomain Slug</label>
              <input
                type="text"
                placeholder="e.g. stanford"
                value={subdomain}
                onChange={e => setSubdomain(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-white/60 block mb-1 font-semibold">Default Fine Rate (INR/day)</label>
              <input
                type="number"
                placeholder="5.0"
                value={fineRate}
                onChange={e => setFineRate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="col-span-2">
              <label className="text-white/60 block mb-1 font-semibold">Logo Image URL (Optional)</label>
              <input
                type="text"
                placeholder="/logo.svg"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="col-span-2 pt-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-blue-950 font-bold cursor-pointer"
              >
                Create Tenant
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="flex bg-white/5 border border-white/10 p-2 rounded-2xl max-w-md">
        <Search className="w-4 h-4 text-white/40 my-auto ml-2" />
        <input
          type="text"
          placeholder="Filter organizations by name or subdomain..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-0 outline-none text-xs text-white px-3 focus:ring-0"
        />
      </div>

      {/* LIST ORGS */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="w-6 h-6 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="glass-panel p-10 text-center text-white/50 text-xs">No registered organizations found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrgs.map(org => (
            <div key={org.id} className="glass-panel p-5 border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between h-[220px]">
              <div>
                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <img src={org.logo_url} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="Org Logo" />
                    <div>
                      <h4 className="font-bold text-white text-sm m-0">{org.name}</h4>
                      <span className="text-[10px] text-cyan-400 font-mono tracking-wider">.{org.subdomain}.novalibrary.com</span>
                    </div>
                  </div>
                  <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    SaaS Active
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-4 text-center">
                  <div className="bg-white/5 p-2 rounded-xl">
                    <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <strong className="text-white text-xs block">{org.users_count}</strong>
                    <span className="text-[8px] text-white/40 uppercase">Users</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl">
                    <BookOpen className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                    <strong className="text-white text-xs block">{org.books_count}</strong>
                    <span className="text-[8px] text-white/40 uppercase">Books</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl">
                    <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <strong className="text-white text-xs block">₹{org.fine_rate}</strong>
                    <span className="text-[8px] text-white/40 uppercase">Fine Rate</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] text-white/40 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Registered: {org.created_at.split(' ')[0]}</span>
                <span className="text-cyan-400 font-semibold cursor-pointer hover:underline flex items-center gap-0.5">Manage Tenant <Globe className="w-3 h-3" /></span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

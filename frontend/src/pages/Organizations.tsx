import React, { useState, useEffect } from 'react';
import { Building, Plus, Search, Users, BookOpen, Globe, Calendar, DollarSign, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  subdomain: string;
  logo_url: string;
  fine_rate: number;
  status: string;
  users_count: number;
  books_count: number;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
}

export default function Organizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [fineRate, setFineRate] = useState('5.0');
  const [status, setStatus] = useState('active');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Edit Modal state
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubdomain, setEditSubdomain] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editFineRate, setEditFineRate] = useState('5.0');
  const [editStatus, setEditStatus] = useState('active');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/admin/tenants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to load tenants');
      setOrganizations(data.tenants || []);
      setStats(data.stats || { total: 0, active: 0, inactive: 0 });
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!name.trim() || !subdomain.trim()) {
      setFormError('Name and subdomain are required.');
      return;
    }

    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch('http://127.0.0.1:5000/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          subdomain: subdomain.toLowerCase().replace(/\s+/g, ''),
          logo_url: logoUrl || '/logo.png',
          fine_rate: parseFloat(fineRate),
          status
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Tenant registration failed');

      setFormSuccess('Organization registered successfully!');
      setName('');
      setSubdomain('');
      setLogoUrl('');
      setFineRate('5.0');
      setStatus('active');
      
      fetchTenants();
      
      setTimeout(() => {
        setShowCreateForm(false);
        setFormSuccess('');
      }, 1500);

    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;
    setEditError('');
    setEditSuccess('');

    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/admin/tenants/${editingOrg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          subdomain: editSubdomain.toLowerCase().replace(/\s+/g, ''),
          logo_url: editLogoUrl,
          fine_rate: parseFloat(editFineRate),
          status: editStatus
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Tenant update failed');

      setEditSuccess('Tenant updated successfully!');
      fetchTenants();
      
      setTimeout(() => {
        setEditingOrg(null);
        setEditSuccess('');
      }, 1500);
    } catch (err: any) {
      setEditError(err.message);
    }
  };

  const handleDeleteTenant = async (id: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this organization tenant? This deletes all associated books, loans, and users.")) return;
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/admin/tenants/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Tenant deletion failed');
      fetchTenants();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (org: Organization) => {
    const newStatus = org.status === 'active' ? 'inactive' : 'active';
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/admin/tenants/${org.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Status toggle failed');
      fetchTenants();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.subdomain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in text-xs text-white">
      
      {/* Title Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building className="w-5.5 h-5.5 text-cyan-400" /> Manage System Tenants
          </h2>
          <p className="text-xs text-white/50">Configure organization branches, subscription scopes, and client status.</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-all shadow-lg shadow-blue-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Tenant
        </button>
      </div>

      {/* STATISTICS COUNTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-white/50 uppercase block font-semibold">Total Tenants</span>
            <span className="text-2xl font-bold text-white">{stats.total}</span>
          </div>
          <Building className="w-8 h-8 text-blue-400" />
        </div>
        <div className="glass-panel p-4 border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-white/50 uppercase block font-semibold">Active Nodes</span>
            <span className="text-2xl font-bold text-emerald-400">{stats.active}</span>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="glass-panel p-4 border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-white/50 uppercase block font-semibold">Deactivated Nodes</span>
            <span className="text-2xl font-bold text-red-400">{stats.inactive}</span>
          </div>
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
      </div>

      {/* CREATE FORM OVERLAY */}
      {showCreateForm && (
        <div className="glass-panel p-5 border-white/10 space-y-4 max-w-lg">
          <h4 className="text-white text-sm font-bold m-0 border-b border-white/5 pb-2">Register Client Tenant</h4>
          
          {formError && <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] text-center">{formError}</div>}
          {formSuccess && <div className="p-2.5 rounded bg-green-500/10 border border-green-500/20 text-green-300 text-[10px] text-center">{formSuccess}</div>}

          <form onSubmit={handleCreateTenant} className="grid grid-cols-2 gap-4">
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
                placeholder="/logo.png"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="col-span-2">
              <label className="text-white/60 block mb-1 font-semibold">Tenant Node Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-span-2 pt-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
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

      {/* EDIT MODAL DIALOG */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 border-white/10 space-y-4 w-full max-w-md">
            <h4 className="text-white text-sm font-bold m-0 border-b border-white/5 pb-2">Edit Tenant Node Details</h4>
            
            {editError && <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] text-center">{editError}</div>}
            {editSuccess && <div className="p-2.5 rounded bg-green-500/10 border border-green-500/20 text-green-300 text-[10px] text-center">{editSuccess}</div>}

            <form onSubmit={handleSaveEdit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-white/60 block mb-1 font-semibold">Tenant Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-white/60 block mb-1 font-semibold">Subdomain</label>
                <input
                  type="text"
                  value={editSubdomain}
                  onChange={e => setEditSubdomain(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-white/60 block mb-1 font-semibold">Fine Rate (INR/day)</label>
                <input
                  type="number"
                  value={editFineRate}
                  onChange={e => setEditFineRate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="col-span-2">
                <label className="text-white/60 block mb-1 font-semibold">Logo Image URL</label>
                <input
                  type="text"
                  value={editLogoUrl}
                  onChange={e => setEditLogoUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="col-span-2">
                <label className="text-white/60 block mb-1 font-semibold">Tenant Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="col-span-2 pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingOrg(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-blue-950 font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="flex bg-white/5 border border-white/10 p-2 rounded-2xl max-w-md">
        <Search className="w-4 h-4 text-white/40 my-auto ml-2" />
        <input
          type="text"
          placeholder="Filter tenants by name or subdomain..."
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
        <div className="glass-panel p-10 text-center text-white/50 text-xs">No registered tenants found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrgs.map(org => (
            <div key={org.id} className="glass-panel p-5 border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between h-[230px]">
              <div>
                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <img src={org.logo_url} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="Org Logo" />
                    <div>
                      <h4 className="font-bold text-white text-sm m-0">{org.name}</h4>
                      <span className="text-[10px] text-cyan-400 font-mono tracking-wider">.{org.subdomain}.novalibrary.com</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(org)}
                    className={`text-[8px] border font-bold px-2 py-0.5 rounded-full uppercase tracking-wider cursor-pointer transition-all ${
                      org.status === 'active'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                    }`}
                  >
                    {org.status === 'active' ? 'Active' : 'Inactive'}
                  </button>
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
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Created: {org.created_at.split(' ')[0]}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingOrg(org);
                      setEditName(org.name);
                      setEditSubdomain(org.subdomain);
                      setEditLogoUrl(org.logo_url);
                      setEditFineRate(org.fine_rate.toString());
                      setEditStatus(org.status);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer hover:underline flex items-center gap-0.5"
                  >
                    Edit <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteTenant(org.id)}
                    className="text-red-400 hover:text-red-300 font-semibold cursor-pointer hover:underline flex items-center gap-0.5"
                  >
                    Delete <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

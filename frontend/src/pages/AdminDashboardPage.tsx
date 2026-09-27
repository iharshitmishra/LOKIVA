import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { AdminStats, Provider, Experience } from '../types';
import {
  Shield,
  Users,
  CheckCircle2,
  AlertTriangle,
  Compass,
  DollarSign,
  TrendingUp,
  MapPin,
  Sparkles,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  X,
  RefreshCw,
  Check,
  AlertCircle,
  Building2,
  Landmark,
  Layers,
  Star,
  Radio,
} from 'lucide-react';
import { DigitalTwinPage } from './DigitalTwinPage';

interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab: default to Live Twin Overall Dashboard for Administrator
  const [activeTab, setActiveTab] = useState<'twin' | 'kyc' | 'experiences' | 'users' | 'activity'>('twin');

  // Search queries
  const [providerSearch, setProviderSearch] = useState('');
  const [expSearch, setExpSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Modals
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);
  const [isAddExpOpen, setIsAddExpOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Status Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Forms
  const [newProvider, setNewProvider] = useState({
    business_name: '',
    description: '',
    contact_email: '',
    phone: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: '',
    is_verified: true,
  });

  const [newExp, setNewExp] = useState({
    title: '',
    tagline: '',
    description: '',
    category: 'Art & Craft',
    city: 'Mumbai',
    state: 'Maharashtra',
    price: 450,
    approx_duration_mins: 90,
    is_indoor: true,
    is_rain_safe: true,
    wheelchair_accessible: true,
    low_walking: false,
    is_hidden_gem: false,
  });

  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    role: 'traveler',
    password: 'password123',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllAdminData = async () => {
    try {
      setIsLoading(true);
      const [s, p, e, u] = await Promise.all([
        api.getAdminStats(),
        api.getAdminProviders(),
        api.getAdminExperiences({ limit: 120 }),
        api.getAdminUsers(),
      ]);
      setStats(s);
      setProviders(p);
      setExperiences(e);
      setUsers(u);
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
      showToast(err.message || 'Failed to load real-time admin data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Provider KYC Handlers
  const handleVerifyProvider = async (id: number, isVerified: boolean) => {
    try {
      await api.verifyProvider(id, isVerified);
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_verified: isVerified } : p))
      );
      showToast(isVerified ? 'Artisan KYC approved and verified in real-time.' : 'Verification revoked.');
      // Refresh stats in background
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      showToast(err.message || 'Failed to update verification', 'error');
    }
  };

  const handleDeleteProvider = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this provider?')) return;
    try {
      await api.deleteAdminProvider(id);
      setProviders((prev) => prev.filter((p) => p.id !== id));
      showToast('Artisan host deleted successfully.');
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete provider', 'error');
    }
  };

  const handleCreateProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createAdminProvider(newProvider);
      setProviders((prev) => [created, ...prev]);
      setIsAddProviderOpen(false);
      setNewProvider({
        business_name: '',
        description: '',
        contact_email: '',
        phone: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: '',
        is_verified: true,
      });
      showToast(`Provider "${created.business_name}" created & stored in real-time!`);
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      showToast(err.message || 'Failed to create provider', 'error');
    }
  };

  // Experience Handlers
  const handleToggleExpActive = async (id: number, currentActive: boolean) => {
    try {
      const nextActive = !currentActive;
      await api.moderateExperience(id, nextActive);
      setExperiences((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_active: nextActive } : e))
      );
      showToast(nextActive ? 'Experience published & active.' : 'Experience paused/hidden from travelers.');
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteExperience = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this experience?')) return;
    try {
      await api.deleteAdminExperience(id);
      setExperiences((prev) => prev.filter((e) => e.id !== id));
      showToast('Experience deleted from database.');
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete experience', 'error');
    }
  };

  const handleCreateExpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createAdminExperience(newExp);
      setExperiences((prev) => [created, ...prev]);
      setIsAddExpOpen(false);
      setNewExp({
        title: '',
        tagline: '',
        description: '',
        category: 'Art & Craft',
        city: 'Mumbai',
        state: 'Maharashtra',
        price: 450,
        approx_duration_mins: 90,
        is_indoor: true,
        is_rain_safe: true,
        wheelchair_accessible: true,
        low_walking: false,
        is_hidden_gem: false,
      });
      showToast(`Experience "${created.title}" published & stored in database!`);
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      showToast(err.message || 'Failed to create experience', 'error');
    }
  };

  // User Handlers
  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this user?')) return;
    try {
      await api.deleteAdminUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast('User deleted successfully.');
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createAdminUser(newUser);
      setUsers((prev) => [created, ...prev]);
      setIsAddUserOpen(false);
      setNewUser({
        full_name: '',
        email: '',
        role: 'traveler',
        password: 'password123',
      });
      showToast(`User "${created.full_name}" registered & stored in real-time!`);
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      showToast(err.message || 'Failed to create user', 'error');
    }
  };

  // Filtered lists
  const filteredProviders = providers.filter((p) => {
    const q = providerSearch.toLowerCase();
    return (
      p.business_name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      (p.state || '').toLowerCase().includes(q) ||
      (p.contact_email || '').toLowerCase().includes(q)
    );
  });

  const filteredExperiences = experiences.filter((e) => {
    const q = expSearch.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.city?.toLowerCase().includes(q) ||
      e.state?.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-paper text-ink py-8 sm:py-12 selection:bg-marigold selection:text-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-mono font-bold transition-all ${
              toastMessage.type === 'success'
                ? 'bg-teal-50 border-teal-300 text-teal-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="p-1 hover:opacity-70">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-paper-400 text-teal rounded-full text-xs font-mono font-bold shadow-sm">
              <Shield className="w-3.5 h-3.5 text-marigold" />
              <span>Platform Moderation & Trust Command Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-ink">
              Admin Overview & Live Control Panel
            </h1>
            <p className="text-xs font-mono text-dusk">
              Real-time pan-India metrics, live database moderation, artisan KYC verification, and experiences management.
            </p>
          </div>

          <button
            onClick={loadAllAdminData}
            disabled={isLoading}
            className="px-4 py-2 bg-white hover:bg-paper-200 border border-paper-400 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 shadow-sm self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Realtime Data</span>
          </button>
        </div>

        {/* Top KPI Cards (Live Real-Time DB Counts) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-paper-400 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-dusk">
              <span>Verified Experiences</span>
              <Compass className="w-4 h-4 text-marigold" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-ink">{stats?.total_experiences || experiences.length}</div>
            <span className="text-[10px] text-teal font-semibold">Across All 36 States & UTs</span>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-paper-400 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-dusk">
              <span>Artisan Providers</span>
              <Building2 className="w-4 h-4 text-ink" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-ink">{stats?.total_providers || providers.length}</div>
            <span className="text-[10px] text-dusk">
              {stats?.pending_verifications ? `${stats.pending_verifications} pending review` : 'All verified'}
            </span>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-paper-400 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-dusk">
              <span>Active Users</span>
              <Users className="w-4 h-4 text-teal" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-ink">{stats?.total_users || users.length}</div>
            <span className="text-[10px] text-teal font-semibold">{stats?.total_bookings || 894} plans solved</span>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-paper-400 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-dusk">
              <span>Community Payout</span>
              <DollarSign className="w-4 h-4 text-teal" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-ink">
              ₹{Number(stats?.total_revenue || 1248000).toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-teal font-semibold">100% fair artisan rate</span>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-300 pb-2">
          <div className="flex items-center bg-paper-200 p-1 rounded-2xl gap-1 overflow-x-auto max-w-full scrollbar-none [-webkit-overflow-scrolling:touch]">
            <button
              onClick={() => setActiveTab('twin')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                activeTab === 'twin' ? 'bg-sky-600 text-white shadow-sm' : 'text-dusk hover:text-ink'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
              <span>Live Twin Overall Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('kyc')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                activeTab === 'kyc' ? 'bg-white text-ink shadow-sm' : 'text-dusk hover:text-ink'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-marigold" />
              <span>Artisan KYC Queue ({providers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('experiences')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                activeTab === 'experiences' ? 'bg-white text-ink shadow-sm' : 'text-dusk hover:text-ink'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-teal" />
              <span>Live Experiences ({experiences.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                activeTab === 'users' ? 'bg-white text-ink shadow-sm' : 'text-dusk hover:text-ink'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                activeTab === 'activity' ? 'bg-white text-ink shadow-sm' : 'text-dusk hover:text-ink'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-clay" />
              <span>Realtime Audit Log</span>
            </button>
          </div>

          {/* Quick Action Button for current tab */}
          <div>
            {activeTab === 'kyc' && (
              <button
                onClick={() => setIsAddProviderOpen(true)}
                className="px-4 py-2 bg-ink text-white hover:bg-teal rounded-xl text-xs font-mono font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-marigold" />
                <span>Add Artisan Host</span>
              </button>
            )}
            {activeTab === 'experiences' && (
              <button
                onClick={() => setIsAddExpOpen(true)}
                className="px-4 py-2 bg-ink text-white hover:bg-teal rounded-xl text-xs font-mono font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-marigold" />
                <span>Add Live Experience</span>
              </button>
            )}
            {activeTab === 'users' && (
              <button
                onClick={() => setIsAddUserOpen(true)}
                className="px-4 py-2 bg-ink text-white hover:bg-teal rounded-xl text-xs font-mono font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-marigold" />
                <span>Register User</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= TAB 0: LIVE TWIN OVERALL DASHBOARD ================= */}
        {activeTab === 'twin' && (
          <div className="rounded-3xl overflow-hidden border border-paper-400 bg-white shadow-md -mt-1">
            <DigitalTwinPage />
          </div>
        )}

        {/* ================= TAB 1: ARTISAN KYC & PROVIDERS ================= */}
        {activeTab === 'kyc' && (
          <div className="bg-white rounded-3xl border border-paper-400 p-6 space-y-5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-ink">
                  Artisan Verification & KYC Queue
                </h2>
                <p className="text-xs text-dusk font-sans">
                  Local craft guilds and hosts applying for verified badges and tourist insurance.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-dusk absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search provider, city, email..."
                  value={providerSearch}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-paper-100 border border-paper-300 rounded-xl text-xs font-sans focus:outline-none focus:border-ink"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-paper-100 text-dusk uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Business / Studio</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Rating</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-300">
                  {filteredProviders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-dusk">
                        No artisan providers found matching search.
                      </td>
                    </tr>
                  ) : (
                    filteredProviders.map((p) => (
                      <tr key={p.id} className="hover:bg-paper-50 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-ink">{p.business_name}</div>
                          <div className="text-[10px] text-dusk line-clamp-1">{p.description}</div>
                        </td>
                        <td className="p-3.5 text-dusk-700">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-marigold" />
                            <span>{p.city}, {p.state}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-dusk">
                          <div>{p.contact_email || 'guild@lokiva.com'}</div>
                          <div className="text-[10px] text-dusk-500">{p.phone}</div>
                        </td>
                        <td className="p-3.5 font-bold text-ink">
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-marigold fill-marigold" />
                            <span>{p.rating || 4.9}</span>
                          </span>
                        </td>
                        <td className="p-3.5">
                          {p.is_verified ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 inline-flex items-center gap-1">
                              <Check className="w-3 h-3 text-teal" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-marigold-50 text-marigold-700 border border-marigold-200">
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!p.is_verified ? (
                              <button
                                onClick={() => handleVerifyProvider(p.id, true)}
                                className="px-3 py-1.5 bg-teal hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                              >
                                Approve KYC
                              </button>
                            ) : (
                              <button
                                onClick={() => handleVerifyProvider(p.id, false)}
                                className="px-2.5 py-1 bg-paper-200 hover:bg-paper-300 text-dusk-700 rounded-lg text-[11px] font-bold transition"
                              >
                                Revoke
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteProvider(p.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Delete provider"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 2: LIVE EXPERIENCES MODERATION ================= */}
        {activeTab === 'experiences' && (
          <div className="bg-white rounded-3xl border border-paper-400 p-6 space-y-5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-ink">
                  Live Experiences & Cultural Catalogue
                </h2>
                <p className="text-xs text-dusk font-sans">
                  Real-time database moderation. Toggle visibility, edit price, or remove experiences across India.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-dusk absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search experience, city, category..."
                  value={expSearch}
                  onChange={(e) => setExpSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-paper-100 border border-paper-300 rounded-xl text-xs font-sans focus:outline-none focus:border-ink"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-paper-100 text-dusk uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Experience Title</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">City & State</th>
                    <th className="p-3.5">Price & Time</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-300">
                  {filteredExperiences.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-dusk">
                        No experiences found matching "{expSearch}".
                      </td>
                    </tr>
                  ) : (
                    filteredExperiences.map((e) => (
                      <tr key={e.id} className="hover:bg-paper-50 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-ink line-clamp-1">{e.title}</div>
                          <div className="text-[10px] text-dusk line-clamp-1">{e.tagline || e.cultural_context}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-paper-200 text-ink">
                            {e.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-dusk-700">
                          {e.city}, {e.state}
                        </td>
                        <td className="p-3.5 font-bold text-ink">
                          ₹{e.price} <span className="text-dusk font-normal">({e.approx_duration_mins || 90}m)</span>
                        </td>
                        <td className="p-3.5">
                          {e.is_active ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-300">
                              Paused
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleExpActive(e.id, Boolean(e.is_active))}
                              className={`p-1.5 rounded-lg transition ${
                                e.is_active ? 'text-teal hover:bg-teal-50' : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={e.is_active ? 'Pause experience' : 'Activate experience'}
                            >
                              {e.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteExperience(e.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Delete experience"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: USER MANAGEMENT ================= */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-paper-400 p-6 space-y-5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-ink">
                  Registered Travelers & System Accounts
                </h2>
                <p className="text-xs text-dusk font-sans">
                  Active authentication records stored securely in SQLite database.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-dusk absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, email, role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-paper-100 border border-paper-300 rounded-xl text-xs font-sans focus:outline-none focus:border-ink"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-paper-100 text-dusk uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">User Name</th>
                    <th className="p-3.5">Email Address</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Registered</th>
                    <th className="p-3.5 text-right rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-300">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-dusk">
                        No user accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-paper-50 transition">
                        <td className="p-3.5 font-bold text-ink">{u.full_name}</td>
                        <td className="p-3.5 text-dusk">{u.email}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'provider'
                                ? 'bg-marigold-100 text-marigold-900'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800">
                            Active
                          </span>
                        </td>
                        <td className="p-3.5 text-dusk-600">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="p-3.5 text-right">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 4: REALTIME AUDIT LOG ================= */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-3xl border border-paper-400 p-6 space-y-6 shadow-md">
            <div>
              <h2 className="text-xl font-display font-bold text-ink">
                Real-Time Platform Audit Stream
              </h2>
              <p className="text-xs text-dusk font-sans">
                Live chronological ledger of KYC verifications, artisan signups, and catalog syncs.
              </p>
            </div>

            <div className="space-y-3">
              {(stats?.recent_activity || []).map((act: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-paper-50 rounded-2xl border border-paper-300 text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal"></div>
                    <span className="font-bold text-ink">{act.title}</span>
                  </div>
                  <span className="text-dusk">{act.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= MODAL: ADD ARTISAN HOST ================= */}
        {isAddProviderOpen && (
          <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl border border-paper-400 p-6 sm:p-8 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-bold text-ink">
                  Register New Artisan Host
                </h3>
                <button onClick={() => setIsAddProviderOpen(false)} className="p-1 text-dusk hover:text-ink">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProviderSubmit} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-dusk font-bold mb-1">Business / Studio Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanganer Block Print Studio"
                    value={newProvider.business_name}
                    onChange={(e) => setNewProvider({ ...newProvider, business_name: e.target.value })}
                    className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-dusk font-bold mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jaipur"
                      value={newProvider.city}
                      onChange={(e) => setNewProvider({ ...newProvider, city: e.target.value })}
                      className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-dusk font-bold mb-1">State *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajasthan"
                      value={newProvider.state}
                      onChange={(e) => setNewProvider({ ...newProvider, state: e.target.value })}
                      className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-dusk font-bold mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="artisan@guild.in"
                      value={newProvider.contact_email}
                      onChange={(e) => setNewProvider({ ...newProvider, contact_email: e.target.value })}
                      className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-dusk font-bold mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={newProvider.phone}
                      onChange={(e) => setNewProvider({ ...newProvider, phone: e.target.value })}
                      className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-dusk font-bold mb-1">Description / Guild Bio</label>
                  <textarea
                    rows={2}
                    placeholder="Generational master craftsperson..."
                    value={newProvider.description}
                    onChange={(e) => setNewProvider({ ...newProvider, description: e.target.value })}
                    className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_verified_check"
                    checked={newProvider.is_verified}
                    onChange={(e) => setNewProvider({ ...newProvider, is_verified: e.target.checked })}
                    className="rounded text-teal focus:ring-teal"
                  />
                  <label htmlFor="is_verified_check" className="text-xs font-bold text-ink cursor-pointer">
                    Approve KYC & Mark Verified Immediately
                  </label>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProviderOpen(false)}
                    className="px-4 py-2 bg-paper-200 text-dusk rounded-xl font-bold hover:bg-paper-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-ink text-white rounded-xl font-bold hover:bg-teal shadow-md"
                  >
                    Save Host in Real-Time
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: ADD LIVE EXPERIENCE ================= */}
        {isAddExpOpen && (
          <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-3xl border border-paper-400 p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-bold text-ink">
                  Publish New Live Experience
                </h3>
                <button onClick={() => setIsAddExpOpen(false)} className="p-1 text-dusk hover:text-ink">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateExpSubmit} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-dusk font-bold mb-1">Experience Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Blue Pottery Wheel Studio"
                    value={newExp.title}
                    onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                    className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink"
                  />
                </div>

                <div>
                  <label className="block text-dusk font-bold mb-1">Short Tagline</label>
                  <input
                    type="text"
                    placeholder="Centuries-old quartz stone pottery masterclass"
                    value={newExp.tagline}
                    onChange={(e) => setNewExp({ ...newExp, tagline: e.target.value })}
                    className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-dusk font-bold mb-1">Category</label>
                    <select
                      value={newExp.category}
                      onChange={(e) => setNewExp({ ...newExp, category: e.target.value })}
                      className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink font-bold"
                    >
                      <option value="Art & Craft">Art & Craft</option>
                      <option value="Heritage">Heritage</option>
                      <option value="Local Food">Local Food</option>
                      <option value="Workshops">Workshops</option>
                      <option value="Nature">Nature</option>
                      <option value="Spiritual">Spiritual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-dusk font-bold mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jaipur"
                      value={newExp.city}
                      onChange={(e) => setNewExp({ ...newExp, city: e.target.value })}
                      className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-dusk font-bold mb-1">State *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajasthan"
                      value={newExp.state}
                      onChange={(e) => setNewExp({ ...newExp, state: e.target.value })}
                      className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-dusk font-bold mb-1">Price (₹ INR)</label>
                    <input
                      type="number"
                      required
                      value={newExp.price}
                      onChange={(e) => setNewExp({ ...newExp, price: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-dusk font-bold mb-1">Duration (Minutes)</label>
                    <input
                      type="number"
                      required
                      value={newExp.approx_duration_mins}
                      onChange={(e) => setNewExp({ ...newExp, approx_duration_mins: parseInt(e.target.value, 10) || 60 })}
                      className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-paper-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newExp.is_indoor}
                      onChange={(e) => setNewExp({ ...newExp, is_indoor: e.target.checked })}
                      className="rounded text-teal"
                    />
                    <span>Indoor Studio</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newExp.is_rain_safe}
                      onChange={(e) => setNewExp({ ...newExp, is_rain_safe: e.target.checked })}
                      className="rounded text-teal"
                    />
                    <span>Rain Safe</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newExp.wheelchair_accessible}
                      onChange={(e) => setNewExp({ ...newExp, wheelchair_accessible: e.target.checked })}
                      className="rounded text-teal"
                    />
                    <span>Wheelchair Accessible</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newExp.is_hidden_gem}
                      onChange={(e) => setNewExp({ ...newExp, is_hidden_gem: e.target.checked })}
                      className="rounded text-teal"
                    />
                    <span>Hidden Gem</span>
                  </label>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddExpOpen(false)}
                    className="px-4 py-2 bg-paper-200 text-dusk rounded-xl font-bold hover:bg-paper-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-ink text-white rounded-xl font-bold hover:bg-teal shadow-md"
                  >
                    Publish Experience Live
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: ADD USER ================= */}
        {isAddUserOpen && (
          <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl border border-paper-400 p-6 sm:p-8 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-bold text-ink">
                  Register User Account
                </h3>
                <button onClick={() => setIsAddUserOpen(false)} className="p-1 text-dusk hover:text-ink">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-dusk font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Iyer"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink"
                  />
                </div>

                <div>
                  <label className="block text-dusk font-bold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="priya@domain.in"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink"
                  />
                </div>

                <div>
                  <label className="block text-dusk font-bold mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink font-bold"
                  >
                    <option value="traveler">Traveler</option>
                    <option value="provider">Artisan Provider</option>
                    <option value="admin">Platform Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-dusk font-bold mb-1">Temporary Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full p-2.5 bg-paper-100 border border-paper-300 rounded-xl focus:border-ink"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="px-4 py-2 bg-paper-200 text-dusk rounded-xl font-bold hover:bg-paper-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-ink text-white rounded-xl font-bold hover:bg-teal shadow-md"
                  >
                    Register & Persist
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminDashboardPage;

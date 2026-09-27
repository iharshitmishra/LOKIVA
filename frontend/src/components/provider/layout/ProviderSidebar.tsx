import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Compass,
  CalendarCheck,
  Users,
  CreditCard,
  BarChart3,
  Star,
  Tag,
  Clock,
  Building2,
  ShieldCheck,
  Bell,
  Settings,
  ChevronRight,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
  Radio,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../lib/auth-context';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';
import { ProviderWorkspaceTab } from '../../../types/providerWorkspace';

interface ProviderSidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function ProviderSidebar({ isMobileOpen, onMobileClose }: ProviderSidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const {
    activeTab,
    setActiveTab,
    profile,
    bookings,
    notifications,
    reviews,
  } = useProviderWorkspaceStore();

  const pendingBookingsCount = bookings.filter((b) => b.status === 'pending').length;
  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;

  const NAV_SECTIONS: {
    sectionLabel?: string;
    items: {
      id: ProviderWorkspaceTab;
      label: string;
      icon: React.ElementType;
      badge?: number | string;
      badgeColor?: string;
      isAi?: boolean;
    }[];
  }[] = [
    {
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        {
          id: 'concierge',
          label: 'AI Concierge',
          icon: Sparkles,
          isAi: true,
          badge: 'Pro',
          badgeColor: 'bg-[#C85A32]/10 text-[#C85A32] border border-[#C85A32]/20',
        },
      ],
    },
    {
      sectionLabel: 'OPERATIONS',
      items: [
        { id: 'experiences', label: 'Experiences', icon: Compass },
        {
          id: 'bookings',
          label: 'Bookings',
          icon: CalendarCheck,
          badge: pendingBookingsCount > 0 ? pendingBookingsCount : undefined,
          badgeColor: 'bg-[#C85A32] text-white',
        },
        { id: 'availability', label: 'Availability', icon: Clock },
        { id: 'reviews', label: 'Reviews', icon: Star },
      ],
    },
    {
      sectionLabel: 'GROWTH & REVENUE',
      items: [
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'earnings', label: 'Earnings', icon: CreditCard },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'offers', label: 'Offers', icon: Tag },
      ],
    },
    {
      sectionLabel: 'TRUST & ACCOUNT',
      items: [
        { id: 'profile', label: 'Business Profile', icon: Building2 },
        {
          id: 'verification',
          label: 'Verification',
          icon: ShieldCheck,
          badge: profile?.is_verified ? 'Verified' : 'Pending',
          badgeColor: profile?.is_verified
            ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
            : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]',
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
          badgeColor: 'bg-[#C85A32] text-white',
        },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const handleSelectTab = (tab: ProviderWorkspaceTab) => {
    setActiveTab(tab);
    onMobileClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#FFFFFF] border-r border-[#E5DFD5] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 border-b border-[#E5DFD5] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#12213B] text-white flex items-center justify-center font-display font-black text-xl shadow-xs">
              L
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-lg text-[#12213B] tracking-tight">
                  LOKIVA
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold bg-[#FAF4ED] text-[#C85A32] px-1.5 py-0.5 rounded border border-[#E8DEC8]">
                  Provider
                </span>
              </div>
              <p className="text-[11px] text-[#556275] font-medium leading-none mt-0.5">
                Workspace OS
              </p>
            </div>
          </Link>

          <button
            onClick={onMobileClose}
            className="p-1.5 text-[#556275] hover:text-[#12213B] hover:bg-[#FAF7F2] rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operator Mini Badge */}
        <div className="p-4 mx-3 my-2 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-[#E5DFD5] shrink-0">
              <img
                src={
                  profile?.logo_url ||
                  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80'
                }
                alt="Provider Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-heading font-bold text-[#12213B] truncate">
                {profile?.business_name || 'Heritage Horizons & Trails'}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#556275]">
                <span>{profile?.city || 'Mumbai'}</span>
                <span>•</span>
                <span className="text-[#C85A32] font-semibold flex items-center gap-0.5">
                  ★ {profile?.rating || 4.92}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5 custom-scrollbar">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.sectionLabel && (
                <div className="px-3 text-[10px] font-mono font-bold tracking-wider text-[#556275] uppercase">
                  {section.sectionLabel}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-heading transition-all ${
                        isActive
                          ? item.isAi
                            ? 'bg-linear-to-r from-[#12213B] to-[#1E3A8A] text-white font-bold shadow-xs'
                            : 'bg-[#12213B] text-white font-bold shadow-xs'
                          : item.isAi
                          ? 'text-[#C85A32] hover:bg-[#FAF4ED] font-semibold'
                          : 'text-[#556275] hover:text-[#12213B] hover:bg-[#FAF7F2] font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive
                              ? 'text-white'
                              : item.isAi
                              ? 'text-[#C85A32]'
                              : 'text-[#556275]'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badgeColor || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5DFD5] space-y-2 bg-[#FAF7F2]">
          <Link
            to="/explore"
            className="flex items-center justify-between px-3 py-2 text-xs font-heading font-semibold text-[#12213B] hover:bg-white rounded-xl border border-transparent hover:border-[#E5DFD5] transition"
          >
            <span className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-[#556275]" />
              <span>Traveler Explore Mode</span>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#556275]" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-heading font-semibold text-[#DC2626] hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Sign Out</span>
            </span>
            <span className="text-[10px] font-mono text-[#DC2626] font-bold">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Sparkles,
  Plus,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Building2,
  LogOut,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../lib/auth-context';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';
import { ProviderWorkspaceTab } from '../../../types/providerWorkspace';

interface ProviderTopBarProps {
  onMobileMenuOpen: () => void;
}

const TAB_TITLES: Record<ProviderWorkspaceTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Business Overview', subtitle: 'Live performance metrics, KPIs and operational pulse' },
  concierge: { title: 'LOKIVA AI Concierge', subtitle: 'Conversational business assistant with Approval-First actions' },
  experiences: { title: 'Experiences & Listings', subtitle: 'Manage active catalog, drafts, capacity and multi-step listings' },
  bookings: { title: 'Bookings & Reservations', subtitle: 'Real-time traveler reservation ledger and calendar schedule' },
  customers: { title: 'Customer Directory', subtitle: 'Guest profiles, booking histories and lifetime spending' },
  earnings: { title: 'Earnings & Direct Settlements', subtitle: 'Track lifetime revenue, commission split and bank payouts' },
  analytics: { title: 'Performance & Conversion Analytics', subtitle: 'Detailed view-to-booking funnel and traveler demographics' },
  reviews: { title: 'Reviews & Reputation', subtitle: 'Guest ratings, sentiment breakdown and AI-assisted responses' },
  offers: { title: 'Offers & Campaigns', subtitle: 'Early-bird discounts, weekend specials and promo codes' },
  availability: { title: 'Availability & Slots', subtitle: 'Calendar slot capacities, blackout dates and operating schedules' },
  profile: { title: 'Public Business Profile', subtitle: 'Operator credentials, cover photos, description and social links' },
  verification: { title: 'KYC & Business Verification', subtitle: 'Trust tier compliance, legal identity and bank accounts' },
  notifications: { title: 'Notifications & Alerts', subtitle: 'Important updates regarding bookings, reviews and payments' },
  settings: { title: 'Account Settings', subtitle: 'Preferences, settlement accounts, notifications and security' },
  'digital-twin': { title: 'Live Weather Digital Twin', subtitle: 'Real-time weather radar, crowd displacement propagation, and indoor sanctuary capacity' },
};

export function ProviderTopBar({ onMobileMenuOpen }: ProviderTopBarProps) {
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
    notifications,
    markNotificationRead,
    setAddExperienceModalOpen,
  } = useProviderWorkspaceStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const currentViewMeta = TAB_TITLES[activeTab] || {
    title: 'Workspace',
    subtitle: 'Manage your LOKIVA business',
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/90 backdrop-blur-md border-b border-[#E5DFD5] px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onMobileMenuOpen}
          className="p-2 text-[#556275] hover:text-[#12213B] hover:bg-[#FAF7F2] rounded-xl lg:hidden"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-display font-extrabold text-[#12213B] tracking-tight leading-tight">
            {currentViewMeta.title}
          </h1>
          <p className="text-[11px] sm:text-xs text-[#556275] font-medium hidden sm:block">
            {currentViewMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Verification Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-heading font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
          <span>Verified Partner</span>
        </div>

        {/* AI Concierge Trigger Button */}
        <button
          onClick={() => setActiveTab('concierge')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-heading font-bold transition shadow-2xs ${
            activeTab === 'concierge'
              ? 'bg-[#12213B] text-white'
              : 'bg-[#FAF4ED] hover:bg-[#F5ECE0] text-[#C85A32] border border-[#E8DEC8]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C85A32]" />
          <span className="hidden sm:inline">Ask AI Concierge</span>
        </button>

        {/* Primary Action Button: Add Experience */}
        <button
          onClick={() => setAddExperienceModalOpen(true)}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#C85A32] hover:bg-[#B34D28] text-white rounded-xl text-xs font-heading font-bold transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Experience</span>
        </button>

        {/* Notifications Popover Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2.5 text-[#556275] hover:text-[#12213B] hover:bg-[#FAF7F2] rounded-xl border border-transparent hover:border-[#E5DFD5] transition"
            aria-label="View Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C85A32] rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#E5DFD5] shadow-xl p-4 space-y-3 z-50">
              <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-bold text-[#12213B]">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#C85A32]/10 text-[#C85A32] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setActiveTab('notifications');
                    setIsNotifOpen(false);
                  }}
                  className="text-[11px] text-[#C85A32] hover:underline font-semibold"
                >
                  View All
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="text-xs text-center text-[#556275] py-4">
                    No new alerts
                  </p>
                ) : (
                  notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer text-left ${
                        n.is_read
                          ? 'bg-white border-[#E5DFD5]'
                          : 'bg-[#FAF4ED] border-[#E8DEC8]'
                      }`}
                    >
                      <h5 className="text-xs font-heading font-bold text-[#12213B]">
                        {n.title}
                      </h5>
                      <p className="text-[11px] text-[#556275] mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-[9px] font-mono text-[#556275] mt-1 block">
                        {n.created_at || 'Just now'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Operator Profile & Sign Out Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#E5DFD5] hover:border-[#C85A32]/40 bg-[#FAF7F2] hover:bg-white transition cursor-pointer"
            aria-label="User Account Menu"
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-white border border-[#E5DFD5] shrink-0">
              <img
                src={
                  profile?.logo_url ||
                  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80'
                }
                alt="Provider"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="hidden sm:inline text-xs font-heading font-bold text-[#12213B] max-w-[110px] truncate">
              {profile?.business_name?.split(' ')[0] || 'Operator'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#556275]" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E5DFD5] shadow-xl p-2 space-y-1 z-50">
              <div className="px-3 py-2 border-b border-[#E5DFD5]">
                <p className="text-xs font-heading font-bold text-[#12213B] truncate">
                  {profile?.business_name || 'Heritage Horizons'}
                </p>
                <p className="text-[11px] text-[#556275] truncate">
                  {profile?.city || 'Mumbai'} • Verified Host
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveTab('profile');
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-heading font-medium text-[#12213B] hover:bg-[#FAF7F2] rounded-xl transition text-left cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-[#556275]" />
                <span>Business Profile</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-heading font-medium text-[#12213B] hover:bg-[#FAF7F2] rounded-xl transition text-left cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-[#556275]" />
                <span>Account Settings</span>
              </button>

              <div className="border-t border-[#E5DFD5] my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-heading font-bold text-[#DC2626] hover:bg-red-50 rounded-xl transition text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Sign Out of Portal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

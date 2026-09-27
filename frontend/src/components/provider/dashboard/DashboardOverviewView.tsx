import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  CalendarCheck,
  Users,
  Star,
  Eye,
  Percent,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Radio,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';

export function DashboardOverviewView() {
  const {
    kpis,
    revenueTrend,
    recentBookings,
    upcomingBookings,
    recentReviews,
    aiBriefing,
    setActiveTab,
    setAddExperienceModalOpen,
    updateBookingStatus,
    setSelectedBookingForDetails,
  } = useProviderWorkspaceStore();

  const totalRevenue = kpis?.total_revenue || 0;
  const totalBookings = kpis?.total_bookings || 0;
  const totalCustomers = kpis?.total_customers || 0;
  const avgRating = kpis?.average_rating || 4.92;
  const profileViews = kpis?.profile_views || 184;
  const cancellationRate = kpis?.cancellation_rate || 0;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* 1. LOKIVA AI Daily Briefing Banner */}
      {aiBriefing && (
        <div className="rounded-3xl bg-linear-to-r from-[#12213B] via-[#1E293B] to-[#12213B] text-white p-5 sm:p-6 shadow-md border border-[#E5DFD5]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#C85A32]/20 border border-[#C85A32]/30 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-[#C85A32]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold bg-[#C85A32] text-white px-2 py-0.5 rounded">
                  LOKIVA AI Insight
                </span>
                <span className="text-xs font-heading font-bold text-white">
                  {aiBriefing.title}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-3xl">
                {aiBriefing.summary}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('concierge')}
            className="px-4 py-2 bg-white hover:bg-[#FAF4ED] text-[#12213B] rounded-xl text-xs font-heading font-extrabold transition shadow-xs shrink-0 flex items-center gap-1.5"
          >
            <span>Open AI Concierge</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C85A32]" />
          </button>
        </div>
      )}



      {/* 2. 6 Core KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5DFD5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#556275]">
            <span className="text-xs font-heading font-medium">Total Revenue</span>
            <div className="p-1.5 rounded-lg bg-[#FAF4ED] text-[#C85A32]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-display font-extrabold text-[#12213B]">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#065F46]">
              <TrendingUp className="w-3 h-3 text-[#059669]" />
              <span>+18.4% this cycle</span>
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5DFD5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#556275]">
            <span className="text-xs font-heading font-medium">Total Bookings</span>
            <div className="p-1.5 rounded-lg bg-[#FAF4ED] text-[#12213B]">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-display font-extrabold text-[#12213B]">
              {totalBookings}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#065F46]">
              <TrendingUp className="w-3 h-3 text-[#059669]" />
              <span>+4 new this week</span>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5DFD5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#556275]">
            <span className="text-xs font-heading font-medium">Unique Guests</span>
            <div className="p-1.5 rounded-lg bg-[#FAF4ED] text-[#12213B]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-display font-extrabold text-[#12213B]">
              {totalCustomers}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#556275]">
              <span>7 repeat travelers</span>
            </div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5DFD5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#556275]">
            <span className="text-xs font-heading font-medium">Host Rating</span>
            <div className="p-1.5 rounded-lg bg-[#FAF4ED] text-[#F59E0B]">
              <Star className="w-4 h-4 fill-[#F59E0B]" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-display font-extrabold text-[#12213B]">
              {avgRating} <span className="text-xs font-normal text-[#556275]">/ 5</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#065F46]">
              <span>Top 5% across Mumbai</span>
            </div>
          </div>
        </div>

        {/* Profile Views */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5DFD5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#556275]">
            <span className="text-xs font-heading font-medium">Catalog Views</span>
            <div className="p-1.5 rounded-lg bg-[#FAF4ED] text-[#12213B]">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-display font-extrabold text-[#12213B]">
              {profileViews}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#065F46]">
              <TrendingUp className="w-3 h-3 text-[#059669]" />
              <span>+42% high discovery</span>
            </div>
          </div>
        </div>

        {/* Cancellation Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5DFD5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#556275]">
            <span className="text-xs font-heading font-medium">Cancel Rate</span>
            <div className="p-1.5 rounded-lg bg-[#FAF4ED] text-[#12213B]">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-display font-extrabold text-[#12213B]">
              {cancellationRate}%
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#065F46]">
              <span>Well below 5% benchmark</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Performance Trend Charts & Quick Action Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue & Bookings Momentum Chart */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-display font-bold text-[#12213B]">
                Revenue & Booking Trajectory
              </h3>
              <p className="text-xs text-[#556275]">
                Daily gross receipts and guest seat registrations (Past 7 days)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-[#556275]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C85A32]" />
                <span>Revenue (₹)</span>
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C85A32" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#C85A32" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DFD5" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#556275' }} stroke="#E5DFD5" />
                <YAxis tick={{ fontSize: 11, fill: '#556275' }} stroke="#E5DFD5" />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    borderColor: '#E5DFD5',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#C85A32"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Quick Actions & Operational Shortcuts */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-display font-bold text-[#12213B]">
              Quick Actions
            </h3>
            <p className="text-xs text-[#556275]">
              Core operational workflows at your fingertips
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => setAddExperienceModalOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] hover:bg-[#FAF4ED] border border-[#E5DFD5] text-left transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white text-[#C85A32] shadow-2xs group-hover:scale-105 transition">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-heading font-bold text-[#12213B]">
                    Add New Experience
                  </div>
                  <div className="text-[11px] text-[#556275]">
                    Publish walk, tasting or workshop
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#556275] group-hover:text-[#12213B] transition" />
            </button>

            <button
              onClick={() => setActiveTab('availability')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] hover:bg-[#FAF4ED] border border-[#E5DFD5] text-left transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white text-[#12213B] shadow-2xs group-hover:scale-105 transition">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-heading font-bold text-[#12213B]">
                    Manage Availability
                  </div>
                  <div className="text-[11px] text-[#556275]">
                    Open slots, set capacity or block dates
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#556275] group-hover:text-[#12213B] transition" />
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] hover:bg-[#FAF4ED] border border-[#E5DFD5] text-left transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white text-[#12213B] shadow-2xs group-hover:scale-105 transition">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-heading font-bold text-[#12213B]">
                    View Active Bookings
                  </div>
                  <div className="text-[11px] text-[#556275]">
                    Confirm guests and print invoices
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#556275] group-hover:text-[#12213B] transition" />
            </button>

            <button
              onClick={() => setActiveTab('offers')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] hover:bg-[#FAF4ED] border border-[#E5DFD5] text-left transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white text-[#C85A32] shadow-2xs group-hover:scale-105 transition">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-heading font-bold text-[#12213B]">
                    Create Promo Offer
                  </div>
                  <div className="text-[11px] text-[#556275]">
                    Weekend discounts & early bird coupons
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#556275] group-hover:text-[#12213B] transition" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Operational Feeds: Upcoming Arrivals & Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Guest Arrivals & Bookings */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-display font-bold text-[#12213B]">
                Immediate Guest Arrivals
              </h3>
              <p className="text-xs text-[#556275]">
                Upcoming confirmed reservations requiring hospitality preparation
              </p>
            </div>
            <button
              onClick={() => setActiveTab('bookings')}
              className="text-xs font-heading font-bold text-[#C85A32] hover:underline"
            >
              View All ({totalBookings})
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-[#E5DFD5] text-[11px] font-mono uppercase text-[#556275]">
                  <th className="py-2.5 font-bold">Guest & Trip</th>
                  <th className="py-2.5 font-bold">Date & Slot</th>
                  <th className="py-2.5 font-bold">Party</th>
                  <th className="py-2.5 font-bold">Amount</th>
                  <th className="py-2.5 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5]/60 text-xs font-heading">
                {upcomingBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#556275]">
                      No upcoming bookings scheduled
                    </td>
                  </tr>
                ) : (
                  upcomingBookings.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBookingForDetails(b)}
                      className="hover:bg-[#FAF7F2] transition cursor-pointer"
                    >
                      <td className="py-3 pr-2">
                        <div className="font-bold text-[#12213B]">{b.guest_name}</div>
                        <div className="text-[11px] text-[#556275] truncate max-w-[200px]">
                          {b.experience_title}
                        </div>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-[#12213B]">
                        <div>{b.booking_date}</div>
                        <div className="text-[#556275]">{b.time_slot}</div>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-[#556275]">
                        {b.party_size} {b.party_size === 1 ? 'guest' : 'guests'}
                      </td>
                      <td className="py-3 font-mono font-bold text-[#12213B]">
                        ₹{b.total_price.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                            b.status === 'confirmed'
                              ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                              : b.status === 'pending'
                              ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Recent Traveler Reviews Feed */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-display font-bold text-[#12213B]">
                Recent Guest Reviews
              </h3>
              <p className="text-xs text-[#556275]">
                Latest verified impressions & feedback
              </p>
            </div>
            <button
              onClick={() => setActiveTab('reviews')}
              className="text-xs font-heading font-bold text-[#C85A32] hover:underline"
            >
              All Reviews
            </button>
          </div>

          <div className="space-y-3">
            {recentReviews.length === 0 ? (
              <p className="text-xs text-[#556275] text-center py-6">
                No recent reviews
              </p>
            ) : (
              recentReviews.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#F59E0B]">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(r.rating)
                              ? 'fill-[#F59E0B]'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-[#556275]">
                      {r.created_at?.split(' ')[0] || 'Recently'}
                    </span>
                  </div>

                  <h5 className="text-xs font-heading font-bold text-[#12213B]">
                    {r.title || 'Wonderful experience!'}
                  </h5>
                  <p className="text-[11px] text-[#556275] line-clamp-2 leading-relaxed">
                    "{r.comment}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

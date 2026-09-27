import React from 'react';
import {
  Bell,
  CheckCircle2,
  CalendarCheck,
  CreditCard,
  Star,
  Info,
  Check,
} from 'lucide-react';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';

export function NotificationsView() {
  const { notifications, markNotificationRead } = useProviderWorkspaceStore();

  const getIcon = (category: string) => {
    switch (category) {
      case 'booking':
        return <CalendarCheck className="w-4 h-4 text-[#C85A32]" />;
      case 'payout':
        return <CreditCard className="w-4 h-4 text-[#065F46]" />;
      case 'review':
        return <Star className="w-4 h-4 text-[#F59E0B]" />;
      default:
        return <Info className="w-4 h-4 text-[#12213B]" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div className="flex items-center justify-between p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs">
        <div>
          <h3 className="text-base font-display font-bold text-[#12213B]">
            Operational Notifications & Alerts
          </h3>
          <p className="text-xs text-[#556275]">
            Real-time events regarding reservations, traveler reviews and bank settlements
          </p>
        </div>

        <button
          onClick={() => {
            notifications.forEach((n) => markNotificationRead(n.id));
          }}
          className="text-xs font-heading font-bold text-[#C85A32] hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-[#E5DFD5] text-[#556275] text-xs">
            No active notifications
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`p-4 sm:p-5 rounded-2xl border transition flex items-start justify-between gap-4 cursor-pointer ${
                n.is_read
                  ? 'bg-white border-[#E5DFD5]'
                  : 'bg-[#FAF4ED] border-[#E8DEC8] shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-white border border-[#E5DFD5] shrink-0 mt-0.5">
                  {getIcon(n.category)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-heading font-bold text-[#12213B]">
                      {n.title}
                    </h4>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#C85A32]" />
                    )}
                  </div>
                  <p className="text-xs text-[#556275] leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-[#556275] shrink-0">
                {n.created_at || 'Recently'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  UserCheck,
  ChevronRight,
  X,
  FileText,
} from 'lucide-react';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';
import { ProviderCustomer } from '../../../types/providerWorkspace';

export function CustomersView() {
  const {
    customers,
    customersSearch,
    setCustomersSearch,
    selectedCustomerForDrawer,
    setSelectedCustomerForDrawer,
    bookings,
  } = useProviderWorkspaceStore();

  const filtered = customers.filter(
    (c) =>
      !customersSearch ||
      c.customer_name.toLowerCase().includes(customersSearch.toLowerCase()) ||
      c.customer_email.toLowerCase().includes(customersSearch.toLowerCase())
  );

  const customerBookings = selectedCustomerForDrawer
    ? bookings.filter((b) => b.guest_email === selectedCustomerForDrawer.customer_email)
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#556275] absolute left-3.5 top-3" />
          <input
            type="text"
            value={customersSearch}
            onChange={(e) => setCustomersSearch(e.target.value)}
            placeholder="Search guests by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5DFD5] text-xs font-heading bg-white focus:border-[#C85A32] focus:outline-hidden"
          />
        </div>

        <span className="text-xs text-[#556275] font-mono">
          {filtered.length} Registered Guests
        </span>
      </div>

      {/* Customers Table */}
      <div className="rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E5DFD5] bg-[#FAF7F2] text-[11px] font-mono uppercase text-[#556275]">
                <th className="py-3 px-6 font-bold">Guest Profile</th>
                <th className="py-3 px-4 font-bold">Contact Info</th>
                <th className="py-3 px-4 font-bold">Bookings</th>
                <th className="py-3 px-4 font-bold">Lifetime Spend</th>
                <th className="py-3 px-4 font-bold">Last Booking</th>
                <th className="py-3 px-6 font-bold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD5]/60 text-xs font-heading">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#556275]">
                    No guest profiles found
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomerForDrawer(c)}
                    className="hover:bg-[#FAF7F2]/50 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#12213B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {c.customer_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#12213B]">{c.customer_name}</div>
                          {c.notes && (
                            <div className="text-[10px] text-[#556275] truncate max-w-[200px] italic">
                              "{c.notes}"
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-[#12213B]">{c.customer_email}</div>
                      <div className="text-[11px] text-[#556275]">{c.customer_phone || '—'}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[#12213B]">
                      {c.total_bookings} {c.total_bookings === 1 ? 'trip' : 'trips'}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[#065F46]">
                      ₹{c.total_spend.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#556275]">
                      {c.last_booking_date || 'N/A'}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <button className="text-xs font-heading font-bold text-[#C85A32] hover:underline">
                        Profile →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Drawer Modal */}
      {selectedCustomerForDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-md shadow-2xl p-6 space-y-5 overflow-y-auto custom-scrollbar flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
                <h3 className="text-base font-display font-bold text-[#12213B]">
                  Guest Portfolio
                </h3>
                <button
                  onClick={() => setSelectedCustomerForDrawer(null)}
                  className="p-1.5 text-gray-400 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5] space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#12213B] text-white flex items-center justify-center font-bold text-lg">
                    {selectedCustomerForDrawer.customer_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-heading font-bold text-[#12213B]">
                      {selectedCustomerForDrawer.customer_name}
                    </h4>
                    <p className="text-xs text-[#556275]">
                      {selectedCustomerForDrawer.customer_email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5DFD5] text-xs font-mono">
                  <div className="p-2 bg-white rounded-xl">
                    <span className="text-[10px] text-[#556275]">Lifetime Spend</span>
                    <div className="font-bold text-[#065F46]">
                      ₹{selectedCustomerForDrawer.total_spend}
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded-xl">
                    <span className="text-[10px] text-[#556275]">Completed Trips</span>
                    <div className="font-bold text-[#12213B]">
                      {selectedCustomerForDrawer.total_bookings}
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Notes */}
              <div className="p-3 rounded-xl bg-white border border-[#E5DFD5] text-xs space-y-1">
                <span className="text-[10px] font-mono text-[#556275] uppercase font-bold">
                  Operator Hospitality Notes
                </span>
                <p className="text-xs text-[#12213B]">
                  {selectedCustomerForDrawer.notes || 'No custom notes logged.'}
                </p>
              </div>

              {/* Trip History Feed */}
              <div className="space-y-2">
                <h5 className="text-xs font-heading font-bold text-[#12213B]">
                  Past Experiences Booked
                </h5>
                <div className="space-y-2">
                  {customerBookings.length === 0 ? (
                    <p className="text-xs text-[#556275] p-3 rounded-xl bg-gray-50">
                      No linked bookings in ledger
                    </p>
                  ) : (
                    customerBookings.map((b) => (
                      <div key={b.id} className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DFD5] text-xs space-y-1">
                        <div className="flex justify-between font-bold text-[#12213B]">
                          <span>{b.experience_title}</span>
                          <span className="font-mono">₹{b.total_price}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-[#556275] font-mono">
                          <span>{b.booking_date} ({b.time_slot})</span>
                          <span className="capitalize">{b.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedCustomerForDrawer(null)}
              className="w-full py-2.5 bg-[#12213B] text-white rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Mail,
  Phone,
  FileText,
  User,
  Filter,
  Calendar as CalendarIcon,
  ListFilter,
  ChevronRight,
  X,
  CreditCard,
} from 'lucide-react';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';
import { ProviderBooking } from '../../../types/providerWorkspace';

export function BookingsView() {
  const {
    bookings,
    bookingStatusFilter,
    setBookingStatusFilter,
    bookingSearch,
    setBookingSearch,
    bookingViewMode,
    setBookingViewMode,
    updateBookingStatus,
    selectedBookingForDetails,
    setSelectedBookingForDetails,
  } = useProviderWorkspaceStore();

  const [contactModalBooking, setContactModalBooking] = useState<ProviderBooking | null>(null);
  const [invoiceModalBooking, setInvoiceModalBooking] = useState<ProviderBooking | null>(null);

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus =
      bookingStatusFilter === 'all' || b.status === bookingStatusFilter;

    const matchesSearch =
      !bookingSearch ||
      b.guest_name.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.booking_code.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (b.experience_title && b.experience_title.toLowerCase().includes(bookingSearch.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]';
      case 'completed':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'pending':
        return 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Filter & View Mode Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#556275] absolute left-3.5 top-3" />
          <input
            type="text"
            value={bookingSearch}
            onChange={(e) => setBookingSearch(e.target.value)}
            placeholder="Search by guest name, booking code or trip..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5DFD5] text-xs font-heading bg-white focus:border-[#C85A32] focus:outline-hidden"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-white border border-[#E5DFD5] flex items-center gap-1">
            <button
              onClick={() => setBookingViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition ${
                bookingViewMode === 'table'
                  ? 'bg-[#12213B] text-white shadow-xs'
                  : 'text-[#556275] hover:text-[#12213B]'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Table List</span>
            </button>

            <button
              onClick={() => setBookingViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition ${
                bookingViewMode === 'calendar'
                  ? 'bg-[#12213B] text-white shadow-xs'
                  : 'text-[#556275] hover:text-[#12213B]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#E5DFD5] pb-2 custom-scrollbar">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setBookingStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold capitalize transition ${
              bookingStatusFilter === st
                ? 'bg-[#12213B] text-white'
                : 'text-[#556275] hover:bg-[#FAF7F2]'
            }`}
          >
            {st} ({bookings.filter((b) => st === 'all' || b.status === st).length})
          </button>
        ))}
      </div>

      {/* TABLE VIEW */}
      {bookingViewMode === 'table' ? (
        <div className="rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E5DFD5] bg-[#FAF7F2] text-[11px] font-mono uppercase text-[#556275]">
                  <th className="py-3 px-5 font-bold">Booking ID & Trip</th>
                  <th className="py-3 px-4 font-bold">Guest Details</th>
                  <th className="py-3 px-4 font-bold">Date & Slot</th>
                  <th className="py-3 px-4 font-bold">Party</th>
                  <th className="py-3 px-4 font-bold">Amount</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5]/60 text-xs font-heading">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#556275]">
                      No bookings matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#FAF7F2]/50 transition">
                      <td className="py-3.5 px-5">
                        <span className="font-mono text-[10px] text-[#556275] block font-bold">
                          {b.booking_code}
                        </span>
                        <span className="font-bold text-[#12213B] line-clamp-1 max-w-[220px]">
                          {b.experience_title}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#12213B]">{b.guest_name}</div>
                        <div className="text-[11px] text-[#556275]">{b.guest_email}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#12213B]">
                        <div>{b.booking_date}</div>
                        <div className="text-[#556275]">{b.time_slot}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#556275]">
                        {b.party_size} {b.party_size === 1 ? 'seat' : 'seats'}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-[#12213B]">
                          ₹{b.total_price.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-[#065F46]">
                          Net: ₹{b.net_payout.toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${getStatusBadge(
                            b.status
                          )}`}
                        >
                          {b.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {b.status === 'pending' && (
                            <button
                              onClick={() => updateBookingStatus(b.id, 'confirmed')}
                              className="px-2.5 py-1 bg-[#065F46] hover:bg-[#044D38] text-white text-[11px] font-bold rounded-lg transition"
                              title="Confirm Reservation"
                            >
                              Confirm
                            </button>
                          )}

                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => updateBookingStatus(b.id, 'completed')}
                              className="px-2.5 py-1 bg-[#12213B] hover:bg-[#1E293B] text-white text-[11px] font-bold rounded-lg transition"
                              title="Mark Completed"
                            >
                              Complete
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedBookingForDetails(b)}
                            className="p-1.5 text-[#556275] hover:text-[#12213B] hover:bg-[#FAF7F2] rounded-lg"
                            title="View Details"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setContactModalBooking(b)}
                            className="p-1.5 text-[#556275] hover:text-[#C85A32] hover:bg-[#FAF7F2] rounded-lg"
                            title="Contact Customer"
                          >
                            <Mail className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setInvoiceModalBooking(b)}
                            className="p-1.5 text-[#556275] hover:text-[#12213B] hover:bg-[#FAF7F2] rounded-lg"
                            title="Download Invoice"
                          >
                            <Download className="w-4 h-4" />
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
      ) : (
        /* CALENDAR VIEW */
        <div className="p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs space-y-4">
          <h4 className="text-sm font-display font-bold text-[#12213B]">
            Upcoming Reservation Schedule
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBookingForDetails(b)}
                className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5] hover:border-[#C85A32] transition cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[#12213B]">{b.booking_date}</span>
                  <span className="text-[#C85A32] font-semibold">{b.time_slot}</span>
                </div>
                <h5 className="text-xs font-heading font-bold text-[#12213B] line-clamp-1">
                  {b.experience_title}
                </h5>
                <div className="flex items-center justify-between text-[11px] text-[#556275] pt-1 border-t border-[#E5DFD5]">
                  <span>{b.guest_name} ({b.party_size} guests)</span>
                  <span className="font-mono font-bold text-[#12213B]">₹{b.total_price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBookingForDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-[#E5DFD5] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#556275] uppercase font-bold">
                  Reservation Record
                </span>
                <h3 className="text-base font-display font-bold text-[#12213B]">
                  {selectedBookingForDetails.booking_code}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBookingForDetails(null)}
                className="p-1.5 text-gray-400 hover:text-black rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-heading">
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DFD5]">
                <div className="text-[11px] text-[#556275]">Experience</div>
                <div className="font-bold text-[#12213B]">{selectedBookingForDetails.experience_title}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DFD5]">
                  <div className="text-[11px] text-[#556275]">Traveler</div>
                  <div className="font-bold text-[#12213B]">{selectedBookingForDetails.guest_name}</div>
                  <div className="text-[10px] text-[#556275]">{selectedBookingForDetails.guest_email}</div>
                  <div className="text-[10px] text-[#556275]">{selectedBookingForDetails.guest_phone || 'N/A'}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DFD5]">
                  <div className="text-[11px] text-[#556275]">Date & Capacity</div>
                  <div className="font-bold text-[#12213B]">{selectedBookingForDetails.booking_date}</div>
                  <div className="text-[11px] text-[#C85A32] font-mono">{selectedBookingForDetails.time_slot}</div>
                  <div className="text-[10px] text-[#556275]">{selectedBookingForDetails.party_size} Guests</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E5DFD5] space-y-1">
                <div className="text-[11px] text-[#556275]">Special Requests / Notes</div>
                <p className="text-xs text-[#12213B] italic">
                  "{selectedBookingForDetails.special_requests || 'No special requests submitted.'}"
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E5DFD5] space-y-1 font-mono text-xs">
                <div className="flex justify-between text-[#556275]">
                  <span>Gross Fare:</span>
                  <span>₹{selectedBookingForDetails.total_price}</span>
                </div>
                <div className="flex justify-between text-[#556275]">
                  <span>Platform Fee (10%):</span>
                  <span>-₹{selectedBookingForDetails.commission_amount}</span>
                </div>
                <div className="flex justify-between font-bold text-[#065F46] border-t border-[#E5DFD5] pt-1">
                  <span>Net Provider Settlement:</span>
                  <span>₹{selectedBookingForDetails.net_payout}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5DFD5]">
              <button
                onClick={() => setSelectedBookingForDetails(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#556275] hover:text-[#12213B]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Contact Drawer / Dialog */}
      {contactModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#E5DFD5] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <h3 className="text-sm font-display font-bold text-[#12213B]">
                Contact {contactModalBooking.guest_name}
              </h3>
              <button onClick={() => setContactModalBooking(null)} className="p-1.5 text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-heading">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2]">
                <Mail className="w-4 h-4 text-[#C85A32]" />
                <div>
                  <div className="text-[10px] text-[#556275]">Email Address</div>
                  <a href={`mailto:${contactModalBooking.guest_email}`} className="font-bold text-[#12213B] hover:underline">
                    {contactModalBooking.guest_email}
                  </a>
                </div>
              </div>

              {contactModalBooking.guest_phone && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2]">
                  <Phone className="w-4 h-4 text-[#065F46]" />
                  <div>
                    <div className="text-[10px] text-[#556275]">Phone / WhatsApp</div>
                    <a href={`tel:${contactModalBooking.guest_phone}`} className="font-bold text-[#12213B] hover:underline">
                      {contactModalBooking.guest_phone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setContactModalBooking(null)}
              className="w-full py-2 bg-[#12213B] text-white rounded-xl text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {invoiceModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-[#E5DFD5] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#556275] uppercase font-bold">
                  Commercial Tax Invoice
                </span>
                <h3 className="text-base font-display font-bold text-[#12213B]">
                  INV-{invoiceModalBooking.booking_code}
                </h3>
              </div>
              <button onClick={() => setInvoiceModalBooking(null)} className="p-1.5 text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5]">
              <div className="flex justify-between">
                <span className="text-[#556275]">Date:</span>
                <span className="font-bold text-[#12213B]">{invoiceModalBooking.booking_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#556275]">Guest:</span>
                <span className="font-bold text-[#12213B]">{invoiceModalBooking.guest_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#556275]">Experience:</span>
                <span className="font-bold text-[#12213B]">{invoiceModalBooking.experience_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#556275]">Party Size:</span>
                <span>{invoiceModalBooking.party_size} Pax</span>
              </div>
              <div className="border-t border-[#E5DFD5] pt-2 flex justify-between font-bold text-sm text-[#12213B]">
                <span>Total Amount:</span>
                <span>₹{invoiceModalBooking.total_price}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#065F46] font-mono font-bold">
                ✓ Verified via LOKIVA Escrow
              </span>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#C85A32] text-white rounded-xl text-xs font-heading font-bold"
              >
                <Download className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

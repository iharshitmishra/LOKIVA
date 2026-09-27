import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Lock,
  Unlock,
  Plus,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Filter,
  DollarSign,
  Compass,
  RefreshCw,
  Trash2,
  Sun,
  Flame,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';
import { ProviderAvailabilitySlot } from '../../../types/providerWorkspace';

export function AvailabilityView() {
  const {
    availability,
    selectedCalendarDate,
    setSelectedCalendarDate,
    selectedExperienceFilterForCalendar,
    setSelectedExperienceFilterForCalendar,
    experiences,
    fetchAvailability,
    saveAvailabilitySlot,
    deleteAvailabilitySlot,
    generateAvailabilitySlots,
    batchUpdateAvailability,
  } = useProviderWorkspaceStore();

  // Modals state
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isBlackoutModalOpen, setIsBlackoutModalOpen] = useState(false);

  // Add slot form
  const [slotExpId, setSlotExpId] = useState<number | ''>('');
  const [slotDate, setSlotDate] = useState(selectedCalendarDate);
  const [slotTime, setSlotTime] = useState('09:00 AM');
  const [slotCapacity, setSlotCapacity] = useState(8);
  const [slotPriceOverride, setSlotPriceOverride] = useState<number | ''>('');

  // Generate modal form
  const [genExpId, setGenExpId] = useState<number | ''>('');
  const [genDaysAhead, setGenDaysAhead] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);

  // Blackout modal form
  const [blackoutExpId, setBlackoutExpId] = useState<number | 'all'>('all');
  const [blackoutStart, setBlackoutStart] = useState('');
  const [blackoutEnd, setBlackoutEnd] = useState('');
  const [isBlackingOut, setIsBlackingOut] = useState(false);

  // Active slots for selected date & experience filter
  const slotsForDate = availability.filter((a) => {
    const matchesDate = a.date === selectedCalendarDate;
    const matchesExp =
      selectedExperienceFilterForCalendar === 'all' ||
      a.experience_id === selectedExperienceFilterForCalendar;
    return matchesDate && matchesExp;
  });

  // Daily statistics for selected date
  const totalDayCapacity = slotsForDate.reduce((sum, s) => sum + s.capacity, 0);
  const totalDayBooked = slotsForDate.reduce((sum, s) => sum + s.booked_count, 0);
  const totalDayRemaining = slotsForDate.reduce((sum, s) => sum + (s.remaining || Math.max(0, s.capacity - s.booked_count)), 0);
  const dayOccupancyPercent = totalDayCapacity > 0 ? Math.round((totalDayBooked / totalDayCapacity) * 100) : 0;

  // Selected experience object
  const currentExperience = experiences.find((e) => e.id === selectedExperienceFilterForCalendar);

  // Initialize modal exp id if empty
  useEffect(() => {
    if (experiences.length > 0 && !slotExpId) {
      setSlotExpId(experiences[0].id);
      setGenExpId(experiences[0].id);
    }
  }, [experiences, slotExpId]);

  // Keep slotDate synced with selected calendar date
  useEffect(() => {
    setSlotDate(selectedCalendarDate);
  }, [selectedCalendarDate]);

  // 14-day date strip generation
  const daysArray = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const isToday = i === 0;

    const daySlots = availability.filter((a) => {
      const matchD = a.date === dateStr;
      const matchE =
        selectedExperienceFilterForCalendar === 'all' ||
        a.experience_id === selectedExperienceFilterForCalendar;
      return matchD && matchE;
    });

    const hasBlocked = daySlots.some((s) => s.is_blocked);
    const dayCap = daySlots.reduce((acc, s) => acc + s.capacity, 0);
    const dayBooked = daySlots.reduce((acc, s) => acc + s.booked_count, 0);
    const dayRem = daySlots.reduce((acc, s) => acc + (s.remaining || Math.max(0, s.capacity - s.booked_count)), 0);
    const isSoldOut = dayCap > 0 && dayRem === 0;

    return {
      dateStr,
      dayLabel,
      dayNum,
      isToday,
      slotsCount: daySlots.length,
      hasBlocked,
      totalCapacity: dayCap,
      totalBooked: dayBooked,
      totalRemaining: dayRem,
      isSoldOut,
    };
  });

  const handleCapacityStep = async (slot: ProviderAvailabilitySlot, delta: number) => {
    const newCap = Math.max(slot.booked_count, slot.capacity + delta);
    if (newCap === slot.capacity) return;
    await saveAvailabilitySlot({
      ...slot,
      capacity: newCap,
    });
  };

  const handleToggleBlock = async (slot: ProviderAvailabilitySlot) => {
    await saveAvailabilitySlot({
      ...slot,
      is_blocked: !slot.is_blocked,
    });
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (confirm('Are you sure you want to remove this departure slot?')) {
      await deleteAvailabilitySlot(slotId);
    }
  };

  const handleCreateCustomSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotExpId || !slotDate || !slotTime) return;

    await saveAvailabilitySlot({
      experience_id: Number(slotExpId),
      date: slotDate,
      time_slot: slotTime,
      capacity: Number(slotCapacity),
      is_blocked: false,
      price_override: slotPriceOverride ? Number(slotPriceOverride) : undefined,
    });

    setIsAddSlotModalOpen(false);
  };

  const handleGenerateSchedule = async () => {
    if (!genExpId) return;
    setIsGenerating(true);
    await generateAvailabilitySlots(Number(genExpId), genDaysAhead);
    setIsGenerating(false);
    setIsGenerateModalOpen(false);
  };

  const handleApplyBlackout = async () => {
    if (!blackoutStart || !blackoutEnd) return;
    setIsBlackingOut(true);
    await batchUpdateAvailability(blackoutStart, blackoutEnd, true, blackoutExpId);
    setIsBlackingOut(false);
    setIsBlackoutModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ============================================================== */}
      {/* 1. TOP HEADER & EXPERIENCE SELECTOR CONTROLS */}
      {/* ============================================================== */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#C85A32]">
                Capacity & Inventory Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                Live Traveler Synced
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-[#12213B]">
              Availability & Departure Slot Console
            </h2>
            <p className="text-xs text-[#556275]">
              Full granular hierarchy: <strong className="text-[#12213B]">Experience → Date → Time Slot → Capacity → Booked → Remaining</strong>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF4ED] text-[#C85A32] hover:bg-[#F5ECE0] rounded-xl border border-[#E8DEC8] text-xs font-heading font-bold transition shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Auto-Generate Schedule</span>
            </button>

            <button
              onClick={() => setIsBlackoutModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-[#556275] hover:text-[#12213B] rounded-xl border border-[#E5DFD5] text-xs font-heading font-bold transition shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span>Blackout Window</span>
            </button>

            <button
              onClick={() => setIsAddSlotModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#12213B] hover:bg-[#1E293B] text-white rounded-xl text-xs font-heading font-bold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Slot</span>
            </button>
          </div>
        </div>

        {/* Experience Selector Ribbon */}
        <div className="pt-3 border-t border-[#E5DFD5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#C85A32] shrink-0" />
            <span className="text-xs font-heading font-bold text-[#12213B] shrink-0">
              Filter Experience:
            </span>
            <select
              value={selectedExperienceFilterForCalendar}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setSelectedExperienceFilterForCalendar(val);
              }}
              className="px-3 py-1.5 rounded-xl border border-[#E5DFD5] text-xs font-heading font-medium bg-[#FAF7F2] text-[#12213B] focus:border-[#C85A32] focus:outline-hidden min-w-[240px]"
            >
              <option value="all">🌟 All Active Experiences ({experiences.length})</option>
              {experiences.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.title} (Cap: {exp.max_group_size || exp.max_capacity || 10})
                </option>
              ))}
            </select>
          </div>

          {currentExperience && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#556275] bg-[#FAF7F2] px-3 py-1 rounded-xl border border-[#E5DFD5]">
              <span className="text-[#C85A32] font-bold">Default Hours:</span>
              <span>{currentExperience.opening_hours || '09:00 AM - 06:00 PM'}</span>
              <span>•</span>
              <span>{currentExperience.approx_duration_mins || 90}m duration</span>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. 14-DAY CALENDAR DATE NAVIGATOR */}
      {/* ============================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-heading font-bold text-[#12213B] flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-[#C85A32]" />
            <span>Select Date to Inspect Hierarchy:</span>
          </span>
          <span className="text-[11px] font-mono text-[#556275]">
            Green = Open Seats · Yellow = Low Capacity · Red = Sold Out
          </span>
        </div>

        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <div className="flex items-center gap-2.5 min-w-[850px]">
            {daysArray.map((day) => {
              const isSelected = selectedCalendarDate === day.dateStr;

              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedCalendarDate(day.dateStr)}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-between min-w-[85px] h-28 border transition ${
                    isSelected
                      ? 'bg-[#12213B] text-white border-[#12213B] shadow-md scale-102 ring-2 ring-[#C85A32]/40'
                      : 'bg-white text-[#556275] border-[#E5DFD5] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <span className={`text-[10px] font-mono uppercase font-bold ${isSelected ? 'text-[#E8DEC8]' : 'text-[#556275]'}`}>
                    {day.dayLabel} {day.isToday && '• Today'}
                  </span>
                  <span className={`text-xl font-display font-black ${isSelected ? 'text-white' : 'text-[#12213B]'}`}>
                    {day.dayNum}
                  </span>

                  {/* Status Indicator */}
                  <div className="w-full text-center">
                    {day.hasBlocked ? (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-red-500/30 text-red-200' : 'bg-red-50 text-red-600'}`}>
                        Blocked
                      </span>
                    ) : day.isSoldOut ? (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-red-500/30 text-red-200' : 'bg-red-50 text-red-600'}`}>
                        Sold Out
                      </span>
                    ) : day.slotsCount > 0 ? (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-[#059669]/40 text-[#A7F3D0]'
                            : day.totalRemaining <= 3
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-[#ECFDF5] text-[#065F46]'
                        }`}
                      >
                        {day.totalRemaining} left
                      </span>
                    ) : (
                      <span className={`text-[9px] font-mono ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}>
                        No slots
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. SELECTED DATE HIERARCHY SUMMARY STRIP */}
      {/* ============================================================== */}
      <div className="p-5 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs space-y-4">
        {/* Breadcrumb Hierarchy */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5DFD5] pb-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded-md bg-[#FAF4ED] text-[#C85A32] font-bold">
              Experience: {currentExperience ? currentExperience.title : 'All Listings'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#12213B] font-bold">
              Date: {selectedCalendarDate}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[#556275]">
              {slotsForDate.length} Active {slotsForDate.length === 1 ? 'Slot' : 'Slots'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSlotDate(selectedCalendarDate);
                setIsAddSlotModalOpen(true);
              }}
              className="text-xs font-heading font-bold text-[#C85A32] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Departure on this Date</span>
            </button>
          </div>
        </div>

        {/* 4-Pillar Daily Capacity Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5]">
            <div className="text-[10px] font-mono text-[#556275] uppercase font-bold">1. Total Capacity</div>
            <div className="text-xl font-display font-black text-[#12213B] mt-0.5">
              {totalDayCapacity} <span className="text-xs font-normal text-[#556275]">seats</span>
            </div>
            <div className="text-[10px] text-[#556275] mt-1">Across {slotsForDate.length} departures</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5]">
            <div className="text-[10px] font-mono text-[#556275] uppercase font-bold">2. Confirmed Booked</div>
            <div className="text-xl font-display font-black text-[#C85A32] mt-0.5">
              {totalDayBooked} <span className="text-xs font-normal text-[#556275]">guests</span>
            </div>
            <div className="text-[10px] text-[#556275] mt-1">Synced with live bookings</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0]">
            <div className="text-[10px] font-mono text-[#065F46] uppercase font-bold">3. Remaining Available</div>
            <div className="text-xl font-display font-black text-[#065F46] mt-0.5">
              {totalDayRemaining} <span className="text-xs font-normal text-[#065F46]">seats</span>
            </div>
            <div className="text-[10px] text-[#065F46] mt-1">Open for traveler reservations</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5]">
            <div className="text-[10px] font-mono text-[#556275] uppercase font-bold">4. Occupancy Rate</div>
            <div className="text-xl font-display font-black text-[#12213B] mt-0.5">
              {dayOccupancyPercent}%
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#C85A32] h-full rounded-full transition-all duration-500"
                style={{ width: `${dayOccupancyPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. GRANULAR SLOT CARDS: Time Slot -> Capacity -> Booked -> Remaining */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-heading font-bold text-[#12213B] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C85A32]" />
            <span>Departure Slots for {selectedCalendarDate}</span>
          </h4>
        </div>

        {slotsForDate.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-[#E5DFD5] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF4ED] text-[#C85A32] mx-auto flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-heading font-bold text-[#12213B]">
              No departures provisioned for this date
            </h4>
            <p className="text-xs text-[#556275] max-w-md mx-auto">
              You can automatically generate departures from your weekly schedule or add an ad-hoc departure time.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="px-4 py-2 bg-[#FAF4ED] text-[#C85A32] rounded-xl text-xs font-heading font-bold border border-[#E8DEC8]"
              >
                ⚡ Auto-Generate Schedule
              </button>
              <button
                onClick={() => {
                  setSlotDate(selectedCalendarDate);
                  setIsAddSlotModalOpen(true);
                }}
                className="px-4 py-2 bg-[#12213B] text-white rounded-xl text-xs font-heading font-bold"
              >
                + Add Single Departure
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slotsForDate.map((s) => {
              const capacity = Number(s.capacity);
              const booked = Number(s.booked_count);
              const remaining = Number(s.remaining !== undefined ? s.remaining : Math.max(0, capacity - booked));
              const isBlocked = Boolean(s.is_blocked);
              const isSoldOut = remaining === 0;

              return (
                <div
                  key={s.id || `${s.date}_${s.time_slot}`}
                  className={`p-5 rounded-3xl border transition flex flex-col justify-between space-y-4 ${
                    isBlocked
                      ? 'bg-red-50/40 border-red-200'
                      : isSoldOut
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-white border-[#E5DFD5] shadow-2xs hover:shadow-md'
                  }`}
                >
                  {/* Card Header: Time, Experience & Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-mono font-black text-[#12213B]">
                          {s.time_slot}
                        </span>
                        <span className="text-[10px] font-mono text-[#556275]">
                          ({s.experience_duration || 90}m)
                        </span>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full ${
                          isBlocked
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : isSoldOut
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : remaining <= 3
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                        }`}
                      >
                        {isBlocked ? 'Blocked' : isSoldOut ? 'Sold Out' : remaining <= 3 ? `Fast Filling (${remaining} left)` : `Open (${remaining} left)`}
                      </span>
                    </div>

                    <div className="text-xs font-heading font-bold text-[#12213B] line-clamp-1">
                      {s.experience_title}
                    </div>

                    {s.experience_category && (
                      <span className="inline-block text-[10px] font-mono text-[#C85A32] bg-[#FAF4ED] px-2 py-0.5 rounded-md">
                        {s.experience_category}
                      </span>
                    )}
                  </div>

                  {/* Visual Capacity -> Booked -> Remaining Hierarchy */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5] space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="text-[#556275]">Capacity Breakdown:</span>
                      <span className="text-[#12213B]">
                        {booked} / {capacity} Booked
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-[#C85A32] h-full transition-all duration-500"
                        style={{ width: `${capacity > 0 ? (booked / capacity) * 100 : 0}%` }}
                      />
                      <div
                        className="bg-[#059669] h-full opacity-30 transition-all duration-500"
                        style={{ width: `${capacity > 0 ? (remaining / capacity) * 100 : 100}%` }}
                      />
                    </div>

                    {/* 3 Metrics: Capacity, Booked, Remaining */}
                    <div className="grid grid-cols-3 gap-1 pt-1 text-center font-mono">
                      <div className="p-1.5 bg-white rounded-xl border border-[#E5DFD5]">
                        <div className="text-[9px] text-[#556275] uppercase">Cap</div>
                        <div className="text-xs font-bold text-[#12213B]">{capacity}</div>
                      </div>

                      <div className="p-1.5 bg-white rounded-xl border border-[#E5DFD5]">
                        <div className="text-[9px] text-[#556275] uppercase">Booked</div>
                        <div className="text-xs font-bold text-[#C85A32]">{booked}</div>
                      </div>

                      <div className="p-1.5 bg-white rounded-xl border border-[#A7F3D0] text-[#065F46] bg-[#ECFDF5]">
                        <div className="text-[9px] uppercase font-bold">Remaining</div>
                        <div className="text-xs font-black">{remaining}</div>
                      </div>
                    </div>
                  </div>

                  {/* Price & Capacity Stepper Controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#E5DFD5]">
                    {/* Capacity Incremental Stepper */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-heading text-[#556275]">Adjust Cap:</span>
                      <button
                        type="button"
                        onClick={() => handleCapacityStep(s, -1)}
                        disabled={capacity <= booked}
                        className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-xs font-bold flex items-center justify-center transition"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold w-4 text-center">{capacity}</span>
                      <button
                        type="button"
                        onClick={() => handleCapacityStep(s, 1)}
                        className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold flex items-center justify-center transition"
                      >
                        +
                      </button>
                    </div>

                    {/* Price Override */}
                    <div className="text-right">
                      <span className="text-[10px] text-[#556275] block font-mono">Fare / Guest</span>
                      <span className="text-xs font-mono font-bold text-[#12213B]">
                        ₹{s.effective_price || 1200}
                        {s.price_override && <span className="text-[9px] text-[#C85A32] ml-1">(override)</span>}
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E5DFD5]">
                    <button
                      type="button"
                      onClick={() => handleToggleBlock(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isBlocked
                          ? 'bg-white border border-gray-300 text-[#12213B] hover:bg-gray-50'
                          : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                      }`}
                    >
                      {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>{isBlocked ? 'Re-open' : 'Block Slot'}</span>
                    </button>

                    {s.id && booked === 0 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(s.id!)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition"
                        title="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 5. MODAL: ADD CUSTOM DEPARTURE SLOT */}
      {/* ============================================================== */}
      {isAddSlotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#E5DFD5] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#C85A32]">
                  New Departure Slot
                </span>
                <h3 className="text-base font-display font-bold text-[#12213B]">
                  Open Departure Slot
                </h3>
              </div>
              <button
                onClick={() => setIsAddSlotModalOpen(false)}
                className="text-gray-400 hover:text-black p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomSlot} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#12213B]">Experience Listing *</label>
                <select
                  value={slotExpId}
                  onChange={(e) => setSlotExpId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-heading bg-white"
                >
                  {experiences.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#12213B]">Date *</label>
                  <input
                    type="date"
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#12213B]">Departure Time *</label>
                  <input
                    type="text"
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    placeholder="e.g. 09:00 AM"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#12213B]">Capacity (Seats) *</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={slotCapacity}
                    onChange={(e) => setSlotCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#12213B]">Price Override (INR)</label>
                  <input
                    type="number"
                    placeholder="Optional (base price)"
                    value={slotPriceOverride}
                    onChange={(e) => setSlotPriceOverride(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5DFD5]">
                <button
                  type="button"
                  onClick={() => setIsAddSlotModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#556275]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#12213B] hover:bg-[#1E293B] text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Confirm & Open Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. MODAL: AUTO-GENERATE SCHEDULE FROM WEEKLY PATTERN */}
      {/* ============================================================== */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#E5DFD5] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C85A32]" />
                <h3 className="text-base font-display font-bold text-[#12213B]">
                  Auto-Generate Calendar Schedule
                </h3>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-gray-400 hover:text-black p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#556275] leading-relaxed">
              Populate calendar departure slots automatically based on your experience's configured{' '}
              <strong className="text-[#12213B]">weekly operating days</strong> and{' '}
              <strong className="text-[#12213B]">departure time slots</strong>.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#12213B]">Select Experience Listing *</label>
                <select
                  value={genExpId}
                  onChange={(e) => setGenExpId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-heading bg-white"
                >
                  {experiences.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.title} ({exp.operating_days?.join(', ') || 'All Days'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#12213B]">Provision Ahead</label>
                <div className="grid grid-cols-3 gap-2">
                  {[14, 30, 60].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setGenDaysAhead(days)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold border transition ${
                        genDaysAhead === days
                          ? 'bg-[#12213B] text-white border-[#12213B]'
                          : 'bg-[#FAF7F2] text-[#556275] border-[#E5DFD5]'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5DFD5]">
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[#556275]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateSchedule}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#C85A32] hover:bg-[#B34D28] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Generating...' : `Generate ${genDaysAhead} Days`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. MODAL: BLACKOUT / MAINTENANCE WINDOW */}
      {/* ============================================================== */}
      {isBlackoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#E5DFD5] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-600" />
                <h3 className="text-base font-display font-bold text-[#12213B]">
                  Set Blackout / Holiday Dates
                </h3>
              </div>
              <button onClick={() => setIsBlackoutModalOpen(false)} className="text-gray-400 hover:text-black">
                ✕
              </button>
            </div>

            <p className="text-xs text-[#556275] leading-relaxed">
              Block departures across a range of dates for seasonal monsoons, private venue hires, or personal holidays.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#12213B]">Applies To</label>
                <select
                  value={blackoutExpId}
                  onChange={(e) => setBlackoutExpId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-heading bg-white"
                >
                  <option value="all">All Experiences</option>
                  {experiences.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#12213B]">Start Date</label>
                  <input
                    type="date"
                    value={blackoutStart}
                    onChange={(e) => setBlackoutStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#12213B]">End Date</label>
                  <input
                    type="date"
                    value={blackoutEnd}
                    onChange={(e) => setBlackoutEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DFD5] text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5DFD5]">
              <button
                type="button"
                onClick={() => setIsBlackoutModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[#556275]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBlackout}
                disabled={isBlackingOut || !blackoutStart || !blackoutEnd}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {isBlackingOut ? 'Applying...' : 'Block Selected Window'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

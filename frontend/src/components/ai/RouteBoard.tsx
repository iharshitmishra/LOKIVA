import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Bus,
  Car,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Footprints,
  IndianRupee,
  MapPin,
  Navigation,
  Plus,
  Route as RouteIcon,
  RotateCcw,
  Shuffle,
  Sparkles,
  TrainFront,
  Trash2,
  Wand2,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  RoutePlan,
  RouteStop,
  addStop,
  candidateStops,
  formatDuration,
  insertionCost,
  moveStop,
  optimizeOrder,
  removeStop,
  setStartTime,
  withEditOptions,
} from '../../lib/routePlanner';

interface RouteBoardProps {
  routes: RoutePlan[];
  destination: string | null;
  groupSize?: number;
  availableHours?: number;
  lowWalking?: boolean;
  startTime?: string;
  onAskConcierge?: (question: string, route: RoutePlan) => void;
}

const MODE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  walk: Footprints,
  auto: Bus,
  metro: TrainFront,
  cab: Car,
  cab_long: Car,
  start: MapPin,
};

const START_PRESETS = [
  { label: '9 AM', value: '09:00' },
  { label: '11 AM', value: '11:00' },
  { label: '1 PM', value: '13:00' },
  { label: '4 PM', value: '16:00' },
  { label: '7 PM', value: '19:00' },
];

const IMAGE_FALLBACK =
  'data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 80%22%3E%3Crect width=%22120%22 height=%2280%22 fill=%22%23FAF7F2%22/%3E%3C/svg%3E';

/**
 * The route board is the concierge's answer shape.
 * Three distinct routes, one selected, and every edit recomputed live so the
 * travel synopsis and the totals stay true after any change.
 */
export const RouteBoard: React.FC<RouteBoardProps> = ({
  routes,
  destination,
  groupSize = 1,
  availableHours = 8,
  lowWalking = false,
  startTime = '09:00',
  onAskConcierge,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const seeded = useMemo(
    () =>
      routes.map((route) =>
        withEditOptions(route, { groupSize, availableHours, lowWalking, startTime })
      ),
    // Only reseed when the server hands us a brand new set of routes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routes]
  );

  const [selectedId, setSelectedId] = useState<string | null>(seeded[0]?.id ?? null);
  const [edited, setEdited] = useState<Record<string, RoutePlan>>({});
  // The chosen route opens straight away so the synopsis is visible
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    seeded[0] ? { [seeded[0].id]: true } : {}
  );
  const [showAdd, setShowAdd] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);

  const planOf = (id: string) => edited[id] ?? seeded.find((r) => r.id === id) ?? seeded[0];
  const original = (id: string) => seeded.find((r) => r.id === id);

  const selected = selectedId ? planOf(selectedId) : null;
  const selectedOriginal = selectedId ? original(selectedId) : null;

  const mutate = (id: string, next: RoutePlan) => {
    setEdited((prev) => ({ ...prev, [id]: next }));
  };

  const resetRoute = (id: string) => {
    setEdited((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const candidates = useMemo(() => {
    if (!selected) return [];
    return candidateStops(selected, seeded).slice(0, 6);
  }, [selected, seeded]);

  if (!seeded.length) return null;

  return (
    <div className="space-y-4">
      {/* Route selector: three distinct shapes for the same day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#C1443B] flex items-center gap-1.5">
            <RouteIcon className="w-3.5 h-3.5" />
            {seeded.length} routes through {destination || 'your destination'}
          </span>
          <span className="text-[10px] font-mono text-dusk-600">Pick one, then change anything</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {seeded.map((route) => {
            const active = route.id === selectedId;
            const isEditedRoute = Boolean(edited[route.id]);
            const selectRoute = () => {
              setSelectedId(route.id);
              setExpanded((prev) => ({ ...prev, [route.id]: true }));
            };
            return (
              <div
                key={route.id}
                role="button"
                tabIndex={0}
                onClick={selectRoute}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectRoute();
                  }
                }}
                className={`text-left p-3.5 rounded-2xl border transition shadow-xs cursor-pointer ${
                  active
                    ? 'bg-white border-[#C1443B] border-t-2 border-t-[#C1443B]'
                    : 'bg-white border-[#E5DFD5] hover:border-[#F0A63B]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-dusk-600 font-bold">
                      {route.pace}
                    </span>
                    {active && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-heading font-bold text-[#C1443B]">
                        <Check className="w-3 h-3" />
                        <span>Chosen</span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-heading font-bold text-ink leading-snug">
                    {route.title}
                  </h4>
                  <p className="text-[10px] font-sans text-dusk-600 leading-relaxed line-clamp-2">
                    {route.tagline}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1 text-[10px] font-mono text-ink">
                    <span className="font-bold">{route.stop_count} stops</span>
                    <span className="text-dusk-600">{formatDuration(route.total_duration_mins)}</span>
                    <span className="text-dusk-600">{route.total_distance_km} km</span>
                    <span className="text-[#C1443B] font-bold">{route.budget_label}</span>
                  </div>
                  {isEditedRoute && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-heading font-bold text-[#C1443B]">
                      <Sparkles className="w-3 h-3" />
                      <span>Modified by you</span>
                    </div>
                  )}
                  {route.limited_by_availability && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-sans text-dusk-600">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Limited by what is verified here</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected route detail */}
      <AnimatePresence initial={false}>
        {selected && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-3xl border border-[#E5DFD5] border-t-2 border-t-[#F0A63B] shadow-xs">
              {/* Header with the honest trade offs */}
              <div className="px-4 sm:px-5 py-4 space-y-2.5 border-b border-dashed border-[#E5DFD5]">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-heading font-extrabold text-ink leading-snug">
                      {selected.title}
                    </h3>
                    <p className="text-[11px] font-sans text-dusk-600 leading-relaxed">
                      {selected.why_it_works}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpanded((prev) => ({ ...prev, [selected.id]: false }))}
                    title="Collapse route"
                    className="p-1.5 rounded-lg text-dusk hover:text-ink hover:bg-[#FAF7F2] transition cursor-pointer flex-shrink-0"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Metric icon={Clock} label="Total" value={formatDuration(selected.total_duration_mins)} />
                  <Metric
                    icon={Navigation}
                    label="On the move"
                    value={`${formatDuration(selected.travel_duration_mins)} / ${selected.total_distance_km} km`}
                  />
                  <Metric icon={IndianRupee} label="Cost" value={selected.budget_label} accent />
                  <Metric
                    icon={MapPin}
                    label="Window"
                    value={`${selected.start_time} to ${selected.end_time}`}
                  />
                </div>

                {!selected.context_filled && (
                  <div className="text-[11px] font-sans font-semibold text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-xl px-3 py-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      This runs about {formatDuration(selected.over_window_by_mins)} past the time
                      you said you had. Remove a stop or shift the start earlier.
                    </span>
                  </div>
                )}
                {selected.has_long_haul && (
                  <div className="text-[11px] font-sans font-semibold text-dusk-700 bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl px-3 py-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#C1443B] flex-shrink-0" />
                    <span>
                      The longest hop is {selected.longest_leg_km} km. Reorder the stops to cut
                      that down.
                    </span>
                  </div>
                )}
              </div>

              {/* Modification toolbar */}
              <div className="px-4 sm:px-5 py-3 bg-[#FAF7F2] border-b border-dashed border-[#E5DFD5] flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-heading font-bold transition cursor-pointer border shadow-xs ${
                    isEditing
                      ? 'bg-[#12213B] text-white border-[#12213B]'
                      : 'bg-white text-ink border-[#E5DFD5] hover:border-[#C1443B]'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5 text-[#F0A63B]" />
                  <span>{isEditing ? 'Done editing' : 'Modify this route'}</span>
                </button>

                {isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={() => mutate(selected.id, optimizeOrder(selected))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF7F2] border border-[#E5DFD5] hover:border-[#F0A63B] rounded-xl text-[11px] font-heading font-bold text-ink transition cursor-pointer shadow-xs"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-[#C1443B]" />
                      <span>Re-cut the order</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-dusk-600">Start</span>
                      {START_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => mutate(selected.id, setStartTime(selected, preset.value))}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition cursor-pointer ${
                            isSameClockHour(selected.start_time, preset.value)
                              ? 'bg-[#FAF5EE] border-[#C1443B] text-ink font-bold'
                              : 'bg-white border-[#E5DFD5] text-dusk-600 hover:border-[#F0A63B]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {selectedOriginal && (
                      <button
                        type="button"
                        onClick={() => resetRoute(selected.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF7F2] border border-[#E5DFD5] hover:border-[#C1443B] rounded-xl text-[11px] font-heading font-bold text-ink transition cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#C1443B]" />
                        <span>Reset</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowAdd((prev) => ({ ...prev, [selected.id]: !prev[selected.id] }))}
                      disabled={!candidates.length}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF7F2] border border-[#E5DFD5] hover:border-[#C1443B] rounded-xl text-[11px] font-heading font-bold text-ink transition cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#C1443B]" />
                      <span>Add a stop</span>
                    </button>
                  </>
                )}
              </div>

              {/* Add menu */}
              <AnimatePresence initial={false}>
                {isEditing && showAdd[selected.id] && candidates.length > 0 && (
                  <motion.div
                    initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-b border-dashed border-[#E5DFD5] bg-white"
                  >
                    <div className="px-4 sm:px-5 py-3 space-y-2">
                      <span className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#C1443B]">
                        Add from the other routes
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {candidates.map((stop) => (
                          <AddCandidate
                            key={String(stop.experience_id)}
                            stop={stop}
                            cost={insertionCost(selected, stop)}
                            onAdd={() => {
                              mutate(selected.id, addStop(selected, stop));
                              setShowAdd((prev) => ({ ...prev, [selected.id]: false }));
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* The leg by leg timeline */}
              <div className="px-4 sm:px-5 py-4 space-y-0">
                {selected.stops.map((stop, idx) => (
                  <StopNode
                    key={String(stop.experience_id)}
                    stop={stop}
                    index={idx}
                    total={selected.stops.length}
                    isEditing={isEditing}
                    canRemove={selected.stops.length > 2}
                    onRemove={() => mutate(selected.id, removeStop(selected, stop.experience_id))}
                    onMove={(delta) => mutate(selected.id, moveStop(selected, stop.experience_id, delta))}
                  />
                ))}
              </div>

              {/* Footer: the trade off, and a hand off to the concierge */}
              <div className="px-4 sm:px-5 py-3.5 bg-[#FAF7F2] border-t border-dashed border-[#E5DFD5] space-y-2.5">
                <p className="text-[11px] font-sans text-dusk-700 leading-relaxed">
                  <span className="font-heading font-bold text-ink">Trade off: </span>
                  {selected.trade_off}
                  {selected.overlaps_with_other_routes > 0 && (
                    <span className="block mt-1 text-dusk-600">
                      Shares {selected.overlaps_with_other_routes} stop
                      {selected.overlaps_with_other_routes > 1 ? 's' : ''} with another option, because
                      that is all that is verified and open in this city right now.
                    </span>
                  )}
                </p>

                {onAskConcierge && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#C1443B]">
                      Want it changed?
                    </span>
                    {[
                      'make this more relaxed',
                      'swap in cheaper stops',
                      'start later in the day',
                      'cut it to two stops',
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => onAskConcierge(prompt, selected)}
                        className="px-2.5 py-1 bg-white hover:bg-[#FAF7F2] border border-[#E5DFD5] hover:border-[#C1443B] rounded-lg text-[10px] font-heading font-medium text-ink transition cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed state keeps a handle to reopen */}
      {!expanded[selectedId ?? ''] && selected && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => ({ ...prev, [selected.id]: true }))}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-[#FAF7F2] border border-[#E5DFD5] rounded-2xl shadow-xs transition cursor-pointer"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-[#FAF7F2] border border-[#E5DFD5] text-[#C1443B] flex items-center justify-center flex-shrink-0">
              <RouteIcon className="w-3.5 h-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#C1443B]">
                Route selected
              </span>
              <span className="block text-[11px] font-mono text-dusk-600 truncate">{selected.title}</span>
            </span>
          </span>
          <span className="flex items-center gap-1 text-[11px] font-heading font-bold text-ink flex-shrink-0">
            <span>Open</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#C1443B]" />
          </span>
        </button>
      )}
    </div>
  );
};

// ===========================================================================
// Small pieces
// ===========================================================================

/** True when a display clock like "4:00 PM" sits in the same hour as "16:00". */
function isSameClockHour(displayTime: string | null, preset: string): boolean {
  if (!displayTime) return false;
  const match = displayTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return false;
  let hour = parseInt(match[1], 10);
  const suffix = match[3].toUpperCase();
  if (suffix === 'PM' && hour !== 12) hour += 12;
  if (suffix === 'AM' && hour === 12) hour = 0;
  return hour === parseInt(preset.split(':')[0], 10);
}

const Metric: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}> = ({ icon: Icon, label, value, accent }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] ${
      accent
        ? 'bg-[#FAF5EE] border-[#E8DDD2] text-[#C1443B] font-bold'
        : 'bg-white border-[#E5DFD5] text-ink'
    }`}
  >
    <Icon className={accent ? 'w-3 h-3 text-[#C1443B]' : 'w-3 h-3 text-dusk-600'} />
    <span className="font-mono">{value}</span>
    <span className="font-sans text-dusk-600">{label}</span>
  </span>
);

const AddCandidate: React.FC<{
  stop: RouteStop;
  cost: number;
  onAdd: () => void;
}> = ({ stop, cost, onAdd }) => (
  <button
    type="button"
    onClick={onAdd}
    className="flex items-center gap-2 px-2.5 py-2 bg-white hover:bg-[#FAF7F2] border border-[#E5DFD5] hover:border-[#C1443B] rounded-xl text-left transition cursor-pointer"
  >
    <Thumb stop={stop} />
    <span className="min-w-0 flex-1">
      <span className="block text-[11px] font-heading font-bold text-ink leading-tight truncate">
        {stop.title}
      </span>
      <span className="block text-[10px] font-mono text-dusk-600">
        {cost < 0.7 ? 'a short walk away' : `${cost.toFixed(1)} km from the last stop`}
      </span>
    </span>
    <Plus className="w-3.5 h-3.5 text-[#C1443B] flex-shrink-0" />
  </button>
);

const Thumb: React.FC<{ stop: RouteStop }> = ({ stop }) => {
  const url = stop.image_urls?.[0] || stop.experience?.image_urls?.[0] || IMAGE_FALLBACK;
  const [src, setSrc] = useState(url);
  useEffect(() => setSrc(url), [url]);
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setSrc(IMAGE_FALLBACK)}
      className="w-9 h-9 rounded-lg object-cover border border-[#E5DFD5] flex-shrink-0"
    />
  );
};

const StopNode: React.FC<{
  stop: RouteStop;
  index: number;
  total: number;
  isEditing: boolean;
  canRemove: boolean;
  onRemove: () => void;
  onMove: (delta: -1 | 1) => void;
}> = ({ stop, index, total, isEditing, canRemove, onRemove, onMove }) => {
  const leg = stop.leg_from_previous;
  const LegIcon = leg ? MODE_ICON[leg.mode] || Navigation : MapPin;

  return (
    <div className="relative pl-0">
      {/* Travel leg synopsis */}
      {leg && (
        <div className="flex items-start gap-2.5 py-2.5 pl-1">
          <span className="w-6 h-6 rounded-lg bg-[#FAF7F2] border border-[#E5DFD5] text-[#C1443B] flex items-center justify-center flex-shrink-0 mt-0.5">
            <LegIcon className="w-3 h-3" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-sans text-ink leading-relaxed">{leg.synopsis}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-mono text-dusk-600">
              <span>{leg.duration_mins} min travel</span>
              <span>{leg.distance_km} km</span>
              {leg.direction && <span>heading {leg.direction}</span>}
            </div>
          </div>
        </div>
      )}

      {/* The stop itself */}
      <div className="flex items-start gap-2.5 py-1.5">
        <span className="w-6 h-6 rounded-lg bg-white border border-[#E5DFD5] text-ink flex items-center justify-center text-[10px] font-mono font-black flex-shrink-0 mt-1">
          {stop.sequence}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2.5 p-2.5 bg-white border border-[#E5DFD5] rounded-2xl shadow-xs">
            <Thumb stop={stop} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h5 className="text-xs font-heading font-bold text-ink leading-snug">{stop.title}</h5>
                <span className="text-[10px] font-mono font-bold text-[#C1443B] flex-shrink-0">
                  {stop.price_inr > 0 ? `\u20B9${stop.price_inr}` : 'Free'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-mono text-dusk-600">
                <span className="font-bold text-ink">{stop.arrival_time}</span>
                <span>{stop.category}</span>
                <span>{stop.stay_mins} min here</span>
                {stop.is_hidden_gem && (
                  <span className="inline-flex items-center gap-0.5 text-[#C1443B] font-bold">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>offbeat</span>
                  </span>
                )}
                {stop.wheelchair_accessible && <span>step free</span>}
              </div>
            </div>

            {isEditing && (
              <div className="flex flex-col gap-1 flex-shrink-0">
                <IconBtn
                  label="Move earlier"
                  disabled={index === 0}
                  onClick={() => onMove(-1)}
                  icon={ArrowUp}
                />
                <IconBtn
                  label="Move later"
                  disabled={index === total - 1}
                  onClick={() => onMove(1)}
                  icon={ArrowDown}
                />
                <IconBtn
                  label="Remove stop"
                  disabled={!canRemove}
                  onClick={onRemove}
                  icon={index === total - 1 ? X : Trash2}
                  danger
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const IconBtn: React.FC<{
  label: string;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
}> = ({ label, disabled, onClick, icon: Icon, danger }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
      danger
        ? 'bg-white border-[#E5DFD5] text-[#C1443B] hover:bg-[#FDF3F2]'
        : 'bg-white border-[#E5DFD5] text-dusk-600 hover:text-ink hover:border-[#F0A63B]'
    }`}
  >
    <Icon className="w-3 h-3" />
  </button>
);

export default RouteBoard;

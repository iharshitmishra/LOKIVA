import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Compass,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Train,
  Check,
  Navigation,
  ExternalLink,
  ChevronRight,
  Landmark,
  Layers,
  Shuffle,
  Route,
  Zap,
  Flame,
} from 'lucide-react';
import {
  EnRouteCorridorEvaluation,
  CorridorNode,
  solveTripleCorridorRecommendationSuite,
  buildEvaluationForBridgeNode,
  CORRIDOR_REGISTRY,
} from '../../services/corridorGraphEngine';

interface DualCorridorComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  corridorEval: EnRouteCorridorEvaluation;
  totalDays: number;
  budgetTotalInr: number;
  userInterests: string[];
  travelPace?: string;
  originQuery?: string;
  destinationQuery?: string;
  onSelectDirect: () => void;
  onSelectCorridor: (selectedEvaluation?: EnRouteCorridorEvaluation) => void;
}

export function DualCorridorComparisonModal({
  isOpen,
  onClose,
  corridorEval,
  totalDays,
  budgetTotalInr,
  userInterests,
  travelPace = 'balanced',
  originQuery,
  destinationQuery,
  onSelectDirect,
  onSelectCorridor,
}: DualCorridorComparisonModalProps) {
  // Compute initial 3-blueprint recommendation suite
  const initialSuite = useMemo(() => {
    return solveTripleCorridorRecommendationSuite({
      originQuery: originQuery || corridorEval.originNode.stateName,
      destinationQuery: destinationQuery || corridorEval.destinationNode.stateName,
      totalDays,
      userInterests,
      budgetDailyInr: Math.round(budgetTotalInr / Math.max(1, totalDays)),
      travelPace: travelPace as any,
    });
  }, [originQuery, destinationQuery, corridorEval, totalDays, userInterests, budgetTotalInr, travelPace]);

  // Active custom selected bridge nodes for Option 2 and Option 3
  const [activeShortestBridge, setActiveShortestBridge] = useState<CorridorNode>(
    initialSuite.shortestCorridor.intermediateNode
  );
  const [activeScenicBridge, setActiveScenicBridge] = useState<CorridorNode>(
    initialSuite.scenicDetourCorridor.intermediateNode
  );

  // Dynamic evaluations based on user swaps
  const currentShortestEval = useMemo(() => {
    return buildEvaluationForBridgeNode(
      {
        originQuery: corridorEval.originNode.stateName,
        destinationQuery: corridorEval.destinationNode.stateName,
        totalDays,
        userInterests,
        budgetDailyInr: Math.round(budgetTotalInr / Math.max(1, totalDays)),
        travelPace: travelPace as any,
      },
      activeShortestBridge
    );
  }, [corridorEval, totalDays, userInterests, budgetTotalInr, travelPace, activeShortestBridge]);

  const currentScenicEval = useMemo(() => {
    return buildEvaluationForBridgeNode(
      {
        originQuery: corridorEval.originNode.stateName,
        destinationQuery: corridorEval.destinationNode.stateName,
        totalDays,
        userInterests,
        budgetDailyInr: Math.round(budgetTotalInr / Math.max(1, totalDays)),
        travelPace: travelPace as any,
      },
      activeScenicBridge
    );
  }, [corridorEval, totalDays, userInterests, budgetTotalInr, travelPace, activeScenicBridge]);

  if (!isOpen) return null;

  const origin = corridorEval.originNode;
  const destination = corridorEval.destinationNode;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#3B2316]/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="relative w-full max-w-7xl rounded-[32px] bg-[#FAF6F0] border-2 border-[#DFCBB2] shadow-[0_25px_70px_rgba(59,35,22,0.35)] overflow-hidden flex flex-col my-auto max-h-[94vh]"
        >
          {/* Top Header */}
          <div className="p-5 sm:p-7 bg-gradient-to-r from-[#FFFDF9] via-[#FAF4E8] to-[#F3E8D8] border-b border-[#DFCBB2] space-y-2 flex-shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B84A27] animate-ping" />
                <span className="text-xs font-mono font-extrabold tracking-wider text-[#B84A27] uppercase">
                  Choose Your Trip Route
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3.5 py-1 rounded-xl bg-[#FFFDF9] border border-[#DFCBB2] text-xs sm:text-sm font-heading font-bold text-[#7A523B] flex items-center gap-1.5 shadow-2xs">
                  <Compass className="w-4 h-4 text-[#B84A27]" />
                  <span>{origin.stateName} → {destination.stateName}</span>
                </span>
                <span className="px-3.5 py-1 rounded-xl bg-[#FAF0DF] border border-[#F2D5A7] text-xs sm:text-sm font-heading font-extrabold text-[#9E5414]">
                  {totalDays} Days · ₹{budgetTotalInr.toLocaleString('en-IN')} Budget
                </span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-[#3B2316] tracking-tight">
                  Pick Your Route
                </h2>
                <p className="text-sm sm:text-base text-[#5C3D2E] font-sans mt-0.5">
                  We planned 3 routes for your trip. Choose a direct stay or explore connected stops along the way.
                </p>
              </div>
            </div>
          </div>

          {/* Main 3-Column Blueprints Comparison Canvas */}
          <div className="p-4 sm:p-6 lg:p-7 overflow-y-auto space-y-6 pb-12">
            {/* ── 3 DISTINCT ITINERARY BLUEPRINTS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
              {/* ═════════════════════════════════════════════════════════ */}
              {/* BLUEPRINT 1: DIRECT DESTINATION FOCUS (A ➔ C)             */}
              {/* ═════════════════════════════════════════════════════════ */}
              <motion.div
                whileHover={{ y: -4, scale: 1.005 }}
                transition={{ duration: 0.2 }}
                className="rounded-[28px] bg-[#FFFDF9] border-2 border-[#E2D2BC] hover:border-[#B84A27] p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all space-y-5 group relative"
              >
                <div className="space-y-4">
                  {/* Top Badge */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#F5EBE0] text-[#7A523B] font-heading text-xs font-extrabold tracking-wider uppercase border border-[#DFCBB2]">
                      Option 1 · Direct Trip
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-[#A67B5B]">
                      {corridorEval.directDistanceKm} km
                    </span>
                  </div>

                  {/* Vector Trajectory Strip */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E6DAC6] flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0 text-sm font-heading font-extrabold text-[#3B2316]">
                      <span className="truncate">{origin.stateCode}</span>
                      <span className="text-[#B84A27] font-bold text-sm">→ ✈ →</span>
                      <span className="truncate text-[#B84A27]">{destination.stateCode}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-heading font-extrabold text-[#B84A27] shrink-0">
                      {totalDays} Days
                    </span>
                  </div>

                  {/* Headline & Description */}
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-display font-black text-[#3B2316] leading-tight">
                      Pure {destination.stateName} Trip
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5C3D2E] font-sans leading-relaxed">
                      Spend all your days in {destination.stateName}, exploring {destination.primaryHubCity} and popular sights with no extra state travel.
                    </p>
                  </div>

                  {/* Day Allocation Ribbon */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-heading font-bold text-[#7A523B]">
                      <span>Trip Days</span>
                      <span>100% {destination.stateName} ({totalDays} Days)</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-[#B84A27]" />
                  </div>

                  {/* Signature Highlights */}
                  <div className="space-y-2 pt-2 border-t border-[#F0ECE1]">
                    <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#8C6751] block">
                      Top Places to Visit
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {destination.signatureStops.slice(0, 3).map((stop) => (
                        <span
                          key={stop}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF6F0] border border-[#E6DAC6] text-xs font-heading font-semibold text-[#3B2316]"
                        >
                          {stop}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onSelectDirect}
                    className="w-full py-4 px-4 rounded-2xl bg-[#FFFDF9] hover:bg-[#F5EBE0] border-2 border-[#DFCBB2] hover:border-[#B84A27] text-[#3B2316] font-heading font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <span>Launch Direct {destination.stateName} Trip</span>
                    <ArrowRight className="w-4 h-4 text-[#B84A27]" />
                  </button>
                </div>
              </motion.div>

              {/* ═════════════════════════════════════════════════════════ */}
              {/* BLUEPRINT 2: SHORTEST MINIMUM-DETOUR (A ➔ B ➔ C)           */}
              {/* ═════════════════════════════════════════════════════════ */}
              <motion.div
                whileHover={{ y: -4, scale: 1.005 }}
                transition={{ duration: 0.2 }}
                className="rounded-[28px] bg-gradient-to-b from-[#FFFDF9] via-[#FAF4E8] to-[#F3E8D8] border-2 border-[#B84A27] p-5 sm:p-6 flex flex-col justify-between shadow-lg shadow-[#B84A27]/15 space-y-5 relative overflow-hidden"
              >
                {/* Top Highlight Ribbon */}
                <div className="absolute top-0 right-0">
                  <span className="px-3.5 py-1 rounded-bl-2xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] text-[#FFFDF9] text-[10px] font-heading font-extrabold tracking-wider uppercase shadow-sm">
                    Recommended · Shortest Path
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Top Badge */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="px-3 py-1 rounded-full bg-[#FAF2E6] text-[#B84A27] font-heading text-xs font-extrabold tracking-wider uppercase border border-[#D47A39]/50">
                      Option 2 · Best Connected Route
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-extrabold text-[#B84A27]">
                      {currentShortestEval.chainedDistanceKm} km
                    </span>
                  </div>

                  {/* Vector Trajectory Strip */}
                  <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#DFCBB2] flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-1.5 min-w-0 text-sm font-heading font-extrabold text-[#3B2316]">
                      <span className="truncate">{origin.stateCode}</span>
                      <span className="text-[#A67B5B] font-bold">→</span>
                      <span className="text-[#D47A39] px-2 py-0.5 rounded bg-[#FAF2E6] border border-[#D47A39]/30 truncate font-mono text-xs">
                        {currentShortestEval.intermediateNode.stateCode}
                      </span>
                      <span className="text-[#A67B5B] font-bold">→</span>
                      <span className="text-[#B84A27] truncate">{destination.stateCode}</span>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-[#B84A27] shrink-0 ml-1">
                      +{currentShortestEval.detourOverheadKm} km ({currentShortestEval.detourPercentage}%)
                    </span>
                  </div>

                  {/* Headline & Description */}
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-display font-black text-[#3B2316] leading-tight">
                      Via {currentShortestEval.intermediateNode.stateName}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5C3D2E] font-sans leading-relaxed">
                      Includes a visit to <strong className="text-[#B84A27]">{currentShortestEval.intermediateNode.primaryHubCity}</strong> on your way to {destination.stateName} with minimal extra travel.
                    </p>
                  </div>

                  {/* 3-Tone Proportional State Split Ribbon */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-heading font-bold text-[#7A523B]">
                      <span>Days in Each State</span>
                      <span>3 Stops · {totalDays} Days Total</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-[#E6DAC6] p-0.5 flex gap-1 overflow-hidden">
                      <div
                        style={{
                          width: `${(currentShortestEval.recommendedDaySplit.originDays / totalDays) * 100}%`,
                        }}
                        className="h-full rounded-full bg-[#A67B5B]"
                        title={`Stop 1: ${origin.stateName} (${currentShortestEval.recommendedDaySplit.originDays}d)`}
                      />
                      <div
                        style={{
                          width: `${(currentShortestEval.recommendedDaySplit.bridgeDays / totalDays) * 100}%`,
                        }}
                        className="h-full rounded-full bg-[#D47A39]"
                        title={`Stop 2: ${currentShortestEval.intermediateNode.stateName} (${currentShortestEval.recommendedDaySplit.bridgeDays}d)`}
                      />
                      <div
                        style={{
                          width: `${(currentShortestEval.recommendedDaySplit.destinationDays / totalDays) * 100}%`,
                        }}
                        className="h-full rounded-full bg-[#B84A27]"
                        title={`Final Stop: ${destination.stateName} (${currentShortestEval.recommendedDaySplit.destinationDays}d)`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-heading font-bold text-[#7A523B]">
                      <span>{origin.stateCode} ({currentShortestEval.recommendedDaySplit.originDays}d)</span>
                      <span className="text-[#9E5414] font-extrabold">{currentShortestEval.intermediateNode.stateCode} ({currentShortestEval.recommendedDaySplit.bridgeDays}d)</span>
                      <span className="text-[#B84A27] font-extrabold">{destination.stateCode} ({currentShortestEval.recommendedDaySplit.destinationDays}d)</span>
                    </div>
                  </div>

                  {/* Quick Intermediate State Swapper Chips */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#8C6751] block">
                      Change Middle State (Point B)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {initialSuite.allViableBridgeNodes.slice(0, 4).map((item) => {
                        const isSelected = activeShortestBridge.stateName === item.node.stateName;
                        return (
                          <button
                            key={item.node.stateName}
                            type="button"
                            onClick={() => setActiveShortestBridge(item.node)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-heading font-extrabold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-[#B84A27] text-[#FFFDF9] border-[#B84A27] shadow-2xs'
                                : 'bg-[#FFFDF9] text-[#5C3D2E] border-[#DFCBB2] hover:bg-[#FAF6F0]'
                            }`}
                          >
                            {item.node.stateName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectCorridor(currentShortestEval)}
                    className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-[#B84A27] to-[#D47A39] hover:from-[#A03D20] hover:to-[#C06A2F] text-[#FFFDF9] font-heading font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#B84A27]/25 active:scale-[0.98]"
                  >
                    <span>Launch {currentShortestEval.intermediateNode.stateName} Route</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>

              {/* ═════════════════════════════════════════════════════════ */}
              {/* BLUEPRINT 3: CULTURAL / SCENIC DETOUR (A ➔ D ➔ C)         */}
              {/* ═════════════════════════════════════════════════════════ */}
              <motion.div
                whileHover={{ y: -4, scale: 1.005 }}
                transition={{ duration: 0.2 }}
                className="rounded-[28px] bg-[#FFFDF9] border-2 border-[#DFCBB2] hover:border-[#D47A39] p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all space-y-5 relative group"
              >
                {/* Top Highlight Ribbon */}
                <div className="absolute top-0 right-0">
                  <span className="px-3.5 py-1 rounded-bl-2xl bg-[#FAF0DF] border-b border-l border-[#F2D5A7] text-[#9E5414] text-[10px] font-heading font-extrabold tracking-wider uppercase">
                    Scenic Alternative
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Top Badge */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="px-3 py-1 rounded-full bg-[#FAF0DF] text-[#9E5414] font-heading text-xs font-extrabold tracking-wider uppercase border border-[#F2D5A7]">
                      Option 3 · Scenic Alternative
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-extrabold text-[#9E5414]">
                      {currentScenicEval.chainedDistanceKm} km
                    </span>
                  </div>

                  {/* Vector Trajectory Strip */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E6DAC6] flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-1.5 min-w-0 text-sm font-heading font-extrabold text-[#3B2316]">
                      <span className="truncate">{origin.stateCode}</span>
                      <span className="text-[#A67B5B] font-bold">→</span>
                      <span className="text-[#9E5414] px-2 py-0.5 rounded bg-[#FAF0DF] border border-[#F2D5A7] truncate font-mono text-xs">
                        {currentScenicEval.intermediateNode.stateCode} (Scenic)
                      </span>
                      <span className="text-[#A67B5B] font-bold">→</span>
                      <span className="text-[#B84A27] truncate">{destination.stateCode}</span>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-[#9E5414] shrink-0 ml-1">
                      +{currentScenicEval.detourOverheadKm} km
                    </span>
                  </div>

                  {/* Headline & Description */}
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-display font-black text-[#3B2316] leading-tight">
                      Via {currentScenicEval.intermediateNode.stateName}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5C3D2E] font-sans leading-relaxed">
                      Explore <strong className="text-[#9E5414]">{currentScenicEval.intermediateNode.primaryHubCity}</strong> and its rich cultural spots on your journey to {destination.stateName}.
                    </p>
                  </div>

                  {/* 3-Tone Proportional State Split Ribbon */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-heading font-bold text-[#7A523B]">
                      <span>Days in Each State</span>
                      <span>3 Stops · {totalDays} Days Total</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-[#E6DAC6] p-0.5 flex gap-1 overflow-hidden">
                      <div
                        style={{
                          width: `${(currentScenicEval.recommendedDaySplit.originDays / totalDays) * 100}%`,
                        }}
                        className="h-full rounded-full bg-[#A67B5B]"
                        title={`Stop 1: ${origin.stateName} (${currentScenicEval.recommendedDaySplit.originDays}d)`}
                      />
                      <div
                        style={{
                          width: `${(currentScenicEval.recommendedDaySplit.bridgeDays / totalDays) * 100}%`,
                        }}
                        className="h-full rounded-full bg-[#D47A39]"
                        title={`Stop 2: ${currentScenicEval.intermediateNode.stateName} (${currentScenicEval.recommendedDaySplit.bridgeDays}d)`}
                      />
                      <div
                        style={{
                          width: `${(currentScenicEval.recommendedDaySplit.destinationDays / totalDays) * 100}%`,
                        }}
                        className="h-full rounded-full bg-[#B84A27]"
                        title={`Final Stop: ${destination.stateName} (${currentScenicEval.recommendedDaySplit.destinationDays}d)`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-heading font-bold text-[#7A523B]">
                      <span>{origin.stateCode} ({currentScenicEval.recommendedDaySplit.originDays}d)</span>
                      <span className="text-[#9E5414] font-extrabold">{currentScenicEval.intermediateNode.stateCode} ({currentScenicEval.recommendedDaySplit.bridgeDays}d)</span>
                      <span className="text-[#B84A27] font-extrabold">{destination.stateCode} ({currentScenicEval.recommendedDaySplit.destinationDays}d)</span>
                    </div>
                  </div>

                  {/* Quick Intermediate State Swapper Chips */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#8C6751] block">
                      Change Scenic State (Point D)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {initialSuite.allViableBridgeNodes.slice(0, 4).map((item) => {
                        const isSelected = activeScenicBridge.stateName === item.node.stateName;
                        return (
                          <button
                            key={item.node.stateName}
                            type="button"
                            onClick={() => setActiveScenicBridge(item.node)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-heading font-extrabold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-[#9E5414] text-[#FFFDF9] border-[#9E5414] shadow-2xs'
                                : 'bg-[#FAF6F0] text-[#5C3D2E] border-[#DFCBB2] hover:bg-[#FAF0DF]'
                            }`}
                          >
                            {item.node.stateName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectCorridor(currentScenicEval)}
                    className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-[#D47A39] to-[#B84A27] hover:opacity-95 text-[#FFFDF9] font-heading font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    <span>Launch {currentScenicEval.intermediateNode.stateName} Scenic Route</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </div>

            {/* ── INTERACTIVE EXPEDITION CORRIDOR HUB EXPLORER ── */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFDF9] border border-[#DFCBB2] space-y-3 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-heading font-extrabold text-[#3B2316]">
                  <Shuffle className="w-4 h-4 text-[#B84A27]" />
                  <span>Explore Other Cities &amp; States On Your Route</span>
                </div>
                <span className="text-xs font-sans text-[#7A523B]">
                  Tap any state below to preview and swap it into your route
                </span>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {initialSuite.allViableBridgeNodes.map((item) => {
                  const isCurrentShortest = activeShortestBridge.stateName === item.node.stateName;
                  const isCurrentScenic = activeScenicBridge.stateName === item.node.stateName;

                  return (
                    <button
                      key={item.node.stateName}
                      type="button"
                      onClick={() => {
                        if (!isCurrentShortest) {
                          setActiveShortestBridge(item.node);
                        } else {
                          setActiveScenicBridge(item.node);
                        }
                      }}
                      className={`px-3.5 py-2.5 rounded-2xl text-xs font-meta transition-all flex items-center gap-2.5 shrink-0 cursor-pointer border ${
                        isCurrentShortest
                          ? 'bg-[#FAF2E6] border-[#B84A27] text-[#B84A27] font-bold shadow-2xs'
                          : isCurrentScenic
                          ? 'bg-[#FAF0DF] border-[#D47A39] text-[#9E5414] font-bold shadow-2xs'
                          : 'bg-[#FAF6F0] hover:bg-[#FAF2E6] border-[#DFCBB2] text-[#3B2316]'
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-[#B84A27]" />
                      <div className="text-left">
                        <span className="font-heading font-extrabold block text-xs sm:text-sm leading-none">
                          {item.node.stateName}
                        </span>
                        <span className="text-xs font-sans text-[#7A523B] block leading-none mt-1">
                          {item.node.primaryHubCity} · +{item.evaluation.detourOverheadKm} km
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default DualCorridorComparisonModal;


import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Check,
  Compass,
  HelpCircle,
  MapPin,
  Sparkles,
  Wand2,
  X,
  ArrowRight,
} from 'lucide-react';
import {
  BriefDimension,
  InterviewQuestion,
  INTEREST_LABELS,
  TripBrief,
  getBriefProgress,
  isDimensionAnswered,
  INTERVIEW_QUESTIONS,
} from '../../lib/conciergeInterview';

interface ConciergeQuestionPanelProps {
  question: InterviewQuestion;
  brief: TripBrief;
  skipped: string[];
  destination: string | null;
  canCurateNow: boolean;
  isBusy: boolean;
  isRefine?: boolean;
  onAnswer: (question: InterviewQuestion, values: string[]) => void;
  onSkip: (question: InterviewQuestion) => void;
  onCurateNow: () => void;
  onDismiss: () => void;
}

/**
 * Docked composer panel that hosts the concierge interview.
 * One question at a time, tap to answer, with a live brief of what has been
 * confirmed so far so the traveler always understands why they are being asked.
 */
export const ConciergeQuestionPanel: React.FC<ConciergeQuestionPanelProps> = ({
  question,
  brief,
  skipped,
  destination,
  canCurateNow,
  isBusy,
  isRefine = false,
  onAnswer,
  onSkip,
  onCurateNow,
  onDismiss,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [pending, setPending] = useState<string[]>([]);

  const progress = useMemo(() => getBriefProgress(brief, skipped), [brief, skipped]);
  const knownLabels = useMemo(
    () =>
      INTERVIEW_QUESTIONS.filter((q) => isDimensionAnswered(brief, q.id))
        .map((q) => confirmedLabel(brief, q.id))
        .filter(Boolean) as string[],
    [brief]
  );

  const isMulti = Boolean(question.multi);
  const canConfirm = pending.length > 0;

  const handleChipClick = (value: string) => {
    if (isBusy) return;
    if (!isMulti) {
      onAnswer(question, [value]);
      return;
    }
    setPending((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  return (
    <motion.div
      key={question.id}
      id="concierge-interview"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="w-full bg-white rounded-3xl border border-[#E5DFD5] border-t-2 border-t-[#C1443B] shadow-lg overflow-hidden"
    >
      {/* Live brief of everything confirmed so far */}
      {knownLabels.length > 0 && (
        <div className="px-4 sm:px-5 pt-3.5 pb-3 border-b border-dashed border-[#E5DFD5] bg-[#FAF7F2]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#C1443B] flex items-center gap-1.5">
              <Compass className="w-3 h-3" />
              Your travel brief
            </span>
            <span className="text-[10px] font-mono text-dusk-600">
              {progress.answered} of {progress.total} known
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <AnimatePresence initial={false}>
              {knownLabels.map((label) => (
                <motion.span
                  key={label}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.18 }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-[#E5DFD5] rounded-lg text-[10px] font-mono text-ink"
                >
                  <Check className="w-2.5 h-2.5 text-[#C1443B]" />
                  <span>{label}</span>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <div className="w-full bg-white border border-[#E5DFD5] h-1 rounded-full overflow-hidden mt-2.5">
            <motion.div
              animate={{ width: `${Math.round(progress.ratio * 100)}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="h-full bg-[#F0A63B]"
            />
          </div>
        </div>
      )}

      {/* Question body */}
      <div className="px-4 sm:px-5 py-4 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#C1443B]">
                <Sparkles className="w-3 h-3" />
                {isRefine ? 'Refine your trip' : 'One more thing'}
              </span>
              {destination && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-ink bg-[#FAF7F2] border border-[#E5DFD5] rounded-lg px-1.5 py-0.5">
                  <MapPin className="w-2.5 h-2.5 text-[#C1443B]" />
                  <span>{destination}</span>
                </span>
              )}
              <span className="text-[10px] font-mono text-dusk-600">
                {progress.stage} / {progress.total}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-heading font-bold text-ink leading-snug">
              {question.question}
            </h3>
            <p className="text-[11px] sm:text-xs font-sans text-dusk-600 leading-relaxed">
              {question.rationale}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            title="Stop the interview and curate now"
            className="p-1.5 rounded-lg text-dusk hover:text-ink hover:bg-[#FAF7F2] transition cursor-pointer flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Option chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {question.options.map((option) => {
            const isSelected = isMulti ? pending.includes(option.value) : false;
            return (
              <motion.button
                key={option.value}
                type="button"
                whileHover={shouldReduceMotion || isBusy ? undefined : { y: -1.5 }}
                whileTap={shouldReduceMotion || isBusy ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.14 }}
                onClick={() => handleChipClick(option.value)}
                disabled={isBusy}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-left transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'bg-[#FAF5EE] border-[#C1443B] text-ink'
                    : 'bg-white border-[#E5DFD5] hover:border-[#F0A63B] text-ink'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] flex-shrink-0 ${
                    isSelected ? 'bg-[#C1443B] text-white' : 'bg-[#FAF7F2] text-ink'
                  }`}
                >
                  {option.emoji || <Check className="w-3 h-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-heading font-bold leading-tight">{option.label}</span>
                  {option.hint && (
                    <span className="hidden sm:block text-[10px] font-mono text-dusk-600 leading-tight mt-0.5">
                      {option.hint}
                    </span>
                  )}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#C1443B] flex-shrink-0" />}
              </motion.button>
            );
          })}
        </div>

        {/* Footer controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dashed border-[#E5DFD5]">
          <button
            type="button"
            onClick={() => onSkip(question)}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 text-[11px] font-heading font-bold text-dusk-600 hover:text-ink transition cursor-pointer disabled:opacity-50"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Skip this</span>
          </button>

          <div className="flex items-center gap-2">
            {isMulti && (
              <button
                type="button"
                onClick={() => {
                  onAnswer(question, pending);
                  setPending([]);
                }}
                disabled={!canConfirm || isBusy}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FAF7F2] border border-[#E5DFD5] hover:border-ink/40 text-ink rounded-xl text-[11px] font-heading font-bold transition shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Confirm {pending.length > 0 ? `(${pending.length})` : ''}</span>
              </button>
            )}
            {canCurateNow && (
              <button
                type="button"
                onClick={onCurateNow}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#12213B] hover:bg-[#1D2E49] text-white rounded-xl text-[11px] font-heading font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Wand2 className="w-3.5 h-3.5 text-[#F0A63B]" />
                <span>{isRefine ? 'Done, curate' : 'Curate now'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#F0A63B]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function selectedValue(brief: TripBrief, id: BriefDimension): string | null {
  if (id === 'interests') return brief.interests[0] || null;
  const value = (brief as unknown as Record<string, unknown>)[id];
  return typeof value === 'string' ? value : null;
}

/** Compact label for a confirmed dimension, interests may be several. */
function confirmedLabel(brief: TripBrief, id: BriefDimension): string | null {
  if (id === 'interests') {
    const labels = brief.interests
      .map((value) => INTEREST_LABELS[value])
      .filter(Boolean);
    if (!labels.length) return null;
    return labels.length > 2 ? `${labels.slice(0, 2).join(', ')} +${labels.length - 2}` : labels.join(', ');
  }
  const value = selectedValue(brief, id);
  if (!value) return null;
  const question = INTERVIEW_QUESTIONS.find((q) => q.id === id);
  return question?.options.find((o) => o.value === value)?.label || value;
}

export default ConciergeQuestionPanel;

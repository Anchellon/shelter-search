import { useState, useEffect, useCallback, useRef } from "react";
import { useAppSelector } from "@/app/store/hooks";
import { useChat } from "../hooks/useChat";
import { groupLabel } from "@/shared/utils/groupLabel";
import { CATEGORY_LABELS, mapCategories } from "@/shared/utils/categoryLabels";
import MSO from "@/shared/components/MSO";
import type { IntakeRequest, IntakeStep, Group } from "@/app/store/slices/chatSlice";

interface VirtualStep {
  dimension: string;
  question: string;
  sectionLabel: string | null;
  type: "multi_select" | "single_select";
  options: string[];
}

const DIMENSION_LABELS: Record<string, string> = {
  age: "Age",
  housing: "Housing Status",
  gender: "Gender",
  family_status: "Family Status",
  employment: "Employment Status",
  financial: "Financial Status",
  health: "Health Concerns",
  ethnicity: "Ethnicity",
  immigration: "Immigration Status",
  other: "Other",
};

function expandSteps(steps: IntakeStep[]): VirtualStep[] {
  return steps.flatMap((step): VirtualStep[] => {
    if (Array.isArray(step.options)) {
      return [{ dimension: step.dimension, question: step.question, sectionLabel: null, type: step.type, options: step.options }];
    }
    return Object.entries(step.options).map(([label, values]) => ({
      dimension: step.dimension,
      question: step.question,
      sectionLabel: DIMENSION_LABELS[label] ?? label,
      type: step.type,
      options: values,
    }));
  });
}

// Inner component — always mounted with a key so it starts fresh per group.
// All hooks run unconditionally here; no early returns before hook calls.
function IntakeCardContent({
  intakeRequest,
  groups,
  onSubmit,
  onCancel,
}: {
  intakeRequest: IntakeRequest;
  groups: Group[];
  onSubmit: (answers: Record<string, string[]>) => void;
  onCancel: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [seExpanded, setSeExpanded] = useState(false);
  const [seValue, setSeValue] = useState("");
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { group_label, steps, group_id } = intakeRequest;
  const identifiedGroup = groups.find(g => g.group_id === group_id);
  const identifiedLabels = mapCategories(identifiedGroup?.categories ?? []);
  const virtualSteps = expandSteps(steps);
  const vStep = virtualSteps[stepIndex];
  const isMulti = vStep.type === "multi_select";
  const isSingle = vStep.type === "single_select";

  // Only the options belonging to this virtual step's option set count as "current"
  const currentAnswers = (answers[vStep.dimension] ?? []).filter((v) => vStep.options.includes(v));
  const progressPct = ((stepIndex + 1) / virtualSteps.length) * 100;
  const isLastStep = stepIndex === virtualSteps.length - 1;

  const totalNavigable = vStep.options.length + 1; // options + "something else" row
  const SE_INDEX = vStep.options.length;

  const hasSelection = currentAnswers.length > 0 || (seExpanded && !!seValue.trim());

  const toggleOption = useCallback((value: string) => {
    const prev = answers[vStep.dimension] ?? [];
    let next: string[];
    if (isMulti) {
      next = prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
    } else {
      // single-select: replace only options from this virtual step's set, keep others
      next = [...prev.filter((v) => !vStep.options.includes(v)), value];
    }
    setAnswers({ ...answers, [vStep.dimension]: next });
  }, [answers, vStep, isMulti]);

  const advanceStep = useCallback((allAnswers: Record<string, string[]>) => {
    if (stepIndex < virtualSteps.length - 1) {
      setAnswers(allAnswers);
      setStepIndex(stepIndex + 1);
      setSeExpanded(false);
      setSeValue("");
      setFocusedIndex(null);
    } else {
      onSubmit(allAnswers);
    }
  }, [stepIndex, virtualSteps.length, onSubmit]);

  const handleNext = useCallback(() => {
    const allAnswers = { ...answers };
    if (seExpanded && seValue.trim() && !allAnswers[vStep.dimension]?.includes(seValue.trim())) {
      allAnswers[vStep.dimension] = [...(allAnswers[vStep.dimension] ?? []), seValue.trim()];
    }
    advanceStep(allAnswers);
  }, [answers, seExpanded, seValue, vStep.dimension, advanceStep]);

  const handleSkip = useCallback(() => {
    advanceStep(answers);
  }, [answers, advanceStep]);

  // Keyboard: ↑↓ navigate, Enter/Space select, ⌘Enter submit, Esc cancel
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (hasSelection) handleNext();
        return;
      }
      if (seExpanded && document.activeElement?.tagName === "INPUT") return;

      switch (e.key) {
        case "Escape":
          onCancel();
          break;
        case "ArrowDown": {
          e.preventDefault();
          const next = focusedIndex === null ? 0 : (focusedIndex + 1) % totalNavigable;
          setFocusedIndex(next);
          listRef.current
            ?.querySelector<HTMLElement>(`[data-nav-index="${next}"]`)
            ?.scrollIntoView({ block: "nearest" });
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev =
            focusedIndex === null
              ? totalNavigable - 1
              : (focusedIndex - 1 + totalNavigable) % totalNavigable;
          setFocusedIndex(prev);
          listRef.current
            ?.querySelector<HTMLElement>(`[data-nav-index="${prev}"]`)
            ?.scrollIntoView({ block: "nearest" });
          break;
        }
        case "Enter":
        case " ": {
          if (focusedIndex === null) break;
          e.preventDefault();
          if (focusedIndex === SE_INDEX) {
            setSeExpanded(true);
          } else {
            toggleOption(vStep.options[focusedIndex]);
          }
          break;
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [focusedIndex, hasSelection, seExpanded, vStep.options, totalNavigable, SE_INDEX, handleNext, onCancel, toggleOption]);

  const currentGroupIndex = groups.findIndex((g) => g.group_id === group_id);
  const stepHeadingId = `intake-step-${group_id}-${stepIndex}`;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Card */}
      <div className="bg-white border border-grey-4 rounded-md shadow-modal overflow-hidden relative">

        {/* Progress bar */}
        <div
          className="h-[3px] bg-grey-2 relative"
          role="progressbar"
          aria-valuenow={stepIndex + 1}
          aria-valuemin={1}
          aria-valuemax={virtualSteps.length}
          aria-label="Step progress"
        >
          <div
            className="absolute top-0 left-0 h-full bg-brand transition-[width] duration-300 rounded-r-sm"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Header */}
        <div className="px-4 pt-3 pb-2.5 border-b border-grey-2 flex items-start justify-between gap-2">
          <div className="flex-1">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.04em] px-2 py-0.5 rounded-full bg-brand text-white mb-1.5 leading-relaxed">
              {group_label}
            </span>
            {identifiedLabels.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mb-1.5">
                {identifiedLabels.map(label => (
                  <span key={label} className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-verylight text-brand border border-brand-light leading-relaxed">
                    {label}
                  </span>
                ))}
              </div>
            )}
            <div id={stepHeadingId} className="text-[13px] font-semibold text-grey-9 leading-snug">
              {vStep.question}
            </div>
            {vStep.sectionLabel && (
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-grey-5 mt-0.5">
                {vStep.sectionLabel}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
            <span className="text-[11px] text-grey-5 whitespace-nowrap">
              Step {stepIndex + 1} of {virtualSteps.length}
            </span>
            <button
              onClick={onCancel}
              aria-label="Cancel intake (Esc)"
              className="w-6 h-6 rounded flex items-center justify-center text-grey-5 hover:bg-grey-2 hover:text-grey-9 transition-colors"
            >
              <MSO icon="close" size={16} />
            </button>
          </div>
        </div>

        {/* Options */}
        <ul
          ref={listRef}
          role={isMulti ? "group" : "radiogroup"}
          aria-labelledby={stepHeadingId}
          className="max-h-[240px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-grey-4 [&::-webkit-scrollbar-thumb]:rounded"
        >
          {vStep.options.map((value: string, navIndex: number) => {
            const checked = currentAnswers.includes(value);
            const isFocused = focusedIndex === navIndex;
            return (
              <li key={`${navIndex}_${value}`}>
                <button
                  data-nav-index={navIndex}
                  onClick={() => { toggleOption(value); setFocusedIndex(navIndex); }}
                  role={isMulti ? "checkbox" : "radio"}
                  aria-checked={checked}
                  className={[
                    "w-full flex items-center gap-3 px-4 py-[11px] border-b border-grey-2 last:border-b-0 text-left transition-colors",
                    isSingle && checked ? "bg-brand-verylight" : "",
                    isFocused ? "ring-2 ring-inset ring-brand-light bg-brand-verylight" : "hover:bg-grey-1",
                  ].join(" ")}
                >
                  {isMulti ? (
                    <span
                      aria-hidden="true"
                      className={[
                        "w-4 h-4 rounded-sm border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors",
                        checked ? "bg-brand border-brand" : "border-grey-4 bg-white",
                      ].join(" ")}
                    >
                      {checked && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className={[
                        "w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors",
                        checked ? "bg-brand border-brand" : "border-grey-4 bg-white",
                      ].join(" ")}
                    >
                      {checked && <span className="w-[7px] h-[7px] rounded-full bg-white" />}
                    </span>
                  )}
                  <span className="text-[13px] text-grey-9 flex-1">{CATEGORY_LABELS[value] ?? value}</span>
                </button>
              </li>
            );
          })}

          {/* Something else row */}
          <li>
            <button
              data-nav-index={SE_INDEX}
              onClick={() => { setSeExpanded(!seExpanded); setFocusedIndex(SE_INDEX); }}
              className={[
                "w-full flex items-center gap-3 px-4 py-[11px] border-t-[1.5px] border-grey-4 text-left transition-colors",
                seExpanded ? "bg-brand-faint" : "",
                focusedIndex === SE_INDEX && !seExpanded ? "ring-2 ring-inset ring-brand-light bg-brand-verylight" : "",
                !seExpanded && focusedIndex !== SE_INDEX ? "hover:bg-grey-2 text-grey-5" : "",
              ].join(" ")}
            >
              {!seExpanded ? (
                <span className="text-[13px] text-grey-5 flex-1">Something else...</span>
              ) : (
                <input
                  autoFocus
                  value={seValue}
                  onChange={(e) => setSeValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Describe it..."
                  aria-label="Describe something else"
                  className="flex-1 border-none border-b-[1.5px] border-brand outline-none bg-transparent font-sans text-[13px] text-grey-9 placeholder:text-[#b8b8b8] placeholder:italic py-0.5"
                />
              )}
              {seValue.trim() && !seExpanded && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l3.5 3.5L13 5" stroke="#276ce5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </li>
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-grey-2 bg-grey-1">
          <div className="flex items-center gap-1">
            {stepIndex > 0 && (
              <button
                onClick={() => { setStepIndex(stepIndex - 1); setFocusedIndex(null); }}
                className="text-[12px] font-semibold text-grey-6 hover:text-grey-9 hover:bg-grey-2 px-2 py-1 rounded transition-colors flex items-center gap-0.5"
              >
                <MSO icon="chevron_left" size={14} />
                Back
              </button>
            )}
            {isMulti && (
              <span className="text-[12px] text-grey-5 ml-1" aria-live="polite">
                {currentAnswers.length > 0 ? `${currentAnswers.length} selected` : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="text-[13px] font-semibold text-grey-6 hover:text-grey-9 hover:bg-grey-2 px-2 py-1 rounded transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              disabled={!hasSelection}
              aria-label={isLastStep ? "Submit answers" : "Next step"}
              className="w-[30px] h-[30px] rounded-md bg-brand flex items-center justify-center text-white hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <MSO icon={isLastStep ? "arrow_upward" : "arrow_forward"} size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="text-[11px] text-grey-5 px-1" aria-hidden="true">
        ↑↓ navigate · Enter select · ⌘Enter submit · Esc cancel
      </div>

      {/* Group progress dots */}
      {groups.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-1" aria-hidden="true">
          {groups.map((g, i) => (
            <span
              key={g.group_id}
              title={`Group ${groupLabel(g.group_id)}`}
              className={[
                "w-2 h-2 rounded-full transition-colors duration-200",
                i < currentGroupIndex
                  ? "bg-green-progress"
                  : i === currentGroupIndex
                  ? "bg-brand"
                  : "bg-grey-4",
              ].join(" ")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Outer guard — renders nothing when there is no active intake request.
// Passes key={group_id} so IntakeCardContent remounts fresh for each group.
export default function IntakeCard() {
  const intakeRequest = useAppSelector((s) => s.chat.intakeRequest);
  const groups = useAppSelector((s) => s.chat.groups);
  const { submitIntake, cancelIntake } = useChat();

  if (!intakeRequest) return null;

  return (
    <IntakeCardContent
      key={intakeRequest.group_id}
      intakeRequest={intakeRequest}
      groups={groups}
      onSubmit={submitIntake}
      onCancel={cancelIntake}
    />
  );
}

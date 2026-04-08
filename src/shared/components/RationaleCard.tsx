import { useState } from "react";
import MSO from "./MSO";

interface Props {
  rationale: string;
  /** Controlled mode: pass open + onToggle together */
  open?: boolean;
  onToggle?: () => void;
  /** Uncontrolled mode: set initial open state (default: true) */
  defaultOpen?: boolean;
}

export default function RationaleCard({
  rationale,
  open: openProp,
  onToggle,
  defaultOpen = true,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const toggle = isControlled ? onToggle! : () => setInternalOpen((o) => !o);

  return (
    <div className="bg-brand-verylight border border-brand-light rounded overflow-hidden flex-shrink-0">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center gap-1.5 px-3 py-2.5 text-left hover:bg-brand/5 transition-colors"
      >
        <MSO icon="auto_awesome" size={16} className="text-brand flex-shrink-0" />
        <span className="text-[12px] font-bold text-brand flex-1">Why these results?</span>
        <MSO
          icon="expand_more"
          size={16}
          className={[
            "text-brand flex-shrink-0 transition-transform duration-[180ms]",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
      {open && (
        <div className="px-3 pb-3">
          <p className="text-[12px] text-grey-6 leading-relaxed border-t border-brand-light pt-2.5">
            {rationale}
          </p>
        </div>
      )}
    </div>
  );
}

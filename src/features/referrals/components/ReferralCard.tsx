import type { ReferralSummary } from "@/services/api";
import MSO from "@/shared/components/MSO";
import GroupCard from "./GroupCard";

interface Props {
  referral: ReferralSummary;
  isOpen: boolean;
  onToggle: () => void;
  onGroupClick: (groupIndex: number) => void;
  onMoreClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function ReferralCard({ referral, isOpen, onToggle, onGroupClick, onMoreClick }: Props) {
  const date = new Date(referral.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={[
        "border-[1.5px] rounded-md bg-white overflow-hidden transition-[border-color,box-shadow] duration-150",
        isOpen
          ? "border-brand-light shadow-[0px_4px_12px_rgba(39,108,229,0.08)]"
          : "border-grey-2 hover:border-grey-4",
      ].join(" ")}
    >
      {/* Header */}
      <div
        className="flex items-center px-5 py-4 gap-3.5 cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="w-9 h-9 rounded-md bg-brand-verylight flex items-center justify-center flex-shrink-0">
          <MSO icon="groups" size={18} className="text-brand" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-grey-9 truncate leading-snug">{referral.title}</div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-grey-5">
              <MSO icon="schedule" size={13} />
              {date}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.05em] px-2 py-0.5 rounded-full bg-brand-verylight text-brand border border-brand-light">
              <MSO icon="person" size={10} />
              {referral.groups.length} {referral.groups.length === 1 ? "group" : "groups"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-brand flex-shrink-0 px-1.5 py-1 rounded hover:bg-brand-verylight transition-colors">
          <span>{isOpen ? "Hide Groups" : "View Groups"}</span>
          <MSO
            icon="expand_more"
            size={16}
            className={["transition-transform duration-[220ms]", isOpen ? "rotate-180" : ""].join(" ")}
          />
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onMoreClick(e); }}
          className="w-7 h-7 rounded flex items-center justify-center text-grey-5 hover:bg-grey-2 hover:text-grey-9 transition-colors flex-shrink-0"
          title="More options"
        >
          <MSO icon="more_vert" size={18} />
        </button>
      </div>

      {/* Accordion body */}
      <div
        className={[
          "overflow-hidden transition-[max-height] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen ? "max-h-[800px]" : "max-h-0",
        ].join(" ")}
      >
        <div className="border-t border-grey-2 px-5 py-4 bg-grey-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-grey-5 mb-3">
            Identified Groups — click a group to view matched resources
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
            {referral.groups.map((group, i) => (
              <GroupCard
                key={group.group_id}
                group={group}
                index={i}
                onClick={() => onGroupClick(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import type { ReferralSummary } from "@/services/api";
import MSO from "@/shared/components/MSO";

interface Props {
  referral: ReferralSummary;
  index: number;
  onOpen: () => void;
  onMoreClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function ReferralCard({ referral, onOpen, onMoreClick }: Props) {
  const date = new Date(referral.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const totalServices = referral.groups.reduce((sum, g) => sum + (g.service_count ?? 0), 0);

  return (
    <div
      className="border-[1.5px] border-grey-2 rounded-md bg-white hover:border-grey-4 transition-[border-color,box-shadow] duration-150 cursor-pointer group"
      onClick={onOpen}
    >
      <div className="flex items-center px-5 py-4 gap-3.5">
        {/* Icon */}
        <div className="w-9 h-9 rounded-md bg-brand-verylight flex items-center justify-center flex-shrink-0">
          <MSO icon="folder_open" size={18} className="text-brand" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-grey-9 truncate leading-snug">
            {referral.title}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-grey-5">
              <MSO icon="schedule" size={13} />
              {date}
            </span>
            <span className="text-[11px] font-semibold text-grey-6">
              {referral.groups.length} {referral.groups.length === 1 ? "need" : "needs"}
            </span>
            <span className="text-[11px] font-semibold text-brand">
              {totalServices} {totalServices === 1 ? "result" : "results"}
            </span>
          </div>
        </div>

        {/* View results */}
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          View Results
          <MSO icon="arrow_forward" size={14} />
        </div>

        {/* More button */}
        <button
          onClick={(e) => { e.stopPropagation(); onMoreClick(e); }}
          className="w-7 h-7 rounded flex items-center justify-center text-grey-5 hover:bg-grey-2 hover:text-grey-9 transition-colors flex-shrink-0"
          title="More options"
        >
          <MSO icon="more_vert" size={18} />
        </button>
      </div>
    </div>
  );
}

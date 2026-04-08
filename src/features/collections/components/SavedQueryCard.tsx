import type { SavedQuerySummary } from "@/services/api";
import { TAG_VARIANTS } from "@/shared/components/GroupTag";
import GroupTag from "@/shared/components/GroupTag";
import MSO from "@/shared/components/MSO";

interface Props {
  query: SavedQuerySummary;
  index: number;
  onOpen: () => void;
  onMoreClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function SavedQueryCard({ query, index, onOpen, onMoreClick }: Props) {
  const tag = TAG_VARIANTS[index % TAG_VARIANTS.length];
  const date = new Date(query.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="border-[1.5px] border-grey-2 rounded-md bg-white hover:border-grey-4 transition-[border-color,box-shadow] duration-150 cursor-pointer group"
      onClick={onOpen}
    >
      <div className="flex items-center px-5 py-4 gap-3.5">
        {/* Icon */}
        <div className="w-9 h-9 rounded-md bg-brand-verylight flex items-center justify-center flex-shrink-0">
          <MSO icon="bookmark" size={18} className="text-brand" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-grey-9 truncate leading-snug">
            {query.title}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-grey-5">
              <MSO icon="schedule" size={13} />
              {date}
            </span>
            <GroupTag
              tag={tag}
              label={query.group.what}
              className="text-[10px] px-2 py-0.5"
            />
            {query.group.where && (
              <span className="flex items-center gap-1 text-[11px] text-grey-5">
                <MSO icon="location_on" size={13} />
                {query.group.where}
              </span>
            )}
            <span className="text-[11px] font-semibold text-brand">
              {query.service_count} result{query.service_count !== 1 ? "s" : ""}
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

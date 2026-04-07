import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setActiveGroupId, openResultsPanel } from "@/app/store/slices/uiSlice";
import { groupLabel } from "@/shared/utils/groupLabel";
import type { Group } from "@/app/store/slices/chatSlice";

const GROUP_COLORS = [
  { tag: "bg-brand-verylight text-brand", card: "border-brand bg-brand-verylight" },
  { tag: "bg-success-bg text-success-text", card: "border-success-border bg-success-bg" },
  { tag: "bg-danger-bg text-danger-text", card: "border-danger-border bg-danger-bg" },
  { tag: "bg-warning-bg text-warning-text", card: "border-warning-border bg-warning-bg" },
];

interface Props {
  groups: Group[];
}

export default function GroupCards({ groups }: Props) {
  const dispatch = useAppDispatch();
  const activeGroupId = useAppSelector((s) => s.ui.activeGroupId);
  const resultsPanelOpen = useAppSelector((s) => s.ui.resultsPanelOpen);

  return (
    <div className="flex gap-2.5 flex-wrap" role="group" aria-label="Identified groups">
      {groups.map((group, i) => {
        const colors = GROUP_COLORS[i % GROUP_COLORS.length];
        const isActive = resultsPanelOpen && activeGroupId === group.group_id;
        const label = groupLabel(group.group_id);

        return (
          <button
            key={group.group_id}
            onClick={() => {
              dispatch(setActiveGroupId(group.group_id));
              dispatch(openResultsPanel());
            }}
            aria-pressed={isActive}
            aria-label={`Group ${label}: ${group.what}, ${group.where}`}
            className={[
              "flex-1 min-w-[140px] max-w-[220px] p-3.5 rounded border-[1.5px] text-left transition-all",
              isActive
                ? colors.card
                : "border-grey-2 bg-white hover:border-brand-light hover:shadow-card",
            ].join(" ")}
          >
            <span
              className={`inline-block text-[9px] font-bold uppercase tracking-[0.07em] px-2 py-0.5 rounded-full mb-2 ${colors.tag}`}
            >
              Group {label}
            </span>
            <div className="text-[13px] font-bold text-grey-9 leading-tight">{group.what}</div>
            <div className="text-[11px] text-grey-5 mt-1">{group.where}</div>
          </button>
        );
      })}
    </div>
  );
}

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setActiveGroupId, setActiveReferralId, openResultsPanel } from "@/app/store/slices/uiSlice";
import { setCurrentReferral } from "@/app/store/slices/chatSlice";
import { groupLabel } from "@/shared/utils/groupLabel";
import { mapCategories } from "@/shared/utils/categoryLabels";
import GroupTag, { TAG_VARIANTS } from "@/shared/components/GroupTag";
import type { Group } from "@/app/store/slices/chatSlice";

const CARD_ACTIVE_COLORS = [
  "border-brand bg-brand-verylight",
  "border-orange-300 bg-orange-50",
  "border-danger-border bg-danger-bg",
  "border-warning-border bg-warning-bg",
  "border-rose-300 bg-rose-50",
  "border-indigo-300 bg-indigo-50",
  "border-sky-300 bg-sky-50",
  "border-emerald-300 bg-emerald-50",
];

interface Props {
  groups: Group[];
  referralId?: string;
}

export default function GroupCards({ groups, referralId }: Props) {
  const dispatch = useAppDispatch();
  const activeGroupId = useAppSelector((s) => s.ui.activeGroupId);
  const activeReferralId = useAppSelector((s) => s.ui.activeReferralId);
  const resultsPanelOpen = useAppSelector((s) => s.ui.resultsPanelOpen);

  return (
    <div className="flex gap-2.5 flex-wrap" role="group" aria-label="Identified groups">
      {groups.map((group, i) => {
        const variant = TAG_VARIANTS[i % TAG_VARIANTS.length];
        const isActive = resultsPanelOpen
          && activeGroupId === group.group_id
          && (referralId ? activeReferralId === referralId : !activeReferralId);
        const label = groupLabel(group.group_id);
        const categoryLabels = mapCategories(group.categories ?? []);
        const resourceLabel = categoryLabels.length > 0 ? categoryLabels.join(" · ") : group.what;

        return (
          <button
            key={group.group_id}
            onClick={() => {
              dispatch(setActiveGroupId(group.group_id));
              dispatch(setActiveReferralId(referralId ?? null));
              dispatch(openResultsPanel());
              if (referralId) dispatch(setCurrentReferral(referralId));
            }}
            aria-pressed={isActive}
            aria-label={`Group ${label}: ${group.what}, ${group.where}`}
            className={[
              "flex-1 min-w-[140px] max-w-[220px] p-3.5 rounded border-[1.5px] text-left transition-all",
              isActive
                ? CARD_ACTIVE_COLORS[i % CARD_ACTIVE_COLORS.length]
                : "border-grey-2 bg-white hover:border-brand-light hover:shadow-card",
            ].join(" ")}
          >
            <GroupTag
              tag={variant}
              label={`Group ${label}`}
              className="text-[9px] px-2 py-0.5 mb-2"
            />
            <div className="text-[13px] font-bold text-grey-9 leading-tight">{resourceLabel}</div>
            <div className="text-[11px] text-grey-5 mt-1">{group.where}</div>
            {(categoryLabels.length > 0 || (group.eligibilities?.length ?? 0) > 0) && (
              <div className="flex flex-wrap gap-1 mt-2">
                {categoryLabels.map(l => (
                  <span key={l} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 leading-tight">
                    {l}
                  </span>
                ))}
                {(group.eligibilities ?? []).map(e => (
                  <span key={e} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 leading-tight">
                    {e}
                  </span>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

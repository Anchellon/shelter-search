import type { ReferralGroup } from "@/services/api";
import { mapCategories } from "@/shared/utils/categoryLabels";
import MSO from "@/shared/components/MSO";

export const GROUP_TAGS = [
  { label: "A", bg: "bg-brand-verylight", text: "text-brand", border: "border-brand-light" },
  { label: "B", bg: "bg-success-bg", text: "text-success-text", border: "border-success-border" },
  { label: "C", bg: "bg-danger-bg", text: "text-danger-text", border: "border-danger-border" },
  { label: "D", bg: "bg-warning-bg", text: "text-warning-text", border: "border-warning-border" },
];

interface Props {
  group: ReferralGroup;
  index: number;
  onClick: () => void;
}

export default function GroupCard({ group, index, onClick }: Props) {
  const tag = GROUP_TAGS[index % 4];
  const categoryLabels = mapCategories(group.categories ?? []);
  const resourceLabel = categoryLabels.length > 0 ? categoryLabels.join(" · ") : group.what;

  return (
    <div
      onClick={onClick}
      className="bg-white border-[1.5px] border-grey-2 rounded p-3.5 cursor-pointer transition-[border-color,box-shadow,background] duration-150 flex flex-col gap-2 hover:border-brand hover:shadow-card hover:bg-brand-verylight group"
    >
      <span
        className={`inline-block text-[9px] font-bold uppercase tracking-[0.07em] px-2 py-0.5 rounded-full leading-[1.5] self-start border ${tag.bg} ${tag.text} ${tag.border}`}
      >
        Group {tag.label}
      </span>

      <div className="text-[13px] font-bold text-grey-9 leading-snug">{resourceLabel}</div>

      <div className="flex flex-col gap-0.5">
        {group.who && (
          <div className="flex items-center gap-1 text-[11px] text-grey-5">
            <MSO icon="person" size={13} className="text-grey-4" />
            {group.who}
          </div>
        )}
        <div className="flex items-center gap-1 text-[11px] text-grey-5">
          <MSO icon="location_on" size={13} className="text-grey-4" />
          {group.where}
        </div>
      </div>

      <div className="flex items-center justify-end mt-0.5">
        <MSO
          icon="arrow_forward"
          size={16}
          className="text-grey-4 group-hover:text-brand transition-[color,transform] group-hover:translate-x-0.5"
        />
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import type { ReferralSummary } from "@/services/api";
import MSO from "@/shared/components/MSO";
import GroupTag, { TAG_VARIANTS } from "@/shared/components/GroupTag";

interface Props {
  referral: ReferralSummary | null;
  saving: boolean;
  onConfirm: (newTitle: string) => void;
  onCancel: () => void;
}

export default function RenameCollectionModal({ referral, saving, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (referral) {
      setValue(referral.title);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [referral?.id]);

  useEffect(() => {
    if (!referral) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [referral, onCancel]);

  if (!referral) return null;

  const isUnchanged = value.trim() === referral.title.trim();
  const isDisabled = !value.trim() || isUnchanged || saving;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDisabled) onConfirm(value.trim());
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-collection-title"
        className="relative z-10 w-full max-w-[480px] mx-4 bg-white rounded-lg border border-grey-2 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 id="rename-collection-title" className="text-[16px] font-bold text-grey-9">
            Rename collection
          </h2>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded text-grey-5 hover:bg-grey-2 hover:text-grey-9 transition-colors"
          >
            <MSO icon="close" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name input */}
          <div className="px-6 pb-5">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={120}
              className="w-full px-3 py-2 text-[13px] border border-grey-3 rounded focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Groups section */}
          <div className="border-t border-grey-2 px-6 py-4 bg-grey-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-grey-5 mb-3">
              Contains {referral.groups.length} {referral.groups.length === 1 ? "group" : "groups"}
            </div>
            <div className="flex flex-col gap-3">
              {referral.groups.map((group, i) => (
                <div key={group.group_id} className="flex items-start gap-3">
                  <GroupTag
                    tag={TAG_VARIANTS[i % 4]}
                    label={`Group ${String.fromCharCode(65 + i)}`}
                    className="text-[9px] px-2 py-0.5 mt-0.5 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-grey-9 leading-snug">
                      {group.what}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      {group.who && (
                        <span className="flex items-center gap-1 text-[11px] text-grey-5">
                          <MSO icon="person" size={12} className="text-grey-4" />
                          {group.who}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-grey-5">
                        <MSO icon="location_on" size={12} className="text-grey-4" />
                        {group.where}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-grey-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-[13px] text-grey-6 hover:text-grey-9 rounded hover:bg-grey-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDisabled}
              className="px-4 py-2 text-[13px] font-semibold bg-brand text-white rounded hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Rename"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

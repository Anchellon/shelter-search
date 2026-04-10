import { useEffect, useRef, useState } from "react";
import MSO from "@/shared/components/MSO";

interface Props {
  open: boolean;
  saving: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export default function SaveReferralDialog({ open, saving, onConfirm, onCancel }: Props) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (name.trim()) onConfirm(name.trim());
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
        aria-labelledby="save-referral-title"
        className="relative z-10 w-full max-w-[380px] mx-4 bg-white rounded-lg border border-grey-2 shadow-xl px-6 py-6"
      >
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded text-grey-5 hover:bg-grey-2 hover:text-grey-9 transition-colors"
        >
          <MSO icon="close" size={18} />
        </button>

        <h2 id="save-referral-title" className="text-[16px] font-bold text-grey-9 mb-1">
          Name this collection
        </h2>
        <p className="text-[12px] text-grey-5 mb-4">
          Give this search a name so you can find it later.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Maria — shelter and food"
            maxLength={120}
            className="w-full px-3 py-2 text-[13px] border border-grey-3 rounded focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-[13px] text-grey-6 hover:text-grey-9 rounded hover:bg-grey-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="px-4 py-2 text-[13px] font-semibold bg-brand text-white rounded hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Save collection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

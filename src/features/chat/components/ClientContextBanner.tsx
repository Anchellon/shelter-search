import { useAppSelector } from "@/app/store/hooks";
import { useChat } from "../hooks/useChat";
import type { ClientContext } from "@/app/store/slices/chatSlice";

const FIELD_LABELS: Record<keyof ClientContext, string> = {
  age: "Age",
  housing: "Housing",
  gender: "Gender",
  family_status: "Family",
  employment: "Employment",
  financial: "Financial",
  health: "Health",
  ethnicity: "Ethnicity",
  immigration: "Immigration",
  language: "Language",
  other: "Other",
};

function contextPills(ctx: ClientContext): { label: string; value: string }[] {
  return (Object.keys(FIELD_LABELS) as (keyof ClientContext)[])
    .filter((k) => ctx[k])
    .map((k) => ({ label: FIELD_LABELS[k], value: ctx[k] as string }));
}

export default function ClientContextBanner() {
  const clientContext = useAppSelector((s) => s.chat.clientContext);
  const { sendMessage } = useChat();

  if (!clientContext) return null;

  const pills = contextPills(clientContext);
  if (pills.length === 0) return null;

  return (
    <div
      className="flex items-start gap-2 px-4 md:px-6 py-2 bg-brand-verylight border-b border-brand-light"
      role="status"
      aria-label="Active client context"
    >
      <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-brand flex-shrink-0 mt-0.5">
        Client
      </span>
      <div className="flex flex-wrap gap-1 flex-1 min-w-0">
        {pills.map(({ label, value }) => (
          <span
            key={label}
            title={label}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-brand-light text-grey-8 leading-relaxed"
          >
            {value}
          </span>
        ))}
      </div>
      <button
        onClick={() => sendMessage("new client")}
        aria-label="Clear client context"
        className="flex-shrink-0 text-[11px] font-semibold text-grey-5 hover:text-grey-9 hover:bg-white px-2 py-0.5 rounded transition-colors mt-0.5"
      >
        Clear
      </button>
    </div>
  );
}

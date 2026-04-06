import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/shared/components/Sidebar";
import MobileHeader from "@/shared/components/MobileHeader";
import ShelterTechLogo from "@/shared/components/ShelterTechLogo";
import MSO from "@/shared/components/MSO";
import { ROUTES } from "@/app/router/routes";

const PROMPT_CHIPS = [
  {
    label: "Shelter + Health",
    text: "Group near Larkin St — one needs shelter, another needs health resources",
  },
  {
    label: "Youth Services",
    text: "18–24 year old in the Tenderloin needing HIV resources and housing",
  },
  {
    label: "Urgent Care",
    text: "Adult male in SoMa needing urgent medical care tonight",
  },
  {
    label: "Family Support",
    text: "Family of 4 in the Mission needing shelter and food assistance",
  },
];

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  function handleSubmit() {
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(ROUTES.CHAT, { state: { initialMessage: trimmed } });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  }

  function fillChip(text: string) {
    setQuery(text);
    textareaRef.current?.focus();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto bg-grey-1">
        <MobileHeader />

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[620px] flex flex-col items-center gap-7">

          {/* Hero */}
          <div className="text-center flex flex-col items-center gap-2.5">
            <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center mb-1" aria-hidden="true">
              <ShelterTechLogo size={26} />
            </div>
            <h1 className="text-2xl font-bold text-grey-9 leading-tight tracking-tight">
              Find resources for people in need
            </h1>
            <p className="text-sm text-grey-5 max-w-[400px] leading-relaxed">
              Describe who you're helping, what they need, and where they are —
              our AI will find the best matched services.
            </p>
          </div>

          {/* Search box */}
          <div className="w-full bg-white border border-grey-4 rounded-md shadow-card p-4 flex flex-col gap-2.5 focus-within:border-brand-light focus-within:shadow-[0_0_0_3px_rgba(39,108,229,0.1)] transition-all">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. I have a group near Larkin Street — one needs shelter, another needs medical care..."
              rows={3}
              aria-label="Describe who you're helping and what they need"
              className="w-full border-none outline-none font-sans text-sm text-grey-9 resize-none bg-transparent leading-relaxed placeholder:text-[#bbb]"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!query.trim()}
                aria-label="Search for services"
                className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded transition-colors"
              >
                <MSO icon="send" size={16} />
                Search
              </button>
            </div>
          </div>

          {/* Prompt chips */}
          <span className="text-[11px] font-bold text-grey-5 uppercase tracking-[0.07em] self-start">
            Try an example
          </span>
          <div className="w-full grid grid-cols-2 gap-2">
            {PROMPT_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => fillChip(chip.text)}
                aria-label={`Example: ${chip.label} — ${chip.text}`}
                className="bg-white border border-grey-2 rounded-sm p-3 text-[12px] text-grey-6 text-left leading-relaxed shadow-card hover:border-brand-light hover:bg-brand-verylight hover:text-brand-dark transition-all"
              >
                <span className="block text-[10px] font-bold uppercase tracking-[0.06em] text-brand mb-1">
                  {chip.label}
                </span>
                {chip.text}
              </button>
            ))}
          </div>

        </div>
        </div>
      </main>
    </div>
  );
}

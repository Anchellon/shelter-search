import { useState, useRef } from "react";
import { useAppSelector } from "@/app/store/hooks";

interface Props {
  onSend: (message: string) => void;
}

export default function ChatInput({ onSend }: Props) {
  const [value, setValue] = useState("");
  const isStreaming = useAppSelector((s) => s.chat.isStreaming);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    // Auto-grow
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  return (
    <div className="flex items-end gap-2 bg-white border border-grey-3 rounded-md px-3.5 py-2.5 focus-within:border-brand-light focus-within:shadow-[0_0_0_3px_rgba(39,108,229,0.07)] transition-all">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Describe who you're helping and what they need..."
        rows={1}
        disabled={isStreaming}
        className="flex-1 border-none outline-none bg-transparent font-sans text-sm text-grey-9 resize-none leading-relaxed max-h-[120px] py-0.5 placeholder:text-[#b8b8b8] disabled:opacity-60"
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || isStreaming}
        aria-label="Send message"
        className="w-[30px] h-[30px] rounded-[7px] bg-brand flex items-center justify-center text-white flex-shrink-0 mb-0.5 hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 15, fontVariationSettings: '"FILL" 1, "wght" 500, "GRAD" 0, "opsz" 20' }}
        >
          arrow_upward
        </span>
      </button>
    </div>
  );
}

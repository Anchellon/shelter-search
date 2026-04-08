import { useEffect, useRef } from "react";
import MSO from "@/shared/components/MSO";

interface Props {
  x: number;
  y: number;
  onClose: () => void;
  onDelete: () => void;
}

export default function ContextMenu({ x, y, onClose, onDelete }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Clamp position so menu doesn't overflow viewport
  const clampedX = Math.min(x, window.innerWidth - 172);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const itemClass =
    "flex items-center gap-2 px-3.5 py-2 text-[13px] text-grey-9 w-full text-left hover:bg-grey-1 transition-colors border-none bg-transparent font-[inherit] cursor-pointer";

  return (
    <div
      ref={menuRef}
      className="fixed z-[500] bg-white border border-grey-2 rounded shadow-modal py-1 min-w-[160px]"
      style={{ top: y, left: clampedX }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className={itemClass}>
        <MSO icon="edit" size={16} className="text-grey-5" />
        Rename
      </button>
      <button className={itemClass}>
        <MSO icon="refresh" size={16} className="text-grey-5" />
        Re-run Search
      </button>
      <div className="h-px bg-grey-2 my-1" />
      <button
        onClick={onDelete}
        className={[itemClass, "text-danger-text"].join(" ")}
      >
        <MSO icon="delete" size={16} className="text-danger-text" />
        Delete
      </button>
    </div>
  );
}

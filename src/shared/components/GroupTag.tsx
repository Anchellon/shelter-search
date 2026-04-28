export type TagVariant = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";

export const TAG_VARIANTS: TagVariant[] = ["a", "b", "c", "d", "e", "f", "g", "h"];

const TAG_STYLES: Record<TagVariant, string> = {
  a: "bg-brand-verylight text-brand",
  b: "bg-orange-100 text-orange-700",
  c: "bg-danger-bg text-danger-text",
  d: "bg-warning-bg text-warning-text",
  e: "bg-rose-100 text-rose-700",
  f: "bg-indigo-100 text-indigo-700",
  g: "bg-sky-100 text-sky-700",
  h: "bg-emerald-100 text-emerald-700",
};

interface Props {
  tag: TagVariant;
  label: string;
  className?: string;
}

export default function GroupTag({ tag, label, className = "" }: Props) {
  return (
    <span
      className={[
        "inline-block font-bold uppercase tracking-[0.07em] rounded-full leading-[1.5]",
        TAG_STYLES[tag],
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

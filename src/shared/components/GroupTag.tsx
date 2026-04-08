export type TagVariant = "a" | "b" | "c" | "d";

export const TAG_VARIANTS: TagVariant[] = ["a", "b", "c", "d"];

const TAG_STYLES: Record<TagVariant, string> = {
  a: "bg-brand-verylight text-brand",
  b: "bg-success-bg text-success-text",
  c: "bg-danger-bg text-danger-text",
  d: "bg-warning-bg text-warning-text",
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

interface Props {
  icon: string;
  size?: number;
  className?: string;
}

export default function MSO({ icon, size = 20, className = "" }: Props) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{ fontSize: size, fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24' }}
    >
      {icon}
    </span>
  );
}

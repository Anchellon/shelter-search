interface Props {
  icon: string;
  size?: number;
  className?: string;
  fill?: boolean;
  style?: React.CSSProperties;
}

export default function MSO({ icon, size = 20, className = "", fill = false, style }: Props) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `"FILL" ${fill ? 1 : 0}, "wght" 300, "GRAD" 0, "opsz" 24`,
        ...style,
      }}
    >
      {icon}
    </span>
  );
}

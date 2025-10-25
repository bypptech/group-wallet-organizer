interface UsdcLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function UsdcLogo({ size = 24, className = '', showText = false }: UsdcLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Circle_USDC_Logo.svg"
        alt="USDC Logo"
        width={size}
        height={size}
        className="rounded-full"
      />
      {showText && (
        <span className="font-bold text-sm tracking-wide">USDC</span>
      )}
    </div>
  );
}

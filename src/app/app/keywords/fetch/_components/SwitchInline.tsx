"use client";

interface SwitchInlineProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function SwitchInline({
  checked,
  onChange,
  disabled = false,
  label,
}: SwitchInlineProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full",
        "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-manor-brass focus:ring-offset-1 focus:ring-offset-transparent",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
      style={
        checked
          ? {
              background:
                "linear-gradient(180deg, rgba(56,102,71,.96) 0%, rgba(24,52,34,.98) 100%)",
              border: "1px solid rgba(123,166,125,.7)",
              boxShadow:
                "inset 0 1px 0 rgba(189,230,177,.35), inset 0 -1px 0 rgba(0,0,0,.45), 0 0 8px -2px rgba(92,138,107,.55)",
            }
          : {
              background:
                "linear-gradient(180deg, rgba(12,26,18,.92) 0%, rgba(6,16,11,.96) 100%)",
              border: "1px solid rgba(212,179,111,.3)",
              boxShadow:
                "inset 0 1px 0 rgba(0,0,0,.45), inset 0 -1px 0 rgba(239,216,154,.08)",
            }
      }
    >
      <span
        className={[
          "pointer-events-none inline-block h-4 w-4 rounded-full transform transition-all duration-200 absolute top-1/2 -translate-y-1/2",
          checked ? "left-[18px]" : "left-[1px]",
        ].join(" ")}
        style={{
          background: checked
            ? "radial-gradient(circle at 30% 30%, #F8E6B0, #D4B36F 55%, #A08850)"
            : "radial-gradient(circle at 30% 30%, #A08850, #6B5A38 55%, #3A3020)",
          boxShadow: checked
            ? "0 0 6px rgba(239,216,154,.7), inset 0 1px 0 rgba(255,255,255,.3), 0 1px 2px rgba(0,0,0,.6)"
            : "inset 0 1px 0 rgba(255,255,255,.12), 0 1px 2px rgba(0,0,0,.6)",
        }}
      />
    </button>
  );
}

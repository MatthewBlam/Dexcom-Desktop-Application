import { twMerge } from "tailwind-merge";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  tabIndex?: number;
}

export function Toggle({ checked, onChange, tabIndex }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        tabIndex={tabIndex}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={twMerge(
          "cursor-pointer relative inline-flex h-6 w-10 items-center rounded-full transition-colors focus-visible:outline-dex-green outline-transparent outline outline-2",
          checked ? "bg-dex-green" : "bg-dex-fg",
        )}>
        <span
          style={{ transition: "translate 0.2s, color 0.2s, background-color 0.2s, opacity 0.2s" }}
          className={twMerge("inline-block h-4 w-4 rounded-full bg-white drop-shadow-ms", checked ? "translate-x-5" : "translate-x-1")}
        />
      </button>
      <span className="text-sm text-dex-text-muted">{checked ? "On" : "Off"}</span>
    </label>
  );
}

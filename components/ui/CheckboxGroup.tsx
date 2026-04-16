import { cn } from "@/lib/utils";

export interface CheckboxOption {
  value: string;
  label: string;
  description?: string;
}

interface CheckboxGroupProps {
  label?: string;
  hint?: string;
  options: CheckboxOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

export function CheckboxGroup({
  label,
  hint,
  options,
  selected,
  onChange,
  disabled = false,
}: CheckboxGroupProps) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-[13px] font-medium text-neutral-700">{label}</span>
      )}

      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors duration-150",
                checked
                  ? "border-primary-300 bg-primary-50"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => !disabled && toggle(opt.value)}
                disabled={disabled}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary-600 focus:ring-primary-500"
              />
              <div className="flex flex-col gap-0.5">
                <span className={cn(
                  "text-[13px] font-medium",
                  checked ? "text-primary-800" : "text-neutral-800"
                )}>
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="text-[12px] text-neutral-500">{opt.description}</span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {hint && <p className="text-[12px] text-neutral-500">{hint}</p>}
    </div>
  );
}

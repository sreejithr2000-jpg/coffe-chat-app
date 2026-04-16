import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-neutral-700"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={inputId}
          className={cn(
            "h-9 w-full appearance-none rounded-lg border border-neutral-200 bg-white",
            "pl-3 pr-8 text-sm text-neutral-900",
            "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_12px_center]",
            "transition-colors duration-150",
            "focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100",
            "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400",
            error && "border-red-400 focus:border-red-500 focus:ring-red-100",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {error ? (
          <p className="text-[12px] text-red-600">{error}</p>
        ) : hint ? (
          <p className="text-[12px] text-neutral-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";

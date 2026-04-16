import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-neutral-700"
          >
            {label}
          </label>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900",
            "placeholder:text-neutral-400",
            "transition-colors duration-150",
            "focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100",
            "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400",
            error && "border-red-400 focus:border-red-500 focus:ring-red-100",
            className
          )}
          {...props}
        />

        {error ? (
          <p className="text-[12px] text-red-600">{error}</p>
        ) : hint ? (
          <p className="text-[12px] text-neutral-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

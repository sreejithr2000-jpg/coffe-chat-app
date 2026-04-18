import { cn } from "@/lib/utils";
import { ALL_TRACKS, TRACK_LABELS } from "@/lib/tracks";
import type { Track } from "@/types";

interface TrackMultiSelectProps {
  label?: string;
  hint?: string;
  error?: string;
  selected: Track[];
  disabledTracks?: Track[]; // tracks that cannot be toggled (e.g. primary)
  max?: number;
  onChange: (tracks: Track[]) => void;
  // "Other" pill support
  showOther?: boolean;
  otherSelected?: boolean;
  onOtherToggle?: () => void;
  otherValue?: string;
  onOtherChange?: (val: string) => void;
}

export function TrackMultiSelect({
  label,
  hint,
  error,
  selected,
  disabledTracks = [],
  max = 2,
  onChange,
  showOther = false,
  otherSelected = false,
  onOtherToggle,
  otherValue = "",
  onOtherChange,
}: TrackMultiSelectProps) {
  function toggle(track: Track) {
    if (disabledTracks.includes(track)) return;

    if (selected.includes(track)) {
      onChange(selected.filter((t) => t !== track));
    } else if (selected.length < max) {
      onChange([...selected, track]);
    }
  }

  const atMax = selected.length >= max;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-[13px] font-medium text-neutral-700">
          {label.endsWith(" *") ? (
            <>{label.slice(0, -2)} <span className="text-red-400 text-[11px]">*</span></>
          ) : label}
        </span>
      )}

      <div className="flex flex-wrap gap-2">
        {ALL_TRACKS.map((track) => {
          const isSelected    = selected.includes(track);
          const isDisabled    = disabledTracks.includes(track);
          const isUnavailable = !isSelected && atMax && !isDisabled;

          return (
            <button
              key={track}
              type="button"
              onClick={() => toggle(track)}
              disabled={isDisabled || isUnavailable}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all duration-150",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1",
                isSelected
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
                (isDisabled || isUnavailable) && "cursor-not-allowed opacity-40"
              )}
            >
              {TRACK_LABELS[track]}
            </button>
          );
        })}

        {/* "Other" pill */}
        {showOther && (
          <button
            type="button"
            onClick={onOtherToggle}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1",
              otherSelected
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-neutral-200 border-dashed bg-white text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50"
            )}
          >
            Other
          </button>
        )}
      </div>

      {/* "Other" free-text input */}
      {showOther && otherSelected && (
        <input
          type="text"
          placeholder="Specify your track (optional)"
          value={otherValue}
          onChange={(e) => onOtherChange?.(e.target.value)}
          maxLength={60}
          className={cn(
            "h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-900",
            "placeholder:text-neutral-400 transition-colors",
            "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          )}
        />
      )}

      {error ? (
        <p className="text-[12px] text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}

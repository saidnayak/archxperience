import React from "react";
import { cn } from "../../lib/utils";

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  valueDisplay?: string | number;
  onChange: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  valueDisplay,
  onChange,
  className,
  disabled = false,
  ...props
}) => {
  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)}>
      {(label || valueDisplay !== undefined) && (
        <div className="flex items-center justify-between text-xs text-text-secondary">
          {label && <span>{label}</span>}
          {valueDisplay !== undefined && <span className="font-mono text-text-muted">{valueDisplay}</span>}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent",
          "focus:outline-none focus-visible:ring-1 focus-visible:ring-accent",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
        {...props}
      />
    </div>
  );
};

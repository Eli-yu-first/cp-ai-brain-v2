import { Slider } from "@/components/ui/slider";

type ControlSliderProps = {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

export function ArbitrageControlSlider({
  label,
  value,
  suffix,
  min,
  max,
  step,
  onChange,
}: ControlSliderProps) {
  const display = Number.isInteger(step) ? value.toFixed(0) : value.toFixed(2);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[12px] text-slate-400 font-medium">{label}</label>
        <span className="font-mono text-slate-300 font-bold bg-white/10 px-2 py-0.5 rounded text-[11px]">
          {display} {suffix}
        </span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={v => onChange(v[0] ?? value)} />
    </div>
  );
}

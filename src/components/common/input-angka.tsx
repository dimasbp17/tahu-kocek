import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Isian angka dengan awalan (Rp) atau akhiran (%)
export default function InputAngka({
  id,
  label,
  value,
  onChange,
  awalan,
  akhiran,
  min,
  max,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  awalan?: string;
  akhiran?: string;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-zinc-600">
        {label}
      </Label>
      <div className="relative">
        {awalan && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
            {awalan}
          </span>
        )}
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`h-10 font-medium tabular-nums ${awalan ? "pl-10" : ""} ${akhiran ? "pr-8" : ""}`}
        />
        {akhiran && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
            {akhiran}
          </span>
        )}
      </div>
    </div>
  );
}

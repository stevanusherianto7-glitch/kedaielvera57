import { Input } from "./ui/input";

interface PriceInputProps {
  value: any;
  onChange: (val: any) => void;
  className?: string;
  placeholder?: string;
}

export function PriceInput({ value, onChange, className, placeholder }: PriceInputProps) {
  return (
    <Input
      type="number"
      value={value === 0 ? "" : value || ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className={className}
      placeholder={placeholder}
    />
  );
}

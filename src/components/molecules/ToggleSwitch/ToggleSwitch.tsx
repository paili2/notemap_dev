// (Switch + Label)
import { useState } from "react";
import { Switch } from "@/components/atoms/Switch/Switch"; // atoms/Switch
import { Label } from "@/components/atoms/Label/Label"; // atoms/Label

interface ToggleSwitchProps {
  id: string;
  label: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function ToggleSwitch({
  id,
  label,
  defaultChecked = false,
  onChange,
}: ToggleSwitchProps) {
  const [checked, setChecked] = useState(defaultChecked);

  const handleChange = (value: boolean) => {
    setChecked(value);
    onChange?.(value);
  };

  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={handleChange} />
      <Label htmlFor={id}>
        {label} {checked ? "ON" : "OFF"}
      </Label>
    </div>
  );
}

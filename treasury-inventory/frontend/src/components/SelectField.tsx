import { forwardRef } from "react";

interface Option {
  value: string | number;
  label: string;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
  placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, error, placeholder, ...rest }, ref) => (
    <div>
      <label className="label">{label}</label>
      <select ref={ref} className="input-field" {...rest}>
        <option value="">{placeholder ?? "Select..."}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-treasury-red mt-1">{error}</p>}
    </div>
  )
);
SelectField.displayName = "SelectField";

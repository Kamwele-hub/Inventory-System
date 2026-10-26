import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
export const SelectField = forwardRef(({ label, options, error, placeholder, ...rest }, ref) => (_jsxs("div", { children: [_jsx("label", { className: "label", children: label }), _jsxs("select", { ref: ref, className: "input-field", ...rest, children: [_jsx("option", { value: "", children: placeholder ?? "Select..." }), options.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] }), error && _jsx("p", { className: "text-xs text-treasury-red mt-1", children: error })] })));
SelectField.displayName = "SelectField";

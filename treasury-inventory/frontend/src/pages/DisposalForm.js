import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { SelectField } from "../components/SelectField";
const METHODS = [
    { value: "sold", label: "Sold" },
    { value: "scrapped", label: "Scrapped" },
    { value: "donated", label: "Donated" },
    { value: "lost_write_off", label: "Lost — written off" },
];
export default function DisposalForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    async function onSubmit(values) {
        await api.post("/disposals/", { ...values, item: id });
        await queryClient.invalidateQueries({ queryKey: ["item", id] });
        await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
        navigate(`/items/${id}`);
    }
    return (_jsxs("div", { className: "p-6 max-w-lg mx-auto", children: [_jsx("h1", { className: "text-xl font-semibold mb-1", children: "Dispose / write off item" }), _jsx("p", { className: "text-sm text-treasury-red-dark bg-treasury-red/10 rounded-md px-3 py-2 mb-5", children: "This is final. The item's status will be set to \"disposed\" and it will drop out of the active register. Confirm this matches your asset disposal committee's approval under the Public Procurement and Asset Disposal Act, 2015 before submitting." }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "card p-6 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Disposal date *" }), _jsx("input", { type: "date", className: "input-field", ...register("disposal_date", { required: true }) }), errors.disposal_date && _jsx("p", { className: "text-xs text-treasury-red mt-1", children: "Required" })] }), _jsx(SelectField, { label: "Method *", options: METHODS, ...register("method", { required: true }), error: errors.method ? "Required" : undefined })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Reason *" }), _jsx("textarea", { className: "input-field", rows: 4, ...register("reason", { required: true }), placeholder: "Committee reference, condition, justification..." }), errors.reason && _jsx("p", { className: "text-xs text-treasury-red mt-1", children: "Required" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Proceeds (KES)" }), _jsx("input", { type: "number", step: "0.01", min: "0", className: "input-field", ...register("proceeds", { valueAsNumber: true, min: 0 }) })] }), _jsx("button", { disabled: isSubmitting, className: "btn-danger", children: isSubmitting ? "Recording..." : "Confirm disposal" })] })] }));
}

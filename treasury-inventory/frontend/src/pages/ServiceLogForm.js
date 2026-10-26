import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
export default function ServiceLogForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    async function onSubmit(values) {
        await api.post("/service-records/", { ...values, item: id });
        await queryClient.invalidateQueries({ queryKey: ["item", id] });
        await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
        navigate(`/items/${id}`);
    }
    return (_jsxs("div", { className: "p-6 max-w-lg mx-auto", children: [_jsx("h1", { className: "text-xl font-semibold mb-1", children: "Log a service event" }), _jsx("p", { className: "text-sm text-treasury-slate mb-5", children: "Record maintenance performed on this item." }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "card p-6 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Service date *" }), _jsx("input", { type: "date", className: "input-field", ...register("service_date", { required: true }) }), errors.service_date && _jsx("p", { className: "text-xs text-treasury-red mt-1", children: "Required" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Next service due" }), _jsx("input", { type: "date", className: "input-field", ...register("next_service_due") })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Performed by *" }), _jsx("input", { className: "input-field", ...register("performed_by", { required: true }), placeholder: "Technician or vendor name" }), errors.performed_by && _jsx("p", { className: "text-xs text-treasury-red mt-1", children: "Required" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Description *" }), _jsx("textarea", { className: "input-field", rows: 4, ...register("description", { required: true }) }), errors.description && _jsx("p", { className: "text-xs text-treasury-red mt-1", children: "Required" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Cost (KES)" }), _jsx("input", { type: "number", step: "0.01", min: "0", className: "input-field", ...register("cost", { valueAsNumber: true, min: 0 }) })] }), _jsx("button", { disabled: isSubmitting, className: "btn-primary", children: isSubmitting ? "Saving..." : "Log service" })] })] }));
}

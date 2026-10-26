import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useLocations } from "../hooks/useReferenceData";
import { SelectField } from "../components/SelectField";
import { CustodianPicker } from "../components/CustodianPicker";
export default function CustodyTransferForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const { data: locations, isLoading: loadingLocations } = useLocations();
    const [custodianId, setCustodianId] = useState(null);
    const [custodianError, setCustodianError] = useState("");
    async function onSubmit(values) {
        if (!custodianId) {
            setCustodianError("Search for and select a custodian.");
            return;
        }
        setCustodianError("");
        await api.post("/custody-records/", {
            item: id,
            custodian: custodianId,
            location: values.location,
            notes: values.notes,
        });
        await queryClient.invalidateQueries({ queryKey: ["item", id] });
        await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
        navigate(`/items/${id}`);
    }
    return (_jsxs("div", { className: "p-6 max-w-lg mx-auto", children: [_jsx("h1", { className: "text-xl font-semibold mb-1", children: "Transfer custody" }), _jsx("p", { className: "text-sm text-treasury-slate mb-5", children: "Record who now holds this item and where it is stationed." }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "card p-6 space-y-4", children: [_jsx(CustodianPicker, { label: "Custodian *", value: custodianId, onChange: setCustodianId, error: custodianError }), _jsx(SelectField, { label: "Location *", options: (locations ?? []).map((l) => ({ value: l.id, label: `${l.name} (${l.department_name})` })), placeholder: loadingLocations ? "Loading..." : "Select location", ...register("location", { required: true, valueAsNumber: true }), error: errors.location ? "Required" : undefined }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Notes" }), _jsx("textarea", { className: "input-field", rows: 3, ...register("notes"), placeholder: "Reason for transfer, condition on handover, etc." })] }), _jsx("button", { disabled: isSubmitting, className: "btn-primary", children: isSubmitting ? "Recording..." : "Record transfer" })] })] }));
}

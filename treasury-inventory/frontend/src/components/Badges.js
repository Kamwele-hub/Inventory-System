import { jsx as _jsx } from "react/jsx-runtime";
const STATUS_STYLES = {
    in_store: "bg-slate-100 text-slate-700",
    issued: "bg-treasury-green-light text-treasury-green-dark",
    under_repair: "bg-amber-100 text-amber-800",
    lost: "bg-treasury-red/10 text-treasury-red-dark",
    disposed: "bg-slate-200 text-slate-500",
};
const CONDITION_STYLES = {
    new: "bg-treasury-green-light text-treasury-green-dark",
    good: "bg-blue-50 text-blue-700",
    fair: "bg-amber-50 text-amber-700",
    poor: "bg-orange-50 text-orange-700",
    unusable: "bg-treasury-red/10 text-treasury-red-dark",
};
export function StatusBadge({ status }) {
    return (_jsx("span", { className: `px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLES[status]}`, children: status.replace("_", " ") }));
}
export function ConditionBadge({ condition }) {
    return (_jsx("span", { className: `px-2 py-0.5 rounded text-xs font-medium capitalize ${CONDITION_STYLES[condition]}`, children: condition }));
}

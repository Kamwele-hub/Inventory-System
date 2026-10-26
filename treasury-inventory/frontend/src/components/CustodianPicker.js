import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
function displayName(u) {
    const full = [u.first_name, u.last_name].filter(Boolean).join(" ");
    return full ? `${full} (${u.username})` : u.username;
}
export function CustodianPicker({ label, value, onChange, error }) {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const containerRef = useRef(null);
    // Debounce so we don't fire a request on every keystroke -- 300ms is
    // enough to catch typing bursts without feeling laggy.
    useEffect(() => {
        const handle = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(handle);
    }, [query]);
    const { data: results, isFetching } = useQuery({
        queryKey: ["user-search", debouncedQuery],
        queryFn: async () => (await api.get("/users/", { params: { search: debouncedQuery } })).data,
        enabled: debouncedQuery.trim().length >= 2,
        staleTime: 30000,
    });
    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    function pick(user) {
        setSelected(user);
        onChange(user.id);
        setQuery(displayName(user));
        setOpen(false);
    }
    function clear() {
        setSelected(null);
        onChange(null);
        setQuery("");
    }
    // If a value is set externally (e.g. form reset) without a matching
    // `selected`, don't try to guess the display name -- just leave the
    // search box empty and let the id stand until the user re-picks.
    void value;
    return (_jsxs("div", { ref: containerRef, className: "relative", children: [_jsx("label", { className: "label", children: label }), _jsxs("div", { className: "relative", children: [_jsx("input", { className: "input-field pr-8", placeholder: "Search staff by name or username...", value: query, onChange: (e) => {
                            setQuery(e.target.value);
                            setSelected(null);
                            onChange(null);
                            setOpen(true);
                        }, onFocus: () => setOpen(true), autoComplete: "off" }), selected && (_jsx("button", { type: "button", onClick: clear, className: "absolute right-2 top-1/2 -translate-y-1/2 text-treasury-slate hover:text-treasury-ink text-xs", "aria-label": "Clear selection", children: "\u2715" }))] }), open && debouncedQuery.trim().length >= 2 && (_jsxs("div", { className: "absolute z-10 mt-1 w-full card max-h-56 overflow-auto", children: [isFetching && _jsx("p", { className: "p-3 text-xs text-treasury-slate", children: "Searching..." }), !isFetching && results?.length === 0 && (_jsxs("p", { className: "p-3 text-xs text-treasury-slate", children: ["No staff found matching \"", debouncedQuery, "\"."] })), results?.map((u) => (_jsx("button", { type: "button", onClick: () => pick(u), className: "w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0", children: displayName(u) }, u.id)))] })), error && _jsx("p", { className: "text-xs text-treasury-red mt-1", children: error })] }));
}

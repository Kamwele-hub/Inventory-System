import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Accurate Kenya flag SVG, sourced from the flag-icons project
 * (https://github.com/lipis/flag-icons, MIT licensed, Copyright (c)
 * Panayiotis Lipiridis) rather than hand-drawn -- this is the correct
 * flag geometry (black/white/red/white/green bands, Maasai shield with
 * crossed spears), not an approximation.
 */
export function KenyaFlagBadge({ className = "h-11 w-11", shape = "circle" }) {
    const wrapperClass = shape === "circle"
        ? `${className} rounded-full overflow-hidden shrink-0 shadow-sm ring-1 ring-black/10`
        : `${className} overflow-hidden shrink-0 shadow-sm ring-1 ring-black/10 rounded`;
    return (_jsx("div", { className: wrapperClass, role: "img", "aria-label": "Flag of Kenya", children: _jsxs("svg", { viewBox: "0 0 640 480", preserveAspectRatio: "xMidYMid slice", className: "w-full h-full block", children: [_jsx("defs", { children: _jsx("path", { id: "ke-a", strokeMiterlimit: "10", d: "m-28.6 47.5 1.8 1 46.7-81c2.7-.6 4.2-3.2 5.7-5.8 1-1.8 5-8.7 6.7-17.7a58 58 0 0 0-11.9 14.7c-1.5 2.6-3 5.2-2.3 7.9z" }) }), _jsx("path", { fill: "#fff", d: "M0 0h640v480H0z" }), _jsx("path", { fill: "#000001", d: "M0 0h640v144H0z" }), _jsx("path", { fill: "#060", d: "M0 336h640v144H0z" }), _jsxs("g", { id: "ke-b", transform: "matrix(3 0 0 3 320 240)", children: [_jsx("use", { xlinkHref: "#ke-a", width: "100%", height: "100%", stroke: "#000" }), _jsx("use", { xlinkHref: "#ke-a", width: "100%", height: "100%", fill: "#fff" })] }), _jsx("use", { xlinkHref: "#ke-b", width: "100%", height: "100%", transform: "matrix(-1 0 0 1 640 0)" }), _jsx("path", { fill: "#b00", d: "M640.5 168H377c-9-24-39-72-57-72s-48 48-57 72H-.2v144H263c9 24 39 72 57 72s48-48 57-72h263.5z" }), _jsx("path", { id: "ke-c", d: "M377 312c9-24 15-48 15-72s-6-48-15-72c-9 24-15 48-15 72s6 48 15 72" }), _jsx("use", { xlinkHref: "#ke-c", width: "100%", height: "100%", transform: "matrix(-1 0 0 1 640 0)" }), _jsxs("g", { fill: "#fff", transform: "matrix(3 0 0 3 320 240)", children: [_jsx("ellipse", { rx: "4", ry: "6" }), _jsx("path", { id: "ke-d", d: "M1 5.8s4 8 4 21-4 21-4 21z" }), _jsx("use", { xlinkHref: "#ke-d", width: "100%", height: "100%", transform: "scale(-1)" }), _jsx("use", { xlinkHref: "#ke-d", width: "100%", height: "100%", transform: "scale(-1 1)" }), _jsx("use", { xlinkHref: "#ke-d", width: "100%", height: "100%", transform: "scale(1 -1)" })] })] }) }));
}

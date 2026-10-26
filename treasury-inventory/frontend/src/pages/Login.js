import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { KenyaFlagBadge } from "../components/KenyaFlagBadge";
export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await login(username, password);
            navigate("/dashboard");
        }
        catch {
            setError("Invalid username or password.");
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsxs("div", { className: "min-h-screen flex items-center justify-center px-4 relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-cover bg-center bg-treasury-ink", style: { backgroundImage: "url(/treasury-building.png)" }, "aria-hidden": true }), _jsx("div", { className: "absolute inset-0 bg-treasury-ink/40", "aria-hidden": true }), _jsxs("div", { className: "w-full max-w-sm relative", children: [_jsxs("div", { className: "flex flex-col items-center mb-6", children: [_jsx(KenyaFlagBadge, { className: "h-16 w-16 mb-3" }), _jsx("h1", { className: "text-white text-lg font-semibold text-center", children: "The National Treasury" }), _jsx("p", { className: "text-white/60 text-sm text-center", children: "Asset Inventory System" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "card p-6 space-y-4", children: [error && (_jsx("p", { className: "text-sm text-treasury-red bg-treasury-red/10 rounded-md px-3 py-2", children: error })), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Username" }), _jsx("input", { className: "input-field", autoComplete: "username", value: username, onChange: (e) => setUsername(e.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Password" }), _jsx("input", { className: "input-field", type: "password", autoComplete: "current-password", value: password, onChange: (e) => setPassword(e.target.value), required: true })] }), _jsx("button", { disabled: submitting, className: "btn-primary w-full justify-center flex", children: submitting ? "Signing in..." : "Sign in" })] }), _jsx("div", { className: "mt-4 flex justify-center", children: _jsxs("div", { className: "h-1 w-24 flex rounded-full overflow-hidden", children: [_jsx("span", { className: "flex-1 bg-white/40" }), _jsx("span", { className: "flex-1 bg-treasury-red" }), _jsx("span", { className: "flex-1 bg-treasury-flag-green" })] }) })] })] }));
}

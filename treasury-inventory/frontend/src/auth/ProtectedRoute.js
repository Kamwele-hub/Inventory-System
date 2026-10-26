import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
export default function ProtectedRoute({ children }) {
    const { user } = useAuth();
    if (!user)
        return _jsx(Navigate, { to: "/login", replace: true });
    return children;
}

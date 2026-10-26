import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
import { api } from "../api/client";
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    });
    async function login(username, password) {
        const { data } = await api.post("/auth/login/", { username, password });
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
    }
    function logout() {
        localStorage.clear();
        setUser(null);
    }
    function hasRole(...roles) {
        if (!user)
            return false;
        return roles.some((r) => user.groups.includes(r));
    }
    return (_jsx(AuthContext.Provider, { value: { user, login, logout, hasRole }, children: children }));
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

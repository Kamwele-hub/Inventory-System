import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./layout/AppLayout";
import Login from "./pages/Login";
import ItemsList from "./pages/ItemsList";
import ItemDetail from "./pages/ItemDetail";
import ItemForm from "./pages/ItemForm";
import CustodyTransferForm from "./pages/CustodyTransferForm";
import ServiceLogForm from "./pages/ServiceLogForm";
import DisposalForm from "./pages/DisposalForm";
import ReportsPage from "./pages/ReportsPage";
import ReferenceDataPage from "./pages/ReferenceDataPage";
import UserManagementPage from "./pages/UserManagementPage";
// Lazy-loaded: these pull in heavier dependencies (recharts, @zxing/browser)
// that most users won't need on first load (e.g. logging into the register
// vs. scanning a tag), so keep them out of the main bundle.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ScanPage = lazy(() => import("./pages/ScanPage"));
function PageFallback() {
    return _jsx("div", { className: "p-6 text-sm text-treasury-slate", children: "Loading..." });
}
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
export default function App() {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(AuthProvider, { children: _jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsxs(Route, { element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, {}) }), children: [_jsx(Route, { path: "/dashboard", element: _jsx(Suspense, { fallback: _jsx(PageFallback, {}), children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/items", element: _jsx(ItemsList, {}) }), _jsx(Route, { path: "/items/new", element: _jsx(ItemForm, {}) }), _jsx(Route, { path: "/items/:id", element: _jsx(ItemDetail, {}) }), _jsx(Route, { path: "/items/:id/transfer", element: _jsx(CustodyTransferForm, {}) }), _jsx(Route, { path: "/items/:id/service", element: _jsx(ServiceLogForm, {}) }), _jsx(Route, { path: "/items/:id/dispose", element: _jsx(DisposalForm, {}) }), _jsx(Route, { path: "/scan", element: _jsx(Suspense, { fallback: _jsx(PageFallback, {}), children: _jsx(ScanPage, {}) }) }), _jsx(Route, { path: "/reports", element: _jsx(ReportsPage, {}) }), _jsx(Route, { path: "/reference-data", element: _jsx(ReferenceDataPage, {}) }), _jsx(Route, { path: "/user-management", element: _jsx(UserManagementPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Suspense, { fallback: _jsx(PageFallback, {}), children: _jsx(Dashboard, {}) }) })] })] }) }) }) }));
}

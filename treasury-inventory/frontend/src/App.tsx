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
import UserManagementPage from

// Lazy-loaded: these pull in heavier dependencies (recharts, @zxing/browser)
// that most users won't need on first load (e.g. logging into the register
// vs. scanning a tag), so keep them out of the main bundle.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ScanPage = lazy(() => import("./pages/ScanPage"));

function PageFallback() {
  return <div className="p-6 text-sm text-treasury-slate">Loading...</div>;
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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Suspense fallback={<PageFallback />}><Dashboard /></Suspense>} />
              <Route path="/items" element={<ItemsList />} />
              <Route path="/items/new" element={<ItemForm />} />
              <Route path="/items/:id" element={<ItemDetail />} />
              <Route path="/items/:id/transfer" element={<CustodyTransferForm />} />
              <Route path="/items/:id/service" element={<ServiceLogForm />} />
              <Route path="/items/:id/dispose" element={<DisposalForm />} />
              <Route path="/scan" element={<Suspense fallback={<PageFallback />}><ScanPage /></Suspense>} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reference-data" element={<ReferenceDataPage />} />
              <Route path="*" element={<Suspense fallback={<PageFallback />}><Dashboard /></Suspense>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

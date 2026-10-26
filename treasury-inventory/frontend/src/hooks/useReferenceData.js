import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
// staleTime keeps this reference data (rarely changes) from being
// refetched on every navigation -- it's already cached server-side by
// Redis too, but this avoids the round trip entirely for 10 minutes.
const REFERENCE_STALE_TIME = 10 * 60 * 1000;
export function useCategories() {
    return useQuery({
        queryKey: ["categories"],
        queryFn: async () => (await api.get("/categories/")).data.results,
        staleTime: REFERENCE_STALE_TIME,
    });
}
export function useVendors() {
    return useQuery({
        queryKey: ["vendors"],
        queryFn: async () => (await api.get("/vendors/")).data.results,
        staleTime: REFERENCE_STALE_TIME,
    });
}
export function useLocations() {
    return useQuery({
        queryKey: ["locations"],
        queryFn: async () => (await api.get("/locations/")).data.results,
        staleTime: REFERENCE_STALE_TIME,
    });
}
export function useDepartments() {
    return useQuery({
        queryKey: ["departments"],
        queryFn: async () => (await api.get("/departments/")).data.results,
        staleTime: REFERENCE_STALE_TIME,
    });
}

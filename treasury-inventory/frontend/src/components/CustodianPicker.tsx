import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

interface UserOption {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface CustodianPickerProps {
  label: string;
  value: number | null;
  onChange: (id: number | null) => void;
  error?: string;
}

function displayName(u: UserOption) {
  const full = [u.first_name, u.last_name].filter(Boolean).join(" ");
  return full ? `${full} (${u.username})` : u.username;
}

export function CustodianPicker({ label, value, onChange, error }: CustodianPickerProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<UserOption | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce so we don't fire a request on every keystroke -- 300ms is
  // enough to catch typing bursts without feeling laggy.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handle);
  }, [query]);

  const { data: results, isFetching } = useQuery({
    queryKey: ["user-search", debouncedQuery],
    queryFn: async () => (await api.get<UserOption[]>("/users/", { params: { search: debouncedQuery } })).data,
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function pick(user: UserOption) {
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

  return (
    <div ref={containerRef} className="relative">
      <label className="label">{label}</label>
      <div className="relative">
        <input
          className="input-field pr-8"
          placeholder="Search staff by name or username..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            onChange(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {selected && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-treasury-slate hover:text-treasury-ink text-xs"
            aria-label="Clear selection"
          >
            ✕
          </button>
        )}
      </div>

      {open && debouncedQuery.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full card max-h-56 overflow-auto">
          {isFetching && <p className="p-3 text-xs text-treasury-slate">Searching...</p>}
          {!isFetching && results?.length === 0 && (
            <p className="p-3 text-xs text-treasury-slate">No staff found matching "{debouncedQuery}".</p>
          )}
          {results?.map((u) => (
            <button
              type="button"
              key={u.id}
              onClick={() => pick(u)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
            >
              {displayName(u)}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-treasury-red mt-1">{error}</p>}
    </div>
  );
}

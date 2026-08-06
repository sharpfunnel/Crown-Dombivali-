"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildHref, type QueryValues } from "@/lib/admin/href";

/**
 * Dropdown + search filters that navigate rather than hold state.
 *
 * Each control pushes a new URL and the Server Component re-queries; there is
 * no client-side copy of the rows to keep in sync. The current values arrive as
 * props instead of being read with `useSearchParams`, which keeps this out of
 * the Suspense requirement that hook carries.
 */

export type SelectFilter = {
  name: string;
  label: string;
  value: string | null;
  options: string[];
};

export function FilterBar({
  pathname,
  params,
  filters,
  search,
}: {
  pathname: string;
  params: QueryValues;
  filters: SelectFilter[];
  /** Omit to hide the free-text box. */
  search?: { name: string; value: string | null; placeholder: string };
}) {
  const router = useRouter();
  const [query, setQuery] = useState(search?.value ?? "");

  // Any filter change returns to page 1: the row that was on page 3 of the
  // unfiltered list is almost never on page 3 of the filtered one.
  const go = (overrides: QueryValues) =>
    router.push(buildHref(pathname, params, { ...overrides, page: null }));

  const active =
    filters.some((f) => f.value) || (search?.value ?? "").length > 0;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <label key={filter.name} className="relative">
          <span className="sr-only">{filter.label}</span>
          <select
            value={filter.value ?? ""}
            onChange={(e) => go({ [filter.name]: e.target.value || null })}
            className="appearance-none border border-white/12 bg-white/[0.03] py-1.5 pr-8 pl-3 text-xs font-medium text-white/70 transition-colors hover:text-white focus:border-accent focus:outline-none"
          >
            <option value="" className="bg-[#111c2e]">
              {filter.label}: all
            </option>
            {filter.options.map((option) => (
              <option key={option} value={option} className="bg-[#111c2e]">
                {option}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[9px] text-white/40">
            ▼
          </span>
        </label>
      ))}

      {search && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go({ [search.name]: query.trim() || null });
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={search.placeholder}
            className="w-56 border border-white/12 bg-white/[0.03] px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
          />
        </form>
      )}

      {active && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            const cleared: QueryValues = {};
            for (const f of filters) cleared[f.name] = null;
            if (search) cleared[search.name] = null;
            go(cleared);
          }}
          className="px-2.5 py-1.5 text-xs font-semibold text-white/45 transition-colors hover:text-white"
        >
          Clear
        </button>
      )}
    </div>
  );
}

import Link from "next/link";
import { buildHref, type QueryValues } from "@/lib/admin/href";

/**
 * Prev/next paging for the long tables. Server-rendered links, so the page
 * number is part of the URL like every other filter.
 */
export function Pagination({
  pathname,
  params,
  page,
  pageSize,
  total,
}: {
  pathname: string;
  params: QueryValues;
  page: number;
  pageSize: number;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-white/45">
      <p>
        {first.toLocaleString("en-IN")}–{last.toLocaleString("en-IN")} of{" "}
        {total.toLocaleString("en-IN")}
      </p>
      <div className="flex items-center gap-2">
        <PageLink
          href={buildHref(pathname, params, { page: page - 1 })}
          disabled={page <= 1}
        >
          ← Prev
        </PageLink>
        <span className="px-1">
          Page {page} of {pages}
        </span>
        <PageLink
          href={buildHref(pathname, params, { page: page + 1 })}
          disabled={page >= pages}
        >
          Next →
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="border border-white/8 px-2.5 py-1 text-white/20">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="border border-white/12 px-2.5 py-1 font-semibold text-white/70 transition-colors hover:border-accent hover:text-white"
    >
      {children}
    </Link>
  );
}

/**
 * Title + description + a right-aligned slot for the page's controls.
 *
 * Every admin page opens with one, so the date-range pills and any per-page
 * filters always land in the same place.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-white/50">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

/** A bordered panel with a heading — the unit every dashboard grid is built from. */
export function Card({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-white/10 bg-[#111c2e] ${className}`}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-white/80 uppercase">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-white/40">{subtitle}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

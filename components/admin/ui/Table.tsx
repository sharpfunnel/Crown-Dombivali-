/**
 * The table primitives. Every data table in the panel is built from these —
 * never a raw `<table>` — so column alignment, header styling, row borders and
 * the empty state stay identical across ten pages.
 */

export function Table({
  children,
  minWidth,
}: {
  children: React.ReactNode;
  /** Set on wide tables; the wrapper scrolls rather than the page. */
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse text-sm"
        style={minWidth ? { minWidth } : undefined}
      >
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>;
}

/**
 * Tailwind scans source for complete class names, so the alignment class has to
 * be looked up rather than interpolated — `text-${align}` compiles to nothing.
 */
const ALIGN = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

export function Th({
  children,
  align = "left",
  className = "",
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      className={`pb-2.5 text-xs font-semibold tracking-wide whitespace-nowrap text-white/40 uppercase ${ALIGN[align]} ${className}`}
    >
      {children}
    </th>
  );
}

export function Tr({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr className={`border-t border-white/5 ${className}`}>{children}</tr>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
  colSpan,
  title,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  colSpan?: number;
  /** Native tooltip — used where a number needs a one-line explanation. */
  title?: string;
}) {
  return (
    <td
      colSpan={colSpan}
      title={title}
      className={`py-3 align-top text-white/80 ${ALIGN[align]} ${className}`}
    >
      {children}
    </td>
  );
}

export function EmptyState({
  children,
  colSpan,
}: {
  children: React.ReactNode;
  /** Provided when the empty state is a row inside an existing table. */
  colSpan?: number;
}) {
  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} className="py-10 text-center text-sm text-white/40">
          {children}
        </td>
      </tr>
    );
  }
  return (
    <p className="border border-dashed border-white/10 px-4 py-12 text-center text-sm text-white/40">
      {children}
    </p>
  );
}

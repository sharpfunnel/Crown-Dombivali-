import type { IconName } from "@/lib/project";

const paths: Record<IconName, React.ReactNode> = {
  township: (
    <>
      <path d="M3 21h18M5 21V9l5-4 5 4v12M9 21v-4h2v4" />
      <path d="M15 21V12h4v9" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  metro: (
    <>
      <rect x="5" y="3" width="14" height="13" rx="3" />
      <path d="M5 10h14M8.5 20l-2 2M15.5 20l2 2M8 16h.01M16 16h.01" />
    </>
  ),
  clubhouse: (
    <>
      <path d="M3 21h18M4 21V10l8-5 8 5v11" />
      <path d="M9 21v-5h6v5M9 12h6" />
    </>
  ),
  temple: (
    <>
      <path d="M12 2 4 8h16L12 2Z" />
      <path d="M6 8v13M18 8v13M3 21h18" />
      <path d="M10 21v-5a2 2 0 1 1 4 0v5" />
    </>
  ),
  garden: (
    <>
      <path d="M12 21V11" />
      <path d="M12 11c0-3 2-5 5-5 0 3-2 5-5 5ZM12 11c0-3-2-5-5-5 0 3 2 5 5 5Z" />
      <path d="M5 21h14" />
    </>
  ),
  open: (
    <>
      <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  pool: (
    <>
      <path d="M2 17c1.6 0 1.6 1.4 3.2 1.4S6.8 17 8.4 17s1.6 1.4 3.2 1.4S13.2 17 14.8 17s1.6 1.4 3.2 1.4S19.6 17 22 17" />
      <path d="M7 15V5a2 2 0 0 1 4 0M13 15V5a2 2 0 0 1 4 0M7 9h4M13 9h4" />
    </>
  ),
  gym: (
    <>
      <path d="M4 9v6M20 9v6M7 6v12M17 6v12M7 12h10" />
    </>
  ),
  hall: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M8 12h8M8 16h5" />
    </>
  ),
  security: (
    <>
      <path d="M12 3 5 6v6c0 4.4 3 8 7 9 4-1 7-4.6 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  family: (
    <>
      <circle cx="8" cy="8" r="2.6" />
      <circle cx="16.5" cy="9.5" r="2" />
      <path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h1A4.5 4.5 0 0 1 13 18.5V20M14.5 20v-1a3.5 3.5 0 0 1 3.5-3.5h.5A2.5 2.5 0 0 1 21 18v2" />
    </>
  ),
  hospital: (
    <>
      <rect x="4" y="4" width="16" height="17" rx="2" />
      <path d="M12 8v7M8.5 11.5h7" />
    </>
  ),
  train: (
    <>
      <path d="M4 15V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z" />
      <path d="M4 10h16M8 21l-2 2M16 21l2 2M8.5 14h.01M15.5 14h.01" />
    </>
  ),
};

export function Icon({
  name,
  className = "h-6 w-6",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

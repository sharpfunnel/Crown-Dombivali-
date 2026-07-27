import {
  getClickPoints,
  getLeads,
  getOverview,
  getRecentSessions,
  getRecordedSessionIds,
  getScrollBuckets,
  getSectionMarkers,
  getSectionReach,
  getTopCtas,
  getTrafficSources,
} from "@/lib/analytics";
import { Dashboard } from "@/components/admin/Dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // All queries run in parallel — the slowest one, not the sum, sets the time.
  const [
    overview,
    sources,
    leads,
    sessions,
    ctas,
    sectionReach,
    scroll,
    clickPoints,
    sectionMarkers,
    recordedIds,
  ] = await Promise.all([
    getOverview(),
    getTrafficSources(),
    getLeads(100),
    getRecentSessions(50),
    getTopCtas(),
    getSectionReach(),
    getScrollBuckets(),
    getClickPoints(2500),
    getSectionMarkers(),
    getRecordedSessionIds(),
  ]);

  return (
    <Dashboard
      overview={overview}
      sources={sources}
      leads={leads}
      sessions={sessions}
      ctas={ctas}
      sectionReach={sectionReach}
      scroll={scroll}
      clickPoints={clickPoints}
      sectionMarkers={sectionMarkers}
      recordedIds={recordedIds}
    />
  );
}

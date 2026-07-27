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
  ] = await Promise.all([
    getOverview(),
    getTrafficSources(),
    getLeads(100),
    getRecentSessions(50),
    getTopCtas(),
    getSectionReach(),
    getScrollBuckets(),
    getClickPoints(4000),
    getSectionMarkers(),
  ]);

  const recordedIds = [
    ...(await getRecordedSessionIds(sessions.map((s) => s.id))),
  ];

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

import {
  getLeads,
  getOverview,
  getRecentSessions,
  getScrollBuckets,
  getSectionReach,
  getTopCtas,
  getTrafficSources,
} from "@/lib/analytics";
import { Dashboard } from "@/components/admin/Dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [overview, sources, leads, sessions, ctas, sectionReach, scroll] =
    await Promise.all([
      getOverview(),
      getTrafficSources(),
      getLeads(100),
      getRecentSessions(50),
      getTopCtas(),
      getSectionReach(),
      getScrollBuckets(),
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
    />
  );
}

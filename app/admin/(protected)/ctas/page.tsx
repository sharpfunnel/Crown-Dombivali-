import { getCtaStats } from "@/lib/admin/behaviour";
import { parseDays, rangeLabel } from "@/lib/admin/range";
import { fmt, pct } from "@/lib/admin/format";
import { Card, PageHeader } from "@/components/admin/ui/PageHeader";
import { DateRangeSelect } from "@/components/admin/ui/DateRangeSelect";
import {
  EmptyState,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/admin/ui/Table";

export const dynamic = "force-dynamic";

export default async function CtasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const days = parseDays(params.days);
  const ctas = await getCtaStats(days);

  return (
    <>
      <PageHeader
        title="CTAs"
        description={`${rangeLabel(days)}. Views and hovers count once per session; clicks count every time.`}
        actions={<DateRangeSelect pathname="/admin/ctas" params={params} days={days} />}
      />

      <Card title="Call-to-action performance">
        {ctas.length === 0 ? (
          <EmptyState>
            No CTA activity recorded yet. Tag any element with{" "}
            <code className="text-white/60">data-cta=&quot;name&quot;</code> to
            name it here; untagged links and buttons are labelled automatically.
          </EmptyState>
        ) : (
          <Table minWidth={640}>
            <Thead>
              <Tr className="border-t-0">
                <Th>CTA</Th>
                <Th align="right">Seen by</Th>
                <Th align="right">Hovered by</Th>
                <Th align="right">Clicks</Th>
                <Th align="right">Clicked by</Th>
                <Th align="right">CTR</Th>
              </Tr>
            </Thead>
            <tbody>
              {ctas.map((cta) => (
                <Tr key={cta.label}>
                  <Td className="text-white">{cta.label}</Td>
                  <Td align="right">{fmt(cta.viewed)}</Td>
                  <Td align="right" className="text-white/55">
                    {fmt(cta.hovered)}
                  </Td>
                  <Td align="right" className="font-semibold text-white">
                    {fmt(cta.clicked)}
                  </Td>
                  <Td align="right" className="text-white/55">
                    {fmt(cta.sessions)}
                  </Td>
                  <Td align="right" className={cta.ctr === null ? "text-white/30" : "text-accent"}>
                    {pct(cta.ctr)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}

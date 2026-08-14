import { getErrors } from "@/lib/admin/behaviour";
import { parseDays, rangeLabel } from "@/lib/admin/range";
import { ago, fmt } from "@/lib/admin/format";
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

const KIND_LABELS: Record<string, string> = {
  js: "JS error",
  promise: "Unhandled rejection",
  image: "Broken image",
  lead_submit: "Lead submit failed",
};

export default async function ErrorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const days = parseDays(params.days);
  const errors = await getErrors(days);

  const affected = errors.reduce((sum, e) => sum + e.sessions, 0);

  return (
    <>
      <PageHeader
        title="Errors"
        description={`${rangeLabel(days)}. Grouped by message — one broken image is one row, not four hundred.`}
        actions={<DateRangeSelect pathname="/admin/errors" params={params} days={days} />}
      />

      <Card
        title="Client-side failures"
        subtitle={
          errors.length > 0
            ? `${fmt(errors.length)} distinct problem${errors.length === 1 ? "" : "s"} across ${fmt(affected)} session-hits`
            : undefined
        }
      >
        {errors.length === 0 ? (
          <EmptyState>
            No client-side errors recorded in this range. That is the result you
            want.
          </EmptyState>
        ) : (
          <Table minWidth={760}>
            <Thead>
              <Tr className="border-t-0">
                <Th>Message</Th>
                <Th>Kind</Th>
                <Th>Where</Th>
                <Th align="right">Hits</Th>
                <Th align="right">Sessions</Th>
                <Th align="right">Last seen</Th>
              </Tr>
            </Thead>
            <tbody>
              {errors.map((error) => (
                <Tr key={`${error.kind}:${error.message}`}>
                  <Td className="max-w-md">
                    <span className="font-mono text-xs break-words text-white/85">
                      {error.message}
                    </span>
                    {error.source && (
                      <div className="mt-0.5 truncate text-[11px] text-white/30">
                        {error.source}
                      </div>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-white/55">
                    {KIND_LABELS[error.kind] ?? error.kind}
                  </Td>
                  <Td className="text-white/55">{error.path ?? "—"}</Td>
                  <Td align="right" className="font-semibold text-white">
                    {fmt(error.count)}
                  </Td>
                  <Td align="right" className="text-white/55">
                    {fmt(error.sessions)}
                  </Td>
                  <Td align="right" className="whitespace-nowrap text-white/40">
                    {ago(error.lastSeen)}
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

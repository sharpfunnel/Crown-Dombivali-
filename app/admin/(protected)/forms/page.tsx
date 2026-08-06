import { getFormFieldStats, getFormStats } from "@/lib/admin/behaviour";
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

export default async function FormsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const days = parseDays(params.days);
  const [forms, fields] = await Promise.all([
    getFormStats(days),
    getFormFieldStats(days),
  ]);

  return (
    <>
      <PageHeader
        title="Forms"
        description={`${rangeLabel(days)}. "Started" is the first focus in a form; "submitted" counts only submissions that actually saved.`}
        actions={<DateRangeSelect pathname="/admin/forms" params={params} days={days} />}
      />

      <div className="space-y-6">
        <Card title="Form funnel">
          {forms.length === 0 ? (
            <EmptyState>
              No form activity recorded yet. Add{" "}
              <code className="text-white/60">data-form-id</code> to a form to
              name it here.
            </EmptyState>
          ) : (
            <Table minWidth={680}>
              <Thead>
                <Tr className="border-t-0">
                  <Th>Form</Th>
                  <Th align="right">Seen by</Th>
                  <Th align="right">Started</Th>
                  <Th align="right">Submitted</Th>
                  <Th align="right">Abandoned</Th>
                  <Th align="right">Errors</Th>
                  <Th align="right">Completion</Th>
                </Tr>
              </Thead>
              <tbody>
                {forms.map((form) => (
                  <Tr key={form.formId}>
                    <Td className="text-white">{form.formId}</Td>
                    <Td align="right">{fmt(form.viewed)}</Td>
                    <Td align="right">{fmt(form.started)}</Td>
                    <Td align="right" className="font-semibold text-white">
                      {fmt(form.submitted)}
                    </Td>
                    <Td align="right" className="text-red-300/70">
                      {fmt(form.abandoned)}
                    </Td>
                    <Td align="right" className="text-amber-300/70">
                      {fmt(form.validationErrors)}
                    </Td>
                    <Td
                      align="right"
                      className={
                        form.completionRate === null ? "text-white/30" : "text-accent"
                      }
                    >
                      {pct(form.completionRate)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card
          title="Field-level drop-off"
          subtitle="Where people stop, and which fields reject their input"
        >
          {fields.length === 0 ? (
            <EmptyState>No field-level activity recorded yet.</EmptyState>
          ) : (
            <Table minWidth={520}>
              <Thead>
                <Tr className="border-t-0">
                  <Th>Form</Th>
                  <Th>Field</Th>
                  <Th align="right">Last field before leaving</Th>
                  <Th align="right">Validation errors</Th>
                </Tr>
              </Thead>
              <tbody>
                {fields.map((field) => (
                  <Tr key={`${field.formId}:${field.field}`}>
                    <Td className="text-white/55">{field.formId}</Td>
                    <Td className="font-mono text-xs text-white">{field.field}</Td>
                    <Td align="right" className="font-semibold text-red-300/80">
                      {fmt(field.drops)}
                    </Td>
                    <Td align="right" className="text-amber-300/70">
                      {fmt(field.errors)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}

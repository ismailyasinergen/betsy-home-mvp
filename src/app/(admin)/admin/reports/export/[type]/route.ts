import { adminReportExports, buildAdminReportCsv, type AdminReportType } from "@/lib/admin-report-exports";

export const dynamic = "force-dynamic";

function isAdminReportType(value: string): value is AdminReportType {
  return adminReportExports.some((report) => report.type === value);
}

export async function GET(_request: Request, context: any) {
  const params = await Promise.resolve(context.params);
  const type = String(params?.type ?? "");

  if (!isAdminReportType(type)) {
    return new Response("Unknown report type.", { status: 404 });
  }

  const csv = await buildAdminReportCsv(type);
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="betsy-home-${type}-${today}.csv"`,
      "Cache-Control": "no-store"
    }
  });
}

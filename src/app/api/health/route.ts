import { NextResponse } from "next/server";
import { getAppHealthReport } from "@/lib/app-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await getAppHealthReport();

  return NextResponse.json(report, {
    status: report.overallStatus === "error" ? 503 : 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

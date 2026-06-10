import { NextResponse } from "next/server";
import { getDeploymentReadinessReport } from "@/lib/deployment-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = getDeploymentReadinessReport();

  return NextResponse.json(report, {
    status: report.overallStatus === "error" ? 503 : 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

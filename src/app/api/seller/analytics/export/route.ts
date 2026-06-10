import { requireRole } from "@/lib/auth";
import { getSellerAnalyticsData, sellerAnalyticsCsvRows, toCsv } from "@/lib/seller-analytics";

export async function GET() {
  const user = await requireRole(["SELLER", "ADMIN"] as any, "/seller/analytics");
  const data = await getSellerAnalyticsData(user.id);
  const csv = toCsv(sellerAnalyticsCsvRows(data));
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="betsy-home-seller-analytics-${date}.csv"`,
    },
  });
}

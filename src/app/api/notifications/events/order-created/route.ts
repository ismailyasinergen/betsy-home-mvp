import { NextResponse } from "next/server";
import { notifyOrderCreated } from "@/lib/notification-events";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = body?.orderId;

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    const result = await notifyOrderCreated(orderId);
    return NextResponse.json(result, { status: result.ok ? 200 : 404 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

import { NextRequest } from "next/server";
import { startGoogleLogin } from "@/lib/google-oauth";

export function GET(request: NextRequest) {
  return startGoogleLogin(request);
}

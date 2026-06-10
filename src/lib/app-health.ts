import { prisma } from "@/lib/prisma";
import { summarizeDbError, withDbRetry } from "@/lib/db-safe";

type HealthStatus = "ok" | "warning" | "error";

type HealthCheck = {
  name: string;
  status: HealthStatus;
  message: string;
  detail?: string;
};

function sanitizeUrl(rawUrl: string | undefined) {
  if (!rawUrl) {
    return {
      protocol: null,
      username: null,
      host: null,
      pathname: null,
      params: {},
      configured: false,
    };
  }

  try {
    const url = new URL(rawUrl);
    const params: Record<string, string> = {};

    for (const [key, value] of url.searchParams.entries()) {
      params[key] = value;
    }

    return {
      protocol: url.protocol,
      username: url.username,
      host: url.host,
      pathname: url.pathname,
      params,
      configured: true,
    };
  } catch {
    return {
      protocol: null,
      username: null,
      host: null,
      pathname: null,
      params: {},
      configured: false,
    };
  }
}

function envCheck(name: string, required = false): HealthCheck {
  const exists = Boolean(process.env[name]);

  if (exists) {
    return {
      name,
      status: "ok",
      message: "Configured",
    };
  }

  return {
    name,
    status: required ? "error" : "warning",
    message: required ? "Missing required environment variable" : "Not configured",
  };
}

function overallStatus(checks: HealthCheck[]): HealthStatus {
  if (checks.some((check) => check.status === "error")) return "error";
  if (checks.some((check) => check.status === "warning")) return "warning";
  return "ok";
}

export async function getAppHealthReport() {
  const startedAt = Date.now();
  const databaseUrl = sanitizeUrl(process.env.DATABASE_URL);

  const checks: HealthCheck[] = [
    envCheck("DATABASE_URL", true),
    envCheck("NEXTAUTH_SECRET", false),
    envCheck("NEXTAUTH_URL", false),
    envCheck("STRIPE_SECRET_KEY", false),
    envCheck("STRIPE_WEBHOOK_SECRET", false),
  ];

  try {
    await withDbRetry(
      async () => {
        await prisma.$queryRaw`SELECT 1`;
      },
      {
        attempts: 3,
        delayMs: 1000,
        label: "health database ping",
      }
    );

    checks.push({
      name: "Database connection",
      status: "ok",
      message: "Database ping succeeded",
    });
  } catch (error) {
    checks.push({
      name: "Database connection",
      status: "error",
      message: "Database ping failed",
      detail: summarizeDbError(error),
    });
  }

  const poolerHint =
    databaseUrl.host?.includes("pooler.supabase.com") &&
    databaseUrl.params["pgbouncer"] !== "true"
      ? "Supabase pooler URL detected without pgbouncer=true."
      : null;

  if (poolerHint) {
    checks.push({
      name: "Supabase pooler settings",
      status: "warning",
      message: poolerHint,
    });
  } else if (databaseUrl.host?.includes("pooler.supabase.com")) {
    checks.push({
      name: "Supabase pooler settings",
      status: "ok",
      message: "Pooler URL includes pgbouncer=true",
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    responseMs: Date.now() - startedAt,
    overallStatus: overallStatus(checks),
    database: databaseUrl,
    checks,
  };
}

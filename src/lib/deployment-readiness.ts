type ReadinessStatus = "ok" | "warning" | "error";

type ReadinessItem = {
  name: string;
  status: ReadinessStatus;
  message: string;
  detail?: string;
};

function mask(value: string | undefined) {
  if (!value) return "not configured";
  if (value.length <= 8) return "configured";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function envItem(name: string, required = true): ReadinessItem {
  const value = process.env[name];

  if (value) {
    return {
      name,
      status: "ok",
      message: "Configured",
      detail: mask(value),
    };
  }

  return {
    name,
    status: required ? "error" : "warning",
    message: required ? "Missing required environment variable" : "Not configured",
  };
}

function parseDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return null;

  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function databaseItems(): ReadinessItem[] {
  const url = parseDatabaseUrl();

  if (!url) {
    return [
      {
        name: "DATABASE_URL format",
        status: "error",
        message: "DATABASE_URL is missing or invalid",
      },
    ];
  }

  const items: ReadinessItem[] = [
    {
      name: "DATABASE_URL format",
      status: "ok",
      message: "DATABASE_URL parsed successfully",
      detail: `${url.protocol}//${url.username}@${url.host}${url.pathname}`,
    },
  ];

  const isPooler = url.host.includes("pooler.supabase.com");
  const pgbouncer = url.searchParams.get("pgbouncer");
  const sslmode = url.searchParams.get("sslmode");
  const connectionLimit = Number(url.searchParams.get("connection_limit") ?? "0");
  const poolTimeout = Number(url.searchParams.get("pool_timeout") ?? "0");

  if (isPooler && pgbouncer !== "true") {
    items.push({
      name: "Supabase pooler pgbouncer",
      status: "warning",
      message: "Pooler URL should include pgbouncer=true",
    });
  } else if (isPooler) {
    items.push({
      name: "Supabase pooler pgbouncer",
      status: "ok",
      message: "Pooler URL includes pgbouncer=true",
    });
  }

  if (sslmode !== "require") {
    items.push({
      name: "Database SSL",
      status: "warning",
      message: "DATABASE_URL should include sslmode=require",
    });
  } else {
    items.push({
      name: "Database SSL",
      status: "ok",
      message: "sslmode=require",
    });
  }

  if (connectionLimit && connectionLimit < 3) {
    items.push({
      name: "Connection limit",
      status: "warning",
      message: "connection_limit is low for seller/admin dashboards",
      detail: String(connectionLimit),
    });
  } else if (connectionLimit) {
    items.push({
      name: "Connection limit",
      status: "ok",
      message: "connection_limit is set",
      detail: String(connectionLimit),
    });
  } else {
    items.push({
      name: "Connection limit",
      status: "warning",
      message: "connection_limit is not set",
    });
  }

  if (poolTimeout && poolTimeout < 30) {
    items.push({
      name: "Pool timeout",
      status: "warning",
      message: "pool_timeout should be at least 30 seconds for local/Supabase stability",
      detail: String(poolTimeout),
    });
  } else if (poolTimeout) {
    items.push({
      name: "Pool timeout",
      status: "ok",
      message: "pool_timeout is set",
      detail: String(poolTimeout),
    });
  } else {
    items.push({
      name: "Pool timeout",
      status: "warning",
      message: "pool_timeout is not set",
    });
  }

  return items;
}

function safetyItems(): ReadinessItem[] {
  const demoSellerFallbacks = process.env.DEMO_SELLER_FALLBACKS_ENABLED;
  const demoAccounts = process.env.DEMO_ACCOUNTS_ENABLED;
  const isProduction = process.env.NODE_ENV === "production";

  return [
    {
      name: "Demo seller fallbacks",
      status:
        demoSellerFallbacks === "false"
          ? "ok"
          : isProduction
            ? "error"
            : "warning",
      message:
        demoSellerFallbacks === "false"
          ? "Disabled"
          : "Set DEMO_SELLER_FALLBACKS_ENABLED=false before production",
      detail: demoSellerFallbacks ?? "not configured",
    },
    {
      name: "Demo accounts",
      status:
        demoAccounts === "false"
          ? "ok"
          : isProduction
            ? "warning"
            : "warning",
      message:
        demoAccounts === "false"
          ? "Disabled"
          : "Set DEMO_ACCOUNTS_ENABLED=false before public launch",
      detail: demoAccounts ?? "not configured",
    },
  ];
}

function overall(items: ReadinessItem[]): ReadinessStatus {
  if (items.some((item) => item.status === "error")) return "error";
  if (items.some((item) => item.status === "warning")) return "warning";
  return "ok";
}

export function getDeploymentReadinessReport() {
  const items: ReadinessItem[] = [
    envItem("DATABASE_URL", true),
    envItem("NEXTAUTH_URL", true),
    envItem("NEXTAUTH_SECRET", true),
    envItem("STRIPE_SECRET_KEY", true),
    envItem("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", true),
    envItem("STRIPE_WEBHOOK_SECRET", true),
    envItem("NEXT_PUBLIC_APP_URL", false),
    ...databaseItems(),
    ...safetyItems(),
  ];

  return {
    generatedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
    overallStatus: overall(items),
    items,
  };
}

function mask(value) {
  if (!value) return "not configured";
  if (value.length <= 8) return "configured";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function checkEnv(name, required = true) {
  const value = process.env[name];
  return {
    name,
    status: value ? "ok" : required ? "error" : "warning",
    message: value ? "Configured" : required ? "Missing required env var" : "Not configured",
    detail: mask(value),
  };
}

function parseDatabaseUrl() {
  if (!process.env.DATABASE_URL) return null;
  try {
    return new URL(process.env.DATABASE_URL);
  } catch {
    return null;
  }
}

const checks = [
  checkEnv("DATABASE_URL", true),
  checkEnv("NEXTAUTH_URL", true),
  checkEnv("NEXTAUTH_SECRET", true),
  checkEnv("STRIPE_SECRET_KEY", true),
  checkEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", true),
  checkEnv("STRIPE_WEBHOOK_SECRET", true),
  checkEnv("NEXT_PUBLIC_APP_URL", false),
];

const url = parseDatabaseUrl();
if (url) {
  checks.push({
    name: "DATABASE_URL host",
    status: "ok",
    message: `${url.username}@${url.host}${url.pathname}`,
  });

  checks.push({
    name: "pgbouncer",
    status: url.searchParams.get("pgbouncer") === "true" ? "ok" : "warning",
    message: url.searchParams.get("pgbouncer") === "true"
      ? "pgbouncer=true"
      : "Pooler URLs should include pgbouncer=true",
  });

  checks.push({
    name: "sslmode",
    status: url.searchParams.get("sslmode") === "require" ? "ok" : "warning",
    message: url.searchParams.get("sslmode") === "require"
      ? "sslmode=require"
      : "DATABASE_URL should include sslmode=require",
  });
} else {
  checks.push({
    name: "DATABASE_URL parse",
    status: "error",
    message: "DATABASE_URL missing or invalid",
  });
}

checks.push({
  name: "Demo seller fallbacks",
  status: process.env.DEMO_SELLER_FALLBACKS_ENABLED === "false" ? "ok" : "warning",
  message: "Set DEMO_SELLER_FALLBACKS_ENABLED=false before production",
  detail: process.env.DEMO_SELLER_FALLBACKS_ENABLED ?? "not configured",
});

const errors = checks.filter((check) => check.status === "error").length;
const warnings = checks.filter((check) => check.status === "warning").length;

console.log("Betsy Home production readiness");
console.log("--------------------------------");
for (const check of checks) {
  console.log(`[${check.status.toUpperCase()}] ${check.name}: ${check.message}`);
  if (check.detail) console.log(`  ${check.detail}`);
}

console.log("--------------------------------");
console.log(`Errors: ${errors}`);
console.log(`Warnings: ${warnings}`);

if (errors) {
  process.exitCode = 1;
}

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function sanitizeDatabaseUrl(rawUrl) {
  if (!rawUrl) return { configured: false };

  try {
    const url = new URL(rawUrl);
    const params = {};
    for (const [key, value] of url.searchParams.entries()) {
      params[key] = value;
    }

    return {
      configured: true,
      protocol: url.protocol,
      username: url.username,
      host: url.host,
      database: url.pathname,
      params,
    };
  } catch (error) {
    return {
      configured: false,
      error: error.message,
    };
  }
}

async function main() {
  console.log("Betsy Home database health check");
  console.log("--------------------------------");
  console.log(sanitizeDatabaseUrl(process.env.DATABASE_URL));

  const started = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  console.log(`Database ping succeeded in ${Date.now() - started}ms`);
}

main()
  .catch((error) => {
    console.error("Database health check failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

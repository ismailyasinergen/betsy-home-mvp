import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_BYTES = 32;
const TOKEN_TTL_HOURS = 24;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildVerificationPath(token: string) {
  return `/verify-email?token=${encodeURIComponent(token)}`;
}

export async function createEmailVerificationToken(userId: string) {
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.emailVerificationToken.updateMany({
    where: {
      userId,
      usedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    data: {
      usedAt: new Date()
    }
  });

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  return {
    token,
    verificationPath: buildVerificationPath(token),
    expiresAt
  };
}

export async function verifyEmailToken(rawToken: string) {
  const token = rawToken.trim();

  if (!token || token.length < 32) {
    return { ok: false as const, reason: "invalid-token" as const };
  }

  const tokenHash = hashToken(token);

  const record = await prisma.emailVerificationToken.findUnique({
    where: {
      tokenHash
    },
    include: {
      user: true
    }
  });

  if (!record) {
    return { ok: false as const, reason: "invalid-token" as const };
  }

  if (record.usedAt) {
    return { ok: false as const, reason: "used-token" as const };
  }

  if (record.expiresAt < new Date()) {
    return { ok: false as const, reason: "expired-token" as const, email: record.user.email };
  }

  const user = await prisma.user.update({
    where: {
      id: record.userId
    },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationTokens: {
        update: {
          where: {
            id: record.id
          },
          data: {
            usedAt: new Date()
          }
        }
      }
    }
  });

  return { ok: true as const, user };
}

export async function createVerificationTokenForEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase()
    }
  });

  if (!user || user.emailVerifiedAt) {
    return null;
  }

  return createEmailVerificationToken(user.id);
}

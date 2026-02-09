import { PrismaClient } from "@prisma/client";

/**
 * Next.js에서 Prisma 클라이언트를 한 번만 생성하도록 싱글톤 사용.
 * 개발 시 hot reload 시 여러 인스턴스가 생기는 것을 방지.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

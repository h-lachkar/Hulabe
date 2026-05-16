/**
 * After renaming AdminUser → User, the underlying primary key + unique +
 * foreign-key constraints still carry the old "AdminUser_" prefix. Postgres
 * keeps them functional but Prisma's introspection wants them to match the
 * new table name. Rename them so `prisma db push` is happy.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function exec(sql: string, label: string) {
  process.stdout.write(`  → ${label}… `);
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log("ok");
  } catch (e) {
    console.log(`SKIP (${(e as Error).message.split("\n")[0]})`);
  }
}

async function main() {
  console.log("Renaming AdminUser_* constraints to User_*");

  // PK
  await exec(
    `ALTER TABLE "User" RENAME CONSTRAINT "AdminUser_pkey" TO "User_pkey"`,
    "PK",
  );
  // Unique
  await exec(
    `ALTER INDEX "AdminUser_email_key" RENAME TO "User_email_key"`,
    "email UNIQUE",
  );
  // Indexes
  await exec(
    `ALTER INDEX "AdminUser_isActive_idx" RENAME TO "User_isActive_idx"`,
    "isActive index",
  );
  await exec(
    `ALTER INDEX "AdminUser_role_idx" RENAME TO "User_role_idx"`,
    "role index",
  );
  // Self-FK
  await exec(
    `ALTER TABLE "User" RENAME CONSTRAINT "AdminUser_invitedById_fkey" TO "User_invitedById_fkey"`,
    "invitedBy FK",
  );

  console.log("\n✓ Constraints renamed.");
}

main().catch(console.error).finally(() => prisma.$disconnect());

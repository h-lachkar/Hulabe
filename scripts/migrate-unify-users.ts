/**
 * Migrate from AdminUser + ClientUser (+ ProjectClient + ProjectAdmin) to a
 * unified User table + ProjectMember join table.
 *
 * - Renames AdminUser to User (preserves all existing admin rows incl. OWNER)
 * - Extends the AdminRole enum with CLIENT and renames it to UserRole
 * - Adds company/phone/notes columns (nullable) so CLIENT rows can fit
 * - Drops ClientUser, ProjectClient, ProjectAdmin (all empty — they were just
 *   added in the previous schema bump and never populated)
 * - Creates ProjectMember (projectId, userId, addedById, addedAt)
 *
 * Run with:  pnpm exec tsx scripts/migrate-unify-users.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function exec(sql: string, label: string) {
  process.stdout.write(`  → ${label}… `);
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log("ok");
  } catch (e) {
    console.log("ERR");
    throw e;
  }
}

async function main() {
  console.log("Hulabe user-unification migration");
  console.log("=================================");

  // 1. Drop the unused tables added in the previous schema bump.
  //    These were added but never populated.
  await exec(
    `DROP TABLE IF EXISTS "ProjectClient" CASCADE`,
    "drop ProjectClient",
  );
  await exec(
    `DROP TABLE IF EXISTS "ProjectAdmin" CASCADE`,
    "drop ProjectAdmin",
  );
  await exec(`DROP TABLE IF EXISTS "ClientUser" CASCADE`, "drop ClientUser");

  // 2. Extend the AdminRole enum to include CLIENT (Postgres requires this in
  //    its own transaction; ALTER TYPE ... ADD VALUE cannot run inside a tx).
  //    We then rename the enum to UserRole.
  await exec(
    `ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'CLIENT'`,
    "add CLIENT to AdminRole",
  );
  await exec(
    `ALTER TYPE "AdminRole" RENAME TO "UserRole"`,
    "rename AdminRole → UserRole",
  );

  // 3. Rename AdminUser to User (preserves all rows + OWNER seed)
  await exec(`ALTER TABLE "AdminUser" RENAME TO "User"`, "rename AdminUser → User");

  // 4. Add CLIENT-friendly columns (nullable so existing OWNER rows are fine)
  await exec(
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "company" TEXT`,
    "add User.company",
  );
  await exec(
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT`,
    "add User.phone",
  );
  await exec(
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notes" TEXT`,
    "add User.notes",
  );

  // 5. Create ProjectMember join table (replaces ProjectClient + ProjectAdmin)
  await exec(
    `CREATE TABLE IF NOT EXISTS "ProjectMember" (
       "projectId" TEXT NOT NULL,
       "userId"    TEXT NOT NULL,
       "addedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "addedById" TEXT,
       PRIMARY KEY ("projectId", "userId"),
       CONSTRAINT "ProjectMember_projectId_fkey"
         FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
       CONSTRAINT "ProjectMember_userId_fkey"
         FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
     )`,
    "create ProjectMember",
  );
  await exec(
    `CREATE INDEX IF NOT EXISTS "ProjectMember_userId_idx" ON "ProjectMember"("userId")`,
    "index ProjectMember.userId",
  );

  // 6. Verify OWNER rows survived
  const owners: { count: bigint }[] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::bigint AS count FROM "User" WHERE role = 'OWNER'`,
  );
  console.log(`\n✓ Migration complete. OWNER users preserved: ${owners[0]?.count}`);
}

main()
  .catch((e) => {
    console.error("\nMigration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

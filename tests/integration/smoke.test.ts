import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupTestDatabase, teardownTestDatabase } from "../helpers/db";
import { query } from "~~/server/db/postgres";

describe("Testcontainers PostgreSQL Setup", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("should connect to PostgreSQL and verify migrations ran", async () => {
    const res = await query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
    );
    const tableNames = res.rows.map((r) => r.tablename);
    expect(tableNames).toContain("apk_apps");
    expect(tableNames).toContain("apk_beta_testers");
    expect(tableNames).toContain("pgmigrations");
  });
});

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { RedisContainer, type StartedRedisContainer } from "@testcontainers/redis";
import { runner } from "node-pg-migrate";
import path from "node:path";
import { initPostgres, shutdownPostgres, query } from "~~/server/db/postgres";
import { initRedis, shutdownRedis, getRedisClient } from "~~/server/db/redis";

let pgContainer: StartedPostgreSqlContainer | null = null;
let redisContainer: StartedRedisContainer | null = null;

export async function setupTestEnvironment() {
  if (!pgContainer) {
    // Start PostgreSQL container with pgvector
    pgContainer = await new PostgreSqlContainer("pgvector/pgvector:pg16")
      .withDatabase("test_portfolio")
      .withUsername("test_user")
      .withPassword("test_password")
      .start();

    const connectionString = pgContainer.getConnectionUri();

    // Run all migrations to replicate production database schema
    await runner({
      databaseUrl: connectionString,
      dir: path.resolve(process.cwd(), "migrations"),
      direction: "up",
      count: Infinity,
      migrationsTable: "pgmigrations",
      verbose: false,
    });

    // Connect app database pool to the test container
    await initPostgres({
      host: pgContainer.getHost(),
      port: pgContainer.getPort(),
      database: pgContainer.getDatabase(),
      user: pgContainer.getUsername(),
      password: pgContainer.getPassword(),
      ssl: false,
    });
  }

  if (!redisContainer) {
    // Start Redis container for Asynq task queues and rate-limiting
    redisContainer = await new RedisContainer("redis:7-alpine").start();
    const redisUrl = redisContainer.getConnectionUrl();
    await initRedis({ url: redisUrl });
  }

  return { pgContainer, redisContainer };
}

export const setupTestDatabase = setupTestEnvironment;

export async function teardownTestEnvironment() {
  await shutdownPostgres();
  if (pgContainer) {
    await pgContainer.stop();
    pgContainer = null;
  }

  await shutdownRedis();
  if (redisContainer) {
    await redisContainer.stop();
    redisContainer = null;
  }
}

export const teardownTestDatabase = teardownTestEnvironment;

export async function truncateAllTables() {
  await query(`
    TRUNCATE TABLE
      apk_beta_testers,
      apk_releases,
      apk_apps,
      apk_sync_jobs,
      apk_repositories
    CASCADE;
  `);
}

export async function truncateFeatureTables(tables?: string[]) {
  const targetTables = tables || [
    "application_attachments",
    "job_applications",
    "gmail_tokens",
    "job_listings",
    "project_skills",
    "projects",
    "journey_skills",
    "journeys",
    "skills",
    "skill_categories",
    "messages",
    "apk_beta_testers",
    "apk_releases",
    "apk_apps",
    "apk_sync_jobs",
    "apk_repositories",
  ];
  await query(`TRUNCATE TABLE ${targetTables.join(", ")} CASCADE;`);
}

export async function flushRedis() {
  const client = getRedisClient();
  if (client && client.isOpen) {
    await client.flushAll();
  }
}

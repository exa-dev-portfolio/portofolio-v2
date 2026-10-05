import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestEnvironment, teardownTestEnvironment, truncateFeatureTables } from "../helpers/db";
import { query } from "~~/server/db/postgres";
import { jobService } from "~~/server/services/job.service";

describe("Job Service Integration Tests", () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await truncateFeatureTables(["job_listings"]);
  });

  it("should query jobs with pagination and filters, retrieve stats, and archive jobs", async () => {
    // 1. Insert seed job listings
    const insertRes = await query<{ id: string }>(
      `INSERT INTO job_listings (
         source, source_job_id, title, company, job_url, is_relevant, is_archived, relevance_score
       )
       VALUES
         ('linkedin', 'job-1', 'Senior Golang Backend Engineer', 'Stripe', 'https://stripe.com/job1', true, false, 95),
         ('linkedin', 'job-2', 'Frontend Vue.js Developer', 'GitLab', 'https://gitlab.com/job2', true, false, 80),
         ('jobstreet', 'job-3', 'Golang Systems Architect', 'Gojek', 'https://gojek.com/job3', true, false, 90),
         ('indeed', 'job-4', 'Irrelevant Position', 'Random Co', 'https://example.com/job4', false, false, 20)
       RETURNING id;`
    );

    const jobIds = insertRes.rows.map((r) => r.id);
    expect(jobIds).toHaveLength(4);

    // 2. Query active relevant jobs (should return 3)
    const activeJobs = await jobService.getJobs({
      page: 1,
      limit: 10,
      status: "active",
      sort: "score",
    });

    expect(activeJobs.total).toBe(3);
    expect(activeJobs.data).toHaveLength(3);
    expect(activeJobs.data[0].title).toBe("Senior Golang Backend Engineer"); // highest score (95)

    // 3. Search filter ("Golang")
    const searchJobs = await jobService.getJobs({
      page: 1,
      limit: 10,
      status: "active",
      search: "Golang",
      sort: "score",
    });

    expect(searchJobs.total).toBe(2);
    expect(searchJobs.data.every((j) => j.title.includes("Golang"))).toBe(true);

    // 4. Source filter ("jobstreet")
    const jobstreetJobs = await jobService.getJobs({
      page: 1,
      limit: 10,
      status: "active",
      source: "jobstreet",
      sort: "score",
    });

    expect(jobstreetJobs.total).toBe(1);
    expect(jobstreetJobs.data[0].company).toBe("Gojek");

    // 5. Get Stats
    const stats = await jobService.getStats();
    expect(stats.total).toBe(3);
    expect(stats.bySource.linkedin).toBe(2);
    expect(stats.bySource.jobstreet).toBe(1);

    // 6. Archive jobs
    await jobService.archiveJobs([jobIds[0], jobIds[2]]);

    // 7. Verify active count decreased
    const remainingActive = await jobService.getJobs({
      page: 1,
      limit: 10,
      status: "active",
      sort: "score",
    });
    expect(remainingActive.total).toBe(1);
    expect(remainingActive.data[0].id).toBe(jobIds[1]);

    // Verify archived list
    const archivedJobs = await jobService.getJobs({
      page: 1,
      limit: 10,
      status: "archived",
      sort: "score",
    });
    expect(archivedJobs.total).toBe(2);
  });
});

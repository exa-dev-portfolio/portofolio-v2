import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestEnvironment, teardownTestEnvironment, truncateFeatureTables, flushRedis } from "../helpers/db";
import { createMockEvent } from "../helpers/fixtures";
import {
  createJourney,
  getJourneysNoPagination,
  getJourneysByCursor,
  updateJourney,
  deleteJourney,
  getJourneyById,
} from "~~/server/services/journey.service";
import { createSkills } from "~~/server/services/skill.service";

describe("Journey Service Integration Tests", () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await truncateFeatureTables(["journey_skills", "journeys", "skills"]);
    await flushRedis();
  });

  it("should create journey linked to skills, retrieve, paginate, update, and delete", async () => {
    const event = createMockEvent();

    // 1. Create skills to link
    await createSkills(event, [
      { name: "Golang", color: "#00add8", icon: "devicon:go" },
      { name: "Kubernetes", color: "#326ce5", icon: "devicon:kubernetes" },
    ]);

    // 2. Create Journey
    const createRes = await createJourney(event, {
      title: "Senior Backend Engineer",
      company: "Acme Cloud Inc",
      location: "Remote",
      start_date: "2024-01-01",
      is_current: true,
      key_responsibilities: [
        "Architected distributed microservices in Golang",
        "Managed Kubernetes clusters and Helm charts",
      ],
      description: "Led backend engineering team delivering scalable cloud solutions.",
    });

    expect(createRes.success).toBe(true);
    expect(createRes.data.journey_id).toBeDefined();
    const journeyId = createRes.data.journey_id;

    // 3. Get all journeys
    const allRes = await getJourneysNoPagination(event);
    expect(allRes.success).toBe(true);
    expect(allRes.data.data.length).toBe(1);
    expect(allRes.data.data[0].company).toBe("Acme Cloud Inc");

    // 4. Cursor search
    const cursorRes = await getJourneysByCursor(event, 10, undefined, "Acme");
    expect(cursorRes.success).toBe(true);
    expect(cursorRes.data.data.length).toBe(1);

    // 5. Get journey by ID
    const singleRes = await getJourneyById(event, journeyId);
    expect(singleRes.success).toBe(true);
    expect(singleRes.data.title).toBe("Senior Backend Engineer");

    // 6. Update journey
    const updateRes = await updateJourney(event, {
      id: journeyId,
      title: "Staff Software Engineer",
      company: "Acme Cloud Inc",
      start_date: "2024-01-01",
      is_current: true,
      key_responsibilities: ["Staff-level architecture and platform leadership"],
    });
    expect(updateRes.success).toBe(true);

    const verifyUpdated = await getJourneyById(event, journeyId);
    expect(verifyUpdated.data.title).toBe("Staff Software Engineer");

    // 7. Delete journey
    const deleteRes = await deleteJourney(event, journeyId);
    expect(deleteRes.success).toBe(true);

    const afterDelete = await getJourneysNoPagination(event);
    expect(afterDelete.data.data.length).toBe(0);
  });
});

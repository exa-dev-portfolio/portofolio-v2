import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { setupTestEnvironment, teardownTestEnvironment, truncateFeatureTables, flushRedis } from "../helpers/db";
import { createMockEvent } from "../helpers/fixtures";

// Mock MinIO Object Storage
const mockMinio = vi.hoisted(() => ({
  uploadFile: vi.fn().mockResolvedValue("https://minio.local/project/test.webp"),
  getPublicUrl: vi.fn().mockReturnValue("https://minio.local/project/test.webp"),
  deleteFile: vi.fn().mockResolvedValue(true),
}));

vi.mock("~~/server/lib/minio", () => ({
  getMinioClient: () => mockMinio,
}));

// Mock Image Processing
vi.mock("~~/server/utils/image", () => ({
  processImageToWebP: vi.fn().mockResolvedValue({
    data: Buffer.from("fake-webp-image"),
    contentType: "image/webp",
    extension: "webp",
    size: 15,
  }),
}));

import {
  createProject,
  getProjectsNoPagination,
  getProjectsByCursor,
  getProjectById,
  updateProject,
  deleteProject,
} from "~~/server/services/project.service";
import { createSkills } from "~~/server/services/skill.service";

describe("Project Service Integration Tests", () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await truncateFeatureTables(["project_skills", "projects", "skills"]);
    await flushRedis();
    vi.clearAllMocks();
  });

  it("should create project with image & skills, retrieve, paginate, update, and delete", async () => {
    const event = createMockEvent();

    // 1. Create a skill to attach to project
    await createSkills(event, [
      { name: "Nuxt 3", color: "#00dc82", icon: "devicon:nuxtjs" },
      { name: "Tailwind CSS", color: "#06b6d4", icon: "devicon:tailwindcss" },
    ]);
    const skillsList = await query<{ id: number }>("SELECT id FROM skills ORDER BY id ASC");
    const skillIds = skillsList.rows.map((s) => s.id);

    // 2. Create Project
    const createRes = await createProject(event, {
      name: "Modern Portfolio Platform",
      description: "Fullstack portfolio platform with analytics and showcase",
      status: "published" as any,
      live_url: "https://eka-dev.cloud",
      repo_url: "https://github.com/eka/portfolio",
      is_organization: false,
      features: ["Analytics", "Showcase", "Responsive UI"],
      id_skills: skillIds,
      image: {
        data: Buffer.from("dummy-image-content"),
        filename: "cover.png",
        type: "image/png",
        size: 100,
      } as any,
    } as any);

    expect(createRes.success).toBe(true);
    expect(createRes.data.project_id).toBeDefined();
    const projectId = createRes.data.project_id;

    // Verify MinIO upload was called
    expect(mockMinio.uploadFile).toHaveBeenCalled();

    // 3. Get projects (no pagination)
    const listRes = await getProjectsNoPagination(event);
    expect(listRes.success).toBe(true);
    expect(listRes.data.data.length).toBe(1);
    expect(listRes.data.data[0].name).toBe("Modern Portfolio Platform");
    expect(listRes.data.data[0].technologies.length).toBe(2);

    // 4. Cursor pagination
    const cursorRes = await getProjectsByCursor(event, 10, undefined, "Platform");
    expect(cursorRes.success).toBe(true);
    expect(cursorRes.data.data.length).toBe(1);

    // 5. Get project by ID
    const singleRes = await getProjectById(event, projectId);
    expect(singleRes.success).toBe(true);
    expect(singleRes.data.name).toBe("Modern Portfolio Platform");

    // 6. Update project
    const updateRes = await updateProject(event, {
      id: projectId,
      name: "Modern Portfolio Platform v2",
      description: "Updated description with more features",
      status: "published" as any,
      live_url: "https://eka-dev.cloud/v2",
      repo_url: "https://github.com/eka/portfolio-v2",
      features: ["Analytics v2", "Showcase v2"],
      is_organization: false,
      id_skills: [skillIds[0]], // only 1 skill now
    } as any);
    expect(updateRes.success).toBe(true);

    const verifyUpdated = await getProjectById(event, projectId);
    expect(verifyUpdated.data.name).toBe("Modern Portfolio Platform v2");
    expect(verifyUpdated.data.technologies.length).toBe(1);

    // 7. Delete project
    const deleteRes = await deleteProject(event, projectId);
    expect(deleteRes.success).toBe(true);

    const afterDelete = await getProjectsNoPagination(event);
    expect(afterDelete.data.data.length).toBe(0);
  });
});
import { query } from "~~/server/db/postgres";

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestEnvironment, teardownTestEnvironment, truncateFeatureTables, flushRedis } from "../helpers/db";
import { createMockEvent } from "../helpers/fixtures";
import {
  createSkills,
  getSkillsNoPagination,
  getSkillsByCursor,
  updateSkill,
  deleteSkill,
} from "~~/server/services/skill.service";
import {
  createSkillCategory,
  getSkillCategories,
  updateSkillCategory,
  deleteSkillCategory,
} from "~~/server/services/skill_category.service";

describe("Skill & Skill Categories Integration Tests", () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await truncateFeatureTables(["skills", "skill_categories"]);
    await flushRedis();
  });

  describe("Skill Categories", () => {
    it("should create a skill category, retrieve it, update it, and delete it", async () => {
      const event = createMockEvent();

      // 1. Create Category
      const createRes = await createSkillCategory(event, {
        name: "Backend Development",
        color: "#10b981",
        icon: "carbon:server",
        description: "Server-side tech stack",
      });

      expect(createRes.success).toBe(true);
      expect(createRes.data.data.name).toBe("Backend Development");
      const categoryId = createRes.data.data.id;

      // 2. Get Categories (caches in Redis)
      const listRes = await getSkillCategories(event);
      expect(listRes.success).toBe(true);
      expect(listRes.data.data.length).toBe(1);
      expect(listRes.data.data[0].id).toBe(categoryId);

      // 3. Update Category
      const updateRes = await updateSkillCategory(event, {
        id: categoryId,
        name: "Backend & Systems",
        color: "#059669",
        icon: "carbon:cloud",
      });
      expect(updateRes.success).toBe(true);

      // 4. Verify updated name
      const verifyList = await getSkillCategories(event);
      expect(verifyList.data.data[0].name).toBe("Backend & Systems");

      // 5. Delete Category
      const deleteRes = await deleteSkillCategory(event, categoryId);
      expect(deleteRes.success).toBe(true);

      const afterDelete = await getSkillCategories(event);
      expect(afterDelete.data.data.length).toBe(0);
    });
  });

  describe("Skills", () => {
    it("should create skills in bulk, get with filters, paginate, update, and delete", async () => {
      const event = createMockEvent();

      // Create a category first
      const catRes = await createSkillCategory(event, {
        name: "Languages",
        color: "#3b82f6",
        icon: "carbon:code",
      });
      const categoryId = catRes.data.data.id;

      // 1. Create skills in bulk
      const createRes = await createSkills(event, [
        { name: "TypeScript", color: "#3178c6", icon: "devicon:typescript", category_id: categoryId },
        { name: "Go", color: "#00add8", icon: "devicon:go", category_id: categoryId },
        { name: "Rust", color: "#dea584", icon: "devicon:rust", category_id: categoryId },
      ]);
      expect(createRes.success).toBe(true);

      // 2. Get all skills (no pagination)
      const allSkillsRes = await getSkillsNoPagination(event);
      expect(allSkillsRes.success).toBe(true);
      expect(allSkillsRes.data.data.length).toBe(3);

      // 3. Filter skills by category ID
      const filteredRes = await getSkillsNoPagination(event, categoryId);
      expect(filteredRes.data.data.length).toBe(3);

      // 4. Cursor pagination and search
      const searchRes = await getSkillsByCursor(event, 10, undefined, "TypeScript");
      expect(searchRes.data.data.length).toBe(1);
      expect(searchRes.data.data[0].name).toBe("TypeScript");
      const tsSkillId = searchRes.data.data[0].id;

      // 5. Update skill
      const updateRes = await updateSkill(event, {
        id: tsSkillId,
        name: "TypeScript 5.x",
        color: "#235a97",
        icon: "devicon:typescript",
        category_id: categoryId,
      });
      expect(updateRes.success).toBe(true);
      expect(updateRes.message).toContain("updated");

      // Verify updated skill via list
      const afterUpdateList = await getSkillsNoPagination(event);
      const updatedSkill = afterUpdateList.data.data.find((s: any) => s.id === tsSkillId);
      expect(updatedSkill.name).toBe("TypeScript 5.x");

      // 7. Delete skill
      const deleteRes = await deleteSkill(event, tsSkillId);
      expect(deleteRes.success).toBe(true);

      const remainingRes = await getSkillsNoPagination(event);
      expect(remainingRes.data.data.length).toBe(2);
    });
  });
});

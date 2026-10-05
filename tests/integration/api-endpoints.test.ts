import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { setupTestEnvironment, teardownTestEnvironment, truncateFeatureTables, flushRedis } from "../helpers/db";
import { startTestServer, apiRequest, createTestAuthHeader, type TestServerInstance } from "../helpers/server";
import { createTestApp } from "../helpers/fixtures";
import { query } from "~~/server/db/postgres";

// Mocks for External Services
vi.mock("~~/server/lib/ai-apply", () => ({
  generateEmail: vi.fn().mockResolvedValue({
    subject: "Application for Staff Engineer - Eka",
    body: "Dear Recruiter,\n\nI am thrilled to apply...",
    reasoning: ["Relevant architecture experience"],
    analysis: "Strong match",
  }),
  reviseEmail: vi.fn().mockResolvedValue({
    reply: "Updated the email to focus on cloud infrastructure.",
    revised_subject: "Updated: Application for Staff Engineer",
    revised_body: "Dear Recruiter,\n\nI am writing with focused expertise in cloud...",
    reasoning: ["Emphasized Kubernetes and PostgreSQL"],
  }),
}));

vi.mock("~~/server/lib/gmail", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: "mock-message-id" }),
  fetchAttachmentBuffer: vi.fn().mockResolvedValue(Buffer.from("mock-cv-pdf")),
  exchangeCodeForTokens: vi.fn().mockResolvedValue({
    email: "applicant@gmail.com",
    access_token: "mock-token",
    refresh_token: "mock-refresh",
    expires_at: new Date(Date.now() + 3600000),
  }),
}));

vi.mock("~~/server/lib/minio", () => ({
  getMinioClient: () => ({
    uploadFile: vi.fn().mockResolvedValue("https://minio.local/project/test.webp"),
    getPublicUrl: vi.fn().mockReturnValue("https://minio.local/project/test.webp"),
    deleteFile: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock("~~/server/utils/image", () => ({
  processImageToWebP: vi.fn().mockResolvedValue({
    data: Buffer.from("fake-webp-image"),
    contentType: "image/webp",
    extension: "webp",
    size: 15,
  }),
}));

describe("Full HTTP API Endpoints Integration Tests (Real HTTP Requests)", () => {
  let serverInstance: TestServerInstance;
  let authHeaders: Record<string, string>;

  beforeAll(async () => {
    await setupTestEnvironment();
    serverInstance = await startTestServer();
    authHeaders = createTestAuthHeader();
  });

  afterAll(async () => {
    if (serverInstance) {
      await serverInstance.close();
    }
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await truncateFeatureTables();
    await flushRedis();
    vi.clearAllMocks();
  });

  describe("Messages API (HTTP Endpoints)", () => {
    it("POST /api/messages & GET /api/messages - handles public submission and auth-protected queries", async () => {
      // 1. Submit message publicly (No auth required)
      const postRes = await apiRequest(serverInstance.baseUrl, "/api/messages", {
        method: "POST",
        body: {
          name: "John Doe",
          email: "john@example.com",
          subject: "Project Collaboration",
          message: "Hello Eka, let's collaborate on an exciting fullstack project!",
        },
      });

      expect(postRes.status).toBe(201);
      expect(postRes.data.success).toBe(true);
      expect(postRes.data.data.message_id).toBeDefined();
      const messageId = postRes.data.data.message_id;

      // 2. Query messages without auth -> should be 401 Unauthorized
      const unauthRes = await apiRequest(serverInstance.baseUrl, "/api/messages", {
        method: "GET",
      });
      expect(unauthRes.status).toBe(401);
      expect(unauthRes.data.success).toBe(false);

      // 3. Query messages with Bearer Token -> 200 OK
      const getRes = await apiRequest(serverInstance.baseUrl, "/api/messages?status=unread&limit=10", {
        method: "GET",
        headers: authHeaders,
      });

      expect(getRes.status).toBe(200);
      expect(getRes.data.success).toBe(true);
      expect(getRes.data.data.data.length).toBe(1);
      expect(getRes.data.data.data[0].email).toBe("john@example.com");

      // 4. Get message by ID -> 200 OK
      const singleRes = await apiRequest(serverInstance.baseUrl, `/api/messages/${messageId}`, {
        method: "GET",
        headers: authHeaders,
      });
      expect(singleRes.status).toBe(200);
      expect(singleRes.data.data.name).toBe("John Doe");

      // 5. Delete message -> 200 OK
      const delRes = await apiRequest(serverInstance.baseUrl, `/api/messages/${messageId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      expect(delRes.status).toBe(200);
      expect(delRes.data.success).toBe(true);
    });
  });

  describe("Skill Categories & Skills API (HTTP Endpoints)", () => {
    it("CRUD lifecycle via HTTP requests for categories and skills", async () => {
      // 1. Create Category via POST /api/skill-categories
      const catRes = await apiRequest(serverInstance.baseUrl, "/api/skill-categories", {
        method: "POST",
        headers: authHeaders,
        body: {
          name: "Cloud & DevOps",
          color: "#38bdf8",
          icon: "carbon:cloud",
          description: "Infrastructure tools",
        },
      });

      expect(catRes.status).toBe(201);
      expect(catRes.data.success).toBe(true);
      const catId = catRes.data.data.data.id;

      // 2. List Categories via GET /api/skill-categories
      const listCatRes = await apiRequest(serverInstance.baseUrl, "/api/skill-categories", {
        method: "GET",
      });
      expect(listCatRes.status).toBe(200);
      expect(listCatRes.data.data.data.length).toBe(1);

      // 3. Bulk Create Skills via POST /api/skills
      const skillRes = await apiRequest(serverInstance.baseUrl, "/api/skills", {
        method: "POST",
        headers: authHeaders,
        body: {
          data: [
            { name: "Kubernetes", color: "#326ce5", icon: "devicon:kubernetes", category_id: catId },
            { name: "Docker", color: "#2496ed", icon: "devicon:docker", category_id: catId },
          ],
        },
      });

      expect(skillRes.status).toBe(201);
      expect(skillRes.data.success).toBe(true);

      // 4. List Skills via GET /api/skills
      const listSkillsRes = await apiRequest(serverInstance.baseUrl, `/api/skills?category_id=${catId}`, {
        method: "GET",
      });
      expect(listSkillsRes.status).toBe(200);
      expect(listSkillsRes.data.data.data.length).toBe(2);
      const k8sSkill = listSkillsRes.data.data.data.find((s: any) => s.name === "Kubernetes");

      // 5. Update Skill via PUT /api/skills
      const updateSkillRes = await apiRequest(serverInstance.baseUrl, "/api/skills", {
        method: "PUT",
        headers: authHeaders,
        body: {
          id: k8sSkill.id,
          name: "Kubernetes k8s",
          color: "#2563eb",
          icon: "devicon:kubernetes",
          category_id: catId,
        },
      });
      expect(updateSkillRes.status).toBe(200);

      // 6. Delete Skill via DELETE /api/skills/:id
      const delSkillRes = await apiRequest(serverInstance.baseUrl, `/api/skills/${k8sSkill.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      expect(delSkillRes.status).toBe(200);

      // 7. Delete Category via DELETE /api/skill-categories/:id
      const delCatRes = await apiRequest(serverInstance.baseUrl, `/api/skill-categories/${catId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      expect(delCatRes.status).toBe(200);
    });
  });

  describe("Projects API (HTTP Endpoints)", () => {
    it("POST, GET, and DELETE /api/projects via HTTP multipart & JSON", async () => {
      // Create a skill first for relations
      const skillInsert = await query<{ id: number }>(
        "INSERT INTO skills (name, color, icon) VALUES ('Vue 3', '#42b883', 'devicon:vuejs') RETURNING id"
      );
      const skillId = skillInsert.rows[0].id;

      // 1. Create Project via POST /api/projects with Multipart FormData
      const formData = new FormData();
      formData.append("name", "E-Commerce Cloud Engine");
      formData.append("description", "High performance distributed store backend");
      formData.append("status", "published");
      formData.append("features", JSON.stringify(["Microservices", "CQRS"]));
      formData.append("id_skills", JSON.stringify([skillId]));
      formData.append("live_url", "https://shop.eka-dev.cloud");
      formData.append("repo_url", "https://github.com/eka/ecommerce");
      formData.append("is_organization", "false");

      const fileBlob = new Blob(["dummy-image-bytes"], { type: "image/png" });
      formData.append("image", fileBlob, "cover.png");

      const postRes = await apiRequest(serverInstance.baseUrl, "/api/projects", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      expect(postRes.status).toBe(201);
      expect(postRes.data.success).toBe(true);
      const projectId = postRes.data.data.project_id;

      // 2. Query Projects via GET /api/projects
      const getRes = await apiRequest(serverInstance.baseUrl, "/api/projects", {
        method: "GET",
      });
      expect(getRes.status).toBe(200);
      expect(getRes.data.data.data.length).toBe(1);
      expect(getRes.data.data.data[0].name).toBe("E-Commerce Cloud Engine");

      // 3. Query Project Detail via GET /api/projects/:id
      const detailRes = await apiRequest(serverInstance.baseUrl, `/api/projects/${projectId}`, {
        method: "GET",
        headers: authHeaders,
      });
      expect(detailRes.status).toBe(200);
      expect(detailRes.data.data.name).toBe("E-Commerce Cloud Engine");

      // 4. Delete Project via DELETE /api/projects/:id
      const delRes = await apiRequest(serverInstance.baseUrl, `/api/projects/${projectId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      expect(delRes.status).toBe(200);
      expect(delRes.data.success).toBe(true);
    });
  });

  describe("Applications API (HTTP Endpoints)", () => {
    it("Complete application flow via HTTP requests", async () => {
      // 1. Create Application via POST /api/applications
      const createRes = await apiRequest(serverInstance.baseUrl, "/api/applications", {
        method: "POST",
        headers: authHeaders,
        body: {
          company_name: "Google DeepMind",
          position: "AI Research Engineer",
          hr_email: "recruiting@deepmind.com",
          job_description: "Developing agentic coding intelligence.",
          job_link: "https://deepmind.google/careers",
        },
      });

      expect(createRes.status).toBe(201);
      expect(createRes.data.success).toBe(true);
      const appId = createRes.data.data.id;

      // 2. List Applications via GET /api/applications
      const listRes = await apiRequest(serverInstance.baseUrl, "/api/applications", {
        method: "GET",
        headers: authHeaders,
      });
      expect(listRes.status).toBe(200);
      expect(listRes.data.data.length).toBe(1);

      // 3. Get Stats via GET /api/applications/stats
      const statsRes = await apiRequest(serverInstance.baseUrl, "/api/applications/stats", {
        method: "GET",
        headers: authHeaders,
      });
      expect(statsRes.status).toBe(200);
      expect(statsRes.data.data.total).toBe(1);
      expect(statsRes.data.data.draft).toBe(1);

      // 4. Generate AI Email via POST /api/applications/generate
      const genRes = await apiRequest(serverInstance.baseUrl, "/api/applications/generate", {
        method: "POST",
        headers: authHeaders,
        body: {
          company_name: "Anthropic",
          position: "Systems Engineer",
          hr_email: "jobs@anthropic.com",
          job_description: "Scale model serving architecture.",
        },
      });
      expect(genRes.status).toBe(200);
      expect(genRes.data.data.subject).toBeDefined();
      const genAppId = genRes.data.data.application.id;

      // 5. Chat with AI via POST /api/applications/chat
      const chatRes = await apiRequest(serverInstance.baseUrl, "/api/applications/chat", {
        method: "POST",
        headers: authHeaders,
        body: {
          application_id: genAppId,
          message: "Please highlight my experience with distributed Redis and queues.",
        },
      });
      expect(chatRes.status).toBe(200);
      expect(chatRes.data.data.reply).toBeDefined();

      // 6. Clear chat via POST /api/applications/clear-chat
      const clearRes = await apiRequest(serverInstance.baseUrl, "/api/applications/clear-chat", {
        method: "POST",
        headers: authHeaders,
        body: {
          application_id: genAppId,
        },
      });
      expect(clearRes.status).toBe(200);

      // 7. Send Email via POST /api/applications/:id/send
      const sendRes = await apiRequest(serverInstance.baseUrl, `/api/applications/${genAppId}/send`, {
        method: "POST",
        headers: authHeaders,
        body: {
          code: "google-oauth-auth-code",
          attach_cv: true,
        },
      });
      expect(sendRes.status).toBe(200);

      // 8. Delete Application via DELETE /api/applications/:id
      const delRes = await apiRequest(serverInstance.baseUrl, `/api/applications/${appId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      expect(delRes.status).toBe(200);
    });
  });

  describe("Journeys API (HTTP Endpoints)", () => {
    it("POST, GET, PUT, DELETE /api/journeys via HTTP", async () => {
      // 1. Create Journey via POST /api/journeys
      const postRes = await apiRequest(serverInstance.baseUrl, "/api/journeys", {
        method: "POST",
        headers: authHeaders,
        body: {
          title: "Principal Architect",
          company: "Tech Giant Corp",
          location: "Singapore / Remote",
          start_date: "2024-01-01",
          end_date: "2025-01-01",
          description: "Led core infrastructure transition",
          key_responsibilities: ["Architecture planning", "Team mentoring"],
          is_current: false,
          skills: [],
        },
      });

      expect(postRes.status).toBe(201);
      expect(postRes.data.success).toBe(true);
      const journeyId = postRes.data.data.journey_id;

      // 2. List Journeys via GET /api/journeys
      const listRes = await apiRequest(serverInstance.baseUrl, "/api/journeys", {
        method: "GET",
      });
      expect(listRes.status).toBe(200);
      expect(listRes.data.data.data.length).toBe(1);

      // 3. Update Journey via PUT /api/journeys
      const putRes = await apiRequest(serverInstance.baseUrl, "/api/journeys", {
        method: "PUT",
        headers: authHeaders,
        body: {
          id: journeyId,
          title: "Senior Principal Architect",
          company: "Tech Giant Corp",
          location: "Singapore",
          start_date: "2024-01-01",
          is_current: true,
          key_responsibilities: ["Strategic Tech Direction"],
          skills: [],
        },
      });
      expect(putRes.status).toBe(200);

      // 4. Delete Journey via DELETE /api/journeys/:id
      const delRes = await apiRequest(serverInstance.baseUrl, `/api/journeys/${journeyId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      expect(delRes.status).toBe(200);
    });
  });

  describe("Settings API (HTTP Endpoints)", () => {
    it("GET and PUT /api/settings endpoints via HTTP", async () => {
      // 1. Get Settings via GET /api/settings
      const getRes = await apiRequest(serverInstance.baseUrl, "/api/settings", {
        method: "GET",
      });
      expect(getRes.status).toBe(200);
      expect(getRes.data.success).toBe(true);

      // 2. Update Profile via PUT /api/settings/profile
      const putRes = await apiRequest(serverInstance.baseUrl, "/api/settings/profile", {
        method: "PUT",
        headers: authHeaders,
        body: {
          name: "Moh. Eka Syafrino",
          location: "Jakarta, Indonesia",
          open_to_opportunities: true,
          job_notifications_enabled: true,
        },
      });
      expect(putRes.status).toBe(200);
      expect(putRes.data.success).toBe(true);

      // 3. Update Social Links via PUT /api/settings/social-links
      const linksRes = await apiRequest(serverInstance.baseUrl, "/api/settings/social-links", {
        method: "PUT",
        headers: authHeaders,
        body: {
          github_profile: "https://github.com/eka",
          linkedin_profile: "https://linkedin.com/in/eka",
          website: "https://eka-dev.cloud",
        },
      });
      expect(linksRes.status).toBe(200);
      expect(linksRes.data.success).toBe(true);
    });
  });

  describe("APK & Beta Testing API (HTTP Endpoints)", () => {
    it("Request OTP, Verify OTP, Slots, and Admin controls via HTTP requests", async () => {
      // Create a test app in database first
      const app = await createTestApp({
        appName: "HTTP Beta App",
        packageName: "com.test.httpapp",
      });

      // 1. Request OTP via POST /api/v1/apps/:packageName/beta/request-otp
      const reqOtpRes = await apiRequest(
        serverInstance.baseUrl,
        `/api/v1/apps/${app.package_name}/beta/request-otp`,
        {
          method: "POST",
          body: {
            email: "httpbeta@example.com",
            platform: "android",
          },
        }
      );

      expect(reqOtpRes.status).toBe(200);
      expect(reqOtpRes.data.success).toBe(true);

      // Retrieve the generated OTP directly from DB
      const testerRow = await query<{ otp_code: string; id: string }>(
        "SELECT id, otp_code FROM apk_beta_testers WHERE email = $1",
        ["httpbeta@example.com"]
      );
      expect(testerRow.rows.length).toBe(1);
      const { otp_code, id: testerId } = testerRow.rows[0];

      // 2. Verify OTP via POST /api/v1/apps/:packageName/beta/verify-otp
      const verifyOtpRes = await apiRequest(
        serverInstance.baseUrl,
        `/api/v1/apps/${app.package_name}/beta/verify-otp`,
        {
          method: "POST",
          body: {
            email: "httpbeta@example.com",
            otp: otp_code,
            platform: "android",
          },
        }
      );

      expect(verifyOtpRes.status).toBe(200);
      expect(verifyOtpRes.data.success).toBe(true);
      expect(verifyOtpRes.data.data.email).toBe("httpbeta@example.com");
      expect(verifyOtpRes.data.data.expires_at).toBeDefined();

      // Check tester is active in DB
      const activeTesterDb = await query<{ status: string }>(
        "SELECT status FROM apk_beta_testers WHERE id = $1",
        [testerId]
      );
      expect(activeTesterDb.rows[0].status).toBe("active");

      // 3. Check Slots via GET /api/v1/apps/:packageName/beta/slots
      const slotsRes = await apiRequest(
        serverInstance.baseUrl,
        `/api/v1/apps/${app.package_name}/beta/slots`,
        {
          method: "GET",
        }
      );
      expect(slotsRes.status).toBe(200);
      expect(slotsRes.data.data.max_slots).toBeDefined();
      expect(slotsRes.data.data.remaining_slots).toBeDefined();

      // 4. Admin Update Store Links via PATCH /api/v1/admin/apk/apps/:id/store-links
      const linksPatchRes = await apiRequest(
        serverInstance.baseUrl,
        `/api/v1/admin/apk/apps/${app.id}/store-links`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: {
            play_store_url: "https://play.google.com/store/apps/details?id=com.test.httpapp",
            testflight_url: "https://testflight.apple.com/join/HTTPTest",
          },
        }
      );
      expect(linksPatchRes.status).toBe(200);
      expect(linksPatchRes.data.success).toBe(true);

      // 5. Admin Revoke Beta Tester via PATCH /api/v1/admin/apk/testers/:id/revoke
      const revokeRes = await apiRequest(
        serverInstance.baseUrl,
        `/api/v1/admin/apk/testers/${testerId}/revoke`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: {
            reason: "Beta testing testing phase concluded",
          },
        }
      );
      expect(revokeRes.status).toBe(200);
      expect(revokeRes.data.success).toBe(true);
    });
  });
});

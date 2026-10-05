import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { setupTestEnvironment, teardownTestEnvironment, truncateFeatureTables, flushRedis } from "../helpers/db";
import { createMockEvent } from "../helpers/fixtures";

// 1. Mock AI Apply module
const mockGenerateEmail = vi.fn().mockResolvedValue({
  subject: "Application for Senior Full-Stack Engineer - Moh. Eka",
  body: "Dear Hiring Team,\n\nI am writing to express my strong interest in the Senior Full-Stack Engineer role...",
  reasoning: ["Highlighted relevant Nuxt & Postgres stack", "Matched architecture experience"],
  analysis: "Strong alignment with candidate background",
});

const mockReviseEmail = vi.fn().mockResolvedValue({
  reply: "I updated the email to highlight mobile experience with Flutter and TestFlight.",
  revised_subject: "Updated: Application for Senior Full-Stack Engineer",
  revised_body: "Dear Hiring Team,\n\nI am writing with refined focus on mobile and backend development...",
  reasoning: ["Added mobile distribution achievements"],
});

vi.mock("~~/server/lib/ai-apply", () => ({
  generateEmail: (...args: any[]) => mockGenerateEmail(...args),
  reviseEmail: (...args: any[]) => mockReviseEmail(...args),
}));

// 2. Mock Gmail module
const mockSendEmail = vi.fn().mockResolvedValue({ id: "mock-gmail-message-id" });
const mockFetchAttachmentBuffer = vi.fn().mockResolvedValue(Buffer.from("fake-cv-pdf-content"));
const mockExchangeCode = vi.fn().mockResolvedValue({
  email: "applicant@gmail.com",
  access_token: "mock-access-token-123",
  refresh_token: "mock-refresh-token-123",
  expires_at: new Date(Date.now() + 3600 * 1000),
});

vi.mock("~~/server/lib/gmail", () => ({
  sendEmail: (...args: any[]) => mockSendEmail(...args),
  fetchAttachmentBuffer: (...args: any[]) => mockFetchAttachmentBuffer(...args),
  exchangeCodeForTokens: (...args: any[]) => mockExchangeCode(...args),
}));

// 3. Mock MinIO
const mockMinio = vi.hoisted(() => ({
  uploadFile: vi.fn().mockResolvedValue("https://minio.local/project/attachment-test.pdf"),
  getPublicUrl: vi.fn().mockReturnValue("https://minio.local/project/attachment-test.pdf"),
  deleteFile: vi.fn().mockResolvedValue(true),
}));

vi.mock("~~/server/lib/minio", () => ({
  getMinioClient: () => mockMinio,
}));

// 4. Mock h3 readMultipartFormData
const mockReadMultipartFormData = vi.fn();
vi.mock("h3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("h3")>();
  return {
    ...actual,
    readMultipartFormData: (...args: any[]) => mockReadMultipartFormData(...args),
  };
});

import {
  create,
  findAll,
  findById,
  update,
  remove,
  generate,
  chat,
  clearApplicationChat,
  uploadAttachment,
  getAttachments,
  deleteAttachment,
  sendApplicationEmail,
  getStats,
} from "~~/server/services/application.service";

describe("Application Service Integration Tests", () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await truncateFeatureTables(["application_attachments", "job_applications", "gmail_tokens"]);
    await flushRedis();
    vi.clearAllMocks();
  });

  it("should perform standard CRUD lifecycle on job applications", async () => {
    const event = createMockEvent();

    // 1. Create Application
    const createRes = await create(event, {
      company_name: "Stripe",
      position: "Full-Stack Engineer",
      hr_email: "recruiting@stripe.com",
      job_description: "Building scalable payment infrastructure and modern web dashboard.",
      job_link: "https://stripe.com/jobs/123",
    });

    expect(createRes.success).toBe(true);
    expect(createRes.data.id).toBeDefined();
    expect(createRes.data.company_name).toBe("Stripe");
    expect(createRes.data.status).toBe("draft");
    const appId = createRes.data.id;

    // 2. Find All
    const allRes = await findAll(event);
    expect(allRes.success).toBe(true);
    expect(allRes.data.length).toBe(1);
    expect(allRes.data[0].id).toBe(appId);

    // 3. Find By ID
    const singleRes = await findById(event, appId);
    expect(singleRes.success).toBe(true);
    expect(singleRes.data.application.id).toBe(appId);
    expect(singleRes.data.attachments).toEqual([]);

    // 4. Update Application
    const updateRes = await update(event, appId, {
      position: "Senior Full-Stack Engineer",
      hr_email: "senior-recruiting@stripe.com",
    });
    expect(updateRes.success).toBe(true);
    expect(updateRes.data.position).toBe("Senior Full-Stack Engineer");

    // 5. Get Stats
    const statsRes = await getStats(event);
    expect(statsRes.success).toBe(true);
    expect(statsRes.data.total).toBe(1);
    expect(statsRes.data.draft).toBe(1);
    expect(statsRes.data.sent).toBe(0);

    // 6. Delete Application
    const deleteRes = await remove(event, appId);
    expect(deleteRes.success).toBe(true);

    const emptyRes = await findAll(event);
    expect(emptyRes.data.length).toBe(0);
  });

  it("should generate email with AI and support revision chat & clearing history", async () => {
    const event = createMockEvent();

    // 1. Generate Application with AI
    const genRes = await generate(event, {
      company_name: "OpenAI",
      position: "Research Engineer",
      hr_email: "careers@openai.com",
      job_description: "Help build the next generation of AI user experiences and systems.",
      job_link: "https://openai.com/careers/456",
    });

    expect(genRes.success).toBe(true);
    expect(mockGenerateEmail).toHaveBeenCalled();
    expect(genRes.data.subject).toContain("Senior Full-Stack Engineer");
    const appId = genRes.data.application.id;

    // 2. Revise email via Chat
    const chatRes = await chat(event, appId, "Please emphasize my Flutter mobile app experience.");
    expect(chatRes.success).toBe(true);
    expect(mockReviseEmail).toHaveBeenCalled();
    expect(chatRes.data.reply).toContain("Flutter");
    expect(chatRes.data.chat_history.length).toBe(2); // user message + assistant reply

    // Verify application in DB has revised subject and chat history
    const updatedApp = await findById(event, appId);
    expect(updatedApp.data.application.email_subject).toBe("Updated: Application for Senior Full-Stack Engineer");

    // 3. Clear Chat history
    const clearRes = await clearApplicationChat(event, appId);
    expect(clearRes.success).toBe(true);
    expect(clearRes.data.chat_history).toEqual([]);

    const clearedApp = await findById(event, appId);
    expect(clearedApp.data.application.chat_history).toEqual([]);
  });

  it("should handle attachment uploads, retrieval, and deletion", async () => {
    const event = createMockEvent();

    // Create an application first
    const createRes = await create(event, {
      company_name: "Linear",
      position: "Product Engineer",
      hr_email: "jobs@linear.app",
    });
    const appId = createRes.data.id;

    // 1. Upload Attachment
    mockReadMultipartFormData.mockResolvedValueOnce([
      {
        name: "file",
        filename: "Portfolio_Summary.pdf",
        type: "application/pdf",
        data: Buffer.from("pdf-binary-stream"),
      },
    ]);

    const uploadRes = await uploadAttachment(event, appId);
    expect(uploadRes.success).toBe(true);
    expect(uploadRes.data.id).toBeDefined();
    expect(uploadRes.data.file_name).toBe("Portfolio_Summary.pdf");
    expect(mockMinio.uploadFile).toHaveBeenCalled();
    const attachmentId = uploadRes.data.id;

    // 2. Get Attachments
    const getAttRes = await getAttachments(event, appId);
    expect(getAttRes.success).toBe(true);
    expect(getAttRes.data.length).toBe(1);
    expect(getAttRes.data[0].id).toBe(attachmentId);

    // 3. Delete Attachment
    const delAttRes = await deleteAttachment(event, appId, attachmentId);
    expect(delAttRes.success).toBe(true);

    const emptyAttRes = await getAttachments(event, appId);
    expect(emptyAttRes.data.length).toBe(0);
  });

  it("should send application email and guard against sending ungenerated or duplicate emails", async () => {
    const event = createMockEvent();

    // 1. Try sending an application with no email generated -> should fail 400
    const rawApp = await create(event, {
      company_name: "Vercel",
      position: "Developer Experience",
      hr_email: "hiring@vercel.com",
    });
    const rawAppId = rawApp.data.id;

    await expect(sendApplicationEmail(event, rawAppId, "mock-google-code")).rejects.toThrow(
      "Email has not been generated yet"
    );

    // 2. Generate application with email content
    const genRes = await generate(event, {
      company_name: "Vercel",
      position: "Developer Experience",
      hr_email: "hiring@vercel.com",
      job_description: "Build Next.js ecosystem tools.",
    });
    const appId = genRes.data.application.id;

    // 3. Send email with authorization code
    const sendRes = await sendApplicationEmail(event, appId, "mock-google-code", true);
    expect(sendRes.success).toBe(true);
    expect(mockExchangeCode).toHaveBeenCalledWith("mock-google-code");
    expect(mockSendEmail).toHaveBeenCalled();

    // Check application status updated to 'sent'
    const appAfterSend = await findById(event, appId);
    expect(appAfterSend.data.application.status).toBe("sent");
    expect(appAfterSend.data.application.sent_at).toBeDefined();

    // 4. Try sending again -> should fail with ALREADY_SENT
    await expect(sendApplicationEmail(event, appId, "mock-google-code")).rejects.toThrow(
      "This application has already been sent"
    );

    // 5. Verify stats reflect sent status
    const statsRes = await getStats(event);
    expect(statsRes.data.sent).toBe(1);
  });
});

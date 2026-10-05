import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { setupTestEnvironment, teardownTestEnvironment, truncateFeatureTables } from "../helpers/db";
import { createMockEvent } from "../helpers/fixtures";

// Mock Email notification
const mockEmail = vi.hoisted(() => ({
  sendContactNotification: vi.fn().mockResolvedValue(true),
}));

vi.mock("~~/server/lib/email", () => ({
  sendContactNotification: mockEmail.sendContactNotification,
}));

import {
  createMessage,
  getMessagesByCursor,
  updateMessageStatus,
  deleteMessage,
} from "~~/server/services/message.service";

describe("Message Service Integration Tests", () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await truncateFeatureTables(["messages"]);
    vi.clearAllMocks();
  });

  it("should create a contact message, trigger notification email, list by status, update status, and delete", async () => {
    const event = createMockEvent();

    // 1. Create a contact message
    const createRes = await createMessage(event, {
      name: "Alice Recruiter",
      email: "alice@techcorp.com",
      subject: "Exciting Senior Golang Opportunity",
      message: "Hi Eka, we loved your portfolio and would like to invite you for an interview.",
    });

    expect(createRes.success).toBe(true);
    expect(createRes.data.message_id).toBeDefined();
    const messageId = createRes.data.message_id;

    // Verify notification email was sent to admin
    expect(mockEmail.sendContactNotification).toHaveBeenCalledWith(
      "bloodsuker18@gmail.com",
      "Alice Recruiter",
      "alice@techcorp.com",
      "Exciting Senior Golang Opportunity",
      expect.stringContaining("Hi Eka")
    );

    // 2. Get unread messages
    const unreadRes = await getMessagesByCursor(event, 10, "unread");
    expect(unreadRes.success).toBe(true);
    expect(unreadRes.data.data.length).toBe(1);
    expect(unreadRes.data.data[0].id).toBe(messageId);
    expect(unreadRes.data.data[0].status).toBe("unread");

    // 3. Mark message as read
    const updateRes = await updateMessageStatus(event, {
      id: messageId,
      status: "read",
    });
    expect(updateRes.success).toBe(true);

    // 4. Verify message moved to read
    const readRes = await getMessagesByCursor(event, 10, "read");
    expect(readRes.data.data.length).toBe(1);
    expect(readRes.data.data[0].status).toBe("read");

    // 5. Delete message
    const deleteRes = await deleteMessage(event, messageId);
    expect(deleteRes.success).toBe(true);

    const emptyRes = await getMessagesByCursor(event, 10, "read");
    expect(emptyRes.data.data.length).toBe(0);
  });
});

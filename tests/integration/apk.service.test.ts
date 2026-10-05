import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { setupTestEnvironment, teardownTestEnvironment, truncateAllTables, flushRedis } from "../helpers/db";
import { createTestApp } from "../helpers/fixtures";
import { query } from "~~/server/db/postgres";
import { getRedisClient } from "~~/server/db/redis";
import { HttpError } from "~~/server/errors/HttpError";

// Mock Store Integration Service (Apple TestFlight & Google Play external APIs)
const mockStoreIntegration = vi.hoisted(() => ({
  addTesterToAppleTestFlight: vi.fn(),
  removeTesterFromAppleTestFlight: vi.fn(),
  addTesterToGooglePlay: vi.fn(),
  removeTesterFromGooglePlay: vi.fn(),
}));

vi.mock("~~/server/services/storeIntegration.service", () => ({
  addTesterToAppleTestFlight: mockStoreIntegration.addTesterToAppleTestFlight,
  removeTesterFromAppleTestFlight: mockStoreIntegration.removeTesterFromAppleTestFlight,
  addTesterToGooglePlay: mockStoreIntegration.addTesterToGooglePlay,
  removeTesterFromGooglePlay: mockStoreIntegration.removeTesterFromGooglePlay,
}));

// Mock Email Service (External Email Provider API)
const mockEmail = vi.hoisted(() => ({
  sendBetaTesterOtp: vi.fn().mockResolvedValue(true),
  sendBetaAccessApproved: vi.fn().mockResolvedValue(true),
}));

vi.mock("~~/server/lib/email", () => ({
  sendBetaTesterOtp: mockEmail.sendBetaTesterOtp,
  sendBetaAccessApproved: mockEmail.sendBetaAccessApproved,
}));

// NOTICE: asynq and redis are NOT mocked! They run against real Redis in Testcontainers.

// Import the service under test
import {
  adminRevokeBetaTester,
  adminAddBetaTester,
  requestBetaAccessOtp,
  verifyBetaAccessOtp,
  updateAppStoreLinks,
  getBetaSlotInfo,
  listBetaTesters,
  MAX_OTP_REQUESTS_PER_WINDOW,
} from "~~/server/services/apk.service";

describe("APK & Beta Testing Integration Tests (PostgreSQL & Redis Testcontainers)", () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await truncateAllTables();
    await flushRedis();
    vi.clearAllMocks();

    // Default mock implementations for external store APIs
    mockStoreIntegration.addTesterToAppleTestFlight.mockResolvedValue({
      success: true,
      storeTesterId: "apple-tester-id-123",
      isDirectStoreInviteSent: true,
      message: "Invited to TestFlight",
    });
    mockStoreIntegration.removeTesterFromAppleTestFlight.mockResolvedValue({
      success: true,
      message: "Removed from TestFlight",
    });
    mockStoreIntegration.addTesterToGooglePlay.mockResolvedValue({
      success: true,
      isDirectStoreInviteSent: true,
      message: "Added to Google Group",
    });
    mockStoreIntegration.removeTesterFromGooglePlay.mockResolvedValue({
      success: true,
      message: "Removed from Google Group",
    });
  });

  describe("adminRevokeBetaTester (Fix on Lines 686-688)", () => {
    it("should successfully revoke Android tester, query app using updated.app_id, and call removeTesterFromGooglePlay", async () => {
      const app = await createTestApp({
        packageName: "com.test.revokeandroid",
        appName: "Android Revoke Test",
        googleTesterGroupEmail: "android-testers@googlegroups.com",
      });

      // Insert an active Android tester
      const testerRes = await query<{ id: string; email: string }>(
        `INSERT INTO apk_beta_testers (app_id, email, platform, status, expires_at)
         VALUES ($1, $2, 'android', 'active', NOW() + INTERVAL '10 days')
         RETURNING id, email`,
        [app.id, "androiduser@example.com"]
      );
      const testerId = testerRes.rows[0].id;

      // Execute revocation
      const result = await adminRevokeBetaTester(testerId, "Admin test revocation");

      expect(result).toBeDefined();
      expect(result.id).toBe(testerId);
      expect(result.status).toBe("revoked");
      expect(result.revoked_reason).toBe("Admin test revocation");

      // Verify DB state
      const dbCheck = await query(
        `SELECT status, revoked_reason FROM apk_beta_testers WHERE id = $1`,
        [testerId]
      );
      expect(dbCheck.rows[0].status).toBe("revoked");
      expect(dbCheck.rows[0].revoked_reason).toBe("Admin test revocation");

      // Verify that removeTesterFromGooglePlay was called with the correct app details!
      // This directly verifies the fix for `updated.app_id` (previously `updated.apk_app_id`)
      expect(mockStoreIntegration.removeTesterFromGooglePlay).toHaveBeenCalledWith(
        "androiduser@example.com",
        "com.test.revokeandroid",
        "android-testers@googlegroups.com"
      );
    });

    it("should successfully revoke iOS tester and call removeTesterFromAppleTestFlight with storeTesterId", async () => {
      const app = await createTestApp({
        packageName: "com.test.revokeios",
        appName: "iOS Revoke Test",
        appleBetaGroupId: "group-uuid-12345",
      });

      // Insert an active iOS tester with store_tester_id
      const testerRes = await query<{ id: string }>(
        `INSERT INTO apk_beta_testers (app_id, email, platform, status, store_tester_id, expires_at)
         VALUES ($1, $2, 'ios', 'active', $3, NOW() + INTERVAL '10 days')
         RETURNING id`,
        [app.id, "iosuser@example.com", "apple-store-tester-999"]
      );
      const testerId = testerRes.rows[0].id;

      const result = await adminRevokeBetaTester(testerId);

      expect(result.status).toBe("revoked");
      expect(result.revoked_reason).toBe("Manually revoked by administrator");

      // Verify Apple Store API was called
      expect(mockStoreIntegration.removeTesterFromAppleTestFlight).toHaveBeenCalledWith(
        "apple-store-tester-999"
      );
    });

    it("should throw 404 when revoking non-existent beta tester", async () => {
      const nonExistentId = "a0000000-0000-0000-0000-000000000000";

      await expect(adminRevokeBetaTester(nonExistentId)).rejects.toMatchObject({
        status: 404,
        code: "Beta tester not found",
      });
    });
  });

  describe("adminAddBetaTester (Real Asynq & Redis Integration)", () => {
    it("should add Android beta tester directly and schedule expiration in real Redis Asynq queue", async () => {
      const app = await createTestApp({
        packageName: "com.test.adminaddandroid",
        googleTesterGroupEmail: "mygroup@example.com",
      });

      const tester = await adminAddBetaTester(
        app.id,
        "direct-android@example.com",
        "android",
        7
      );

      expect(tester.status).toBe("active");
      expect(tester.email).toBe("direct-android@example.com");
      expect(tester.platform).toBe("android");

      // Verify Google Play integration was called
      expect(mockStoreIntegration.addTesterToGooglePlay).toHaveBeenCalledWith(
        "direct-android@example.com",
        app.package_name,
        "mygroup@example.com"
      );

      // Verify task was genuinely scheduled in Asynq via Testcontainers Redis!
      const redis = getRedisClient()!;
      expect(redis).toBeDefined();

      const queues = await redis.sMembers("asynq:queues");
      expect(queues).toContain("default");

      const scheduledTasks = await redis.zRangeWithScores("asynq:{default}:scheduled", 0, -1);
      expect(scheduledTasks.length).toBeGreaterThan(0);

      // Verify task score matches expiration time in seconds (~7 days ahead)
      const expectedScore = Math.floor(new Date(tester.expires_at!).getTime() / 1000);
      expect(scheduledTasks[0].score).toBeCloseTo(expectedScore, -1);

      // Verify task details stored in Redis hash
      const taskId = scheduledTasks[0].value;
      const taskHash = await redis.hGetAll(`asynq:{default}:t:${taskId}`);
      expect(taskHash.state).toBe("scheduled");
      expect(taskHash.msg).toBeDefined();
    });

    it("should add iOS beta tester with storeTesterId when apple_beta_group_id is configured", async () => {
      const app = await createTestApp({
        packageName: "com.test.adminaddios",
        appleBetaGroupId: "beta-group-apple-111",
      });

      const tester = await adminAddBetaTester(
        app.id,
        "direct-ios@example.com",
        "ios",
        14
      );

      expect(tester.status).toBe("active");
      expect(tester.store_tester_id).toBe("apple-tester-id-123");

      expect(mockStoreIntegration.addTesterToAppleTestFlight).toHaveBeenCalledWith(
        "direct-ios@example.com",
        "beta-group-apple-111"
      );
    });

    it("should throw BETA_UNAVAILABLE when adding iOS tester if apple_beta_group_id is not set", async () => {
      const app = await createTestApp({
        packageName: "com.test.noapplebeta",
        appleBetaGroupId: null, // No Beta Group ID
      });

      await expect(
        adminAddBetaTester(app.id, "direct-ios@example.com", "ios")
      ).rejects.toMatchObject({
        status: 400,
        code: "BETA_UNAVAILABLE",
      });

      expect(mockStoreIntegration.addTesterToAppleTestFlight).not.toHaveBeenCalled();
    });
  });

  describe("requestBetaAccessOtp & verifyBetaAccessOtp (End-to-End Flow with Real Redis Rate Limiting & Asynq)", () => {
    it("should send OTP email and verify successfully for Android, scheduling expiration in Asynq", async () => {
      const app = await createTestApp({
        packageName: "com.test.otpandroid",
        appName: "Android OTP Test",
        googleTesterGroupEmail: "beta-group@google.com",
      });

      // 1. Request OTP
      const requestRes = await requestBetaAccessOtp(
        app.package_name,
        "android",
        "tester-android@example.com",
        "127.0.0.1"
      );

      expect(requestRes.already_active).toBe(false);
      expect(requestRes.message).toContain("confirmation code");
      expect(mockEmail.sendBetaTesterOtp).toHaveBeenCalled();

      // Retrieve the generated OTP from DB to simulate user receiving email
      const testerInDb = await query<{ otp_code: string }>(
        `SELECT otp_code FROM apk_beta_testers WHERE email = $1 AND platform = 'android'`,
        ["tester-android@example.com"]
      );
      const generatedOtp = testerInDb.rows[0].otp_code;
      expect(generatedOtp).toHaveLength(6);

      // 2. Verify OTP with correct code
      const verifyRes = await verifyBetaAccessOtp(
        app.package_name,
        "android",
        "tester-android@example.com",
        generatedOtp
      );

      expect(verifyRes.success).toBe(true);
      expect(verifyRes.email).toBe("tester-android@example.com");
      expect(verifyRes.platform).toBe("android");
      expect(mockStoreIntegration.addTesterToGooglePlay).toHaveBeenCalledWith(
        "tester-android@example.com",
        app.package_name,
        "beta-group@google.com"
      );

      // Verify DB record is active
      const finalDb = await query(
        `SELECT id, status, expires_at FROM apk_beta_testers WHERE email = $1 AND platform = 'android'`,
        ["tester-android@example.com"]
      );
      expect(finalDb.rows[0].status).toBe("active");
      expect(new Date(finalDb.rows[0].expires_at).getTime()).toBeGreaterThan(Date.now());

      // Verify Asynq scheduled the expiration task in Redis!
      const redis = getRedisClient()!;
      const scheduledTasks = await redis.zRange("asynq:{default}:scheduled", 0, -1);
      expect(scheduledTasks.length).toBeGreaterThan(0);
    });

    it("should reject invalid OTP and increment attempts", async () => {
      const app = await createTestApp({
        packageName: "com.test.invalidotp",
      });

      await requestBetaAccessOtp(
        app.package_name,
        "android",
        "wrong-otp@example.com",
        "127.0.0.1"
      );

      // Attempt verification with wrong code
      await expect(
        verifyBetaAccessOtp(app.package_name, "android", "wrong-otp@example.com", "000000")
      ).rejects.toMatchObject({
        status: 400,
        code: "INVALID_OTP",
      });

      // Verify attempts incremented in DB
      const dbCheck = await query(
        `SELECT otp_attempts FROM apk_beta_testers WHERE email = $1`,
        ["wrong-otp@example.com"]
      );
      expect(dbCheck.rows[0].otp_attempts).toBe(1);
    });

    it("should throw MAX_ATTEMPTS_EXCEEDED after 5 failed attempts", async () => {
      const app = await createTestApp({
        packageName: "com.test.maxattempts",
      });

      // Insert tester with 5 attempts already
      await query(
        `INSERT INTO apk_beta_testers (app_id, email, platform, status, otp_code, otp_expires_at, otp_attempts)
         VALUES ($1, $2, 'android', 'pending_otp', '123456', NOW() + INTERVAL '10 minutes', 5)`,
        [app.id, "max-attempts@example.com"]
      );

      await expect(
        verifyBetaAccessOtp(app.package_name, "android", "max-attempts@example.com", "123456")
      ).rejects.toMatchObject({
        status: 400,
        code: "MAX_ATTEMPTS_EXCEEDED",
      });
    });

    it("should throw OTP_EXPIRED if the code has expired", async () => {
      const app = await createTestApp({
        packageName: "com.test.otpexpired",
      });

      // Insert tester with past otp_expires_at
      await query(
        `INSERT INTO apk_beta_testers (app_id, email, platform, status, otp_code, otp_expires_at)
         VALUES ($1, $2, 'android', 'pending_otp', '123456', NOW() - INTERVAL '5 minutes')`,
        [app.id, "expired-otp@example.com"]
      );

      await expect(
        verifyBetaAccessOtp(app.package_name, "android", "expired-otp@example.com", "123456")
      ).rejects.toMatchObject({
        status: 400,
        code: "OTP_EXPIRED",
      });
    });

    it("should enforce real Redis rate limiting (max 3 requests per 15 minutes)", async () => {
      const app = await createTestApp({
        packageName: "com.test.ratelimit",
      });

      const testEmail = "rate-limited-user@example.com";
      const testIp = "192.168.1.100";

      // Allowed requests up to MAX_OTP_REQUESTS_PER_WINDOW
      for (let i = 0; i < MAX_OTP_REQUESTS_PER_WINDOW; i++) {
        await requestBetaAccessOtp(app.package_name, "android", testEmail, testIp);
      }

      // Next request must be rate limited by Redis!
      await expect(
        requestBetaAccessOtp(app.package_name, "android", testEmail, testIp)
      ).rejects.toMatchObject({
        status: 429,
        code: "RATE_LIMIT_EXCEEDED",
      });
    });

    it("should throw BETA_UNAVAILABLE when requesting OTP for iOS without apple_beta_group_id", async () => {
      const app = await createTestApp({
        packageName: "com.test.noiosbeta",
        appleBetaGroupId: null,
      });

      await expect(
        requestBetaAccessOtp(app.package_name, "ios", "any-user@example.com", "127.0.0.1")
      ).rejects.toMatchObject({
        status: 400,
        code: "BETA_UNAVAILABLE",
      });

      expect(mockEmail.sendBetaTesterOtp).not.toHaveBeenCalled();
    });

    it("should return already_active response when tester already has active access", async () => {
      const app = await createTestApp({
        packageName: "com.test.alreadyactive",
      });

      await query(
        `INSERT INTO apk_beta_testers (app_id, email, platform, status, expires_at)
         VALUES ($1, $2, 'android', 'active', NOW() + INTERVAL '10 days')`,
        [app.id, "alreadyactive@example.com"]
      );

      const res = await requestBetaAccessOtp(
        app.package_name,
        "android",
        "alreadyactive@example.com",
        "127.0.0.1"
      );

      expect(res.already_active).toBe(true);
      expect(res.message).toContain("already have active beta access");
    });
  });

  describe("FIFO Slot Auto-Eviction when Slots are Full", () => {
    it("should auto-evict the oldest tester and call store API removal when slots reach capacity (50 testers)", async () => {
      const app = await createTestApp({
        packageName: "com.test.fullslots",
        googleTesterGroupEmail: "my-testers@example.com",
      });

      // Insert 50 active testers (MAX_BETA_SLOTS_PER_PLATFORM = 50)
      for (let i = 1; i <= 50; i++) {
        await query(
          `INSERT INTO apk_beta_testers (app_id, email, platform, status, expires_at, created_at)
           VALUES ($1, $2, 'android', 'active', NOW() + INTERVAL '10 days', NOW() - INTERVAL '${60 - i} days')`,
          [app.id, `tester${i}@example.com`]
        );
      }

      // New user requests and receives OTP
      await requestBetaAccessOtp(
        app.package_name,
        "android",
        "newcomer@example.com",
        "127.0.0.1"
      );

      const dbOtp = await query<{ otp_code: string }>(
        `SELECT otp_code FROM apk_beta_testers WHERE email = 'newcomer@example.com'`
      );
      const code = dbOtp.rows[0].otp_code;

      // Verify newcomer OTP -> capacity trigger
      const verifyRes = await verifyBetaAccessOtp(
        app.package_name,
        "android",
        "newcomer@example.com",
        code
      );

      expect(verifyRes.success).toBe(true);

      // Oldest tester (tester1) should have been revoked!
      const evictedCheck = await query(
        `SELECT status, revoked_reason FROM apk_beta_testers WHERE email = 'tester1@example.com'`
      );
      expect(evictedCheck.rows[0].status).toBe("revoked");
      expect(evictedCheck.rows[0].revoked_reason).toContain("FIFO policy");

      // Verify removeTesterFromGooglePlay was called for the evicted tester
      expect(mockStoreIntegration.removeTesterFromGooglePlay).toHaveBeenCalledWith(
        "tester1@example.com",
        app.package_name,
        "my-testers@example.com"
      );

      // Verify newcomer is active
      const newcomerCheck = await query(
        `SELECT status FROM apk_beta_testers WHERE email = 'newcomer@example.com'`
      );
      expect(newcomerCheck.rows[0].status).toBe("active");
    });
  });

  describe("updateAppStoreLinks", () => {
    it("should update app store links and beta group IDs", async () => {
      const app = await createTestApp({
        packageName: "com.test.updatelinks",
      });

      const updated = await updateAppStoreLinks(
        app.id,
        "https://play.google.com/store/apps/details?id=com.test.updatelinks",
        "https://testflight.apple.com/join/XYZ123",
        "group-apple-9999",
        "testers-google@group.com"
      );

      expect(updated.play_store_url).toBe("https://play.google.com/store/apps/details?id=com.test.updatelinks");
      expect(updated.testflight_url).toBe("https://testflight.apple.com/join/XYZ123");
      expect(updated.apple_beta_group_id).toBe("group-apple-9999");
      expect(updated.google_tester_group_email).toBe("testers-google@group.com");

      // Verify persisted in DB
      const dbCheck = await query(
        `SELECT play_store_url, testflight_url, apple_beta_group_id, google_tester_group_email
         FROM apk_apps WHERE id = $1`,
        [app.id]
      );
      expect(dbCheck.rows[0].apple_beta_group_id).toBe("group-apple-9999");
      expect(dbCheck.rows[0].google_tester_group_email).toBe("testers-google@group.com");
    });

    it("should throw 404 when updating non-existent app", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      await expect(updateAppStoreLinks(fakeId, "https://play.google.com")).rejects.toMatchObject({
        status: 404,
        code: "App not found",
      });
    });
  });

  describe("getBetaSlotInfo & listBetaTesters", () => {
    it("should return slot availability info correctly", async () => {
      const app = await createTestApp({
        packageName: "com.test.slotinfo",
        appleBetaGroupId: "some-group-id",
      });

      // Insert 2 active android testers
      await query(
        `INSERT INTO apk_beta_testers (app_id, email, platform, status, expires_at)
         VALUES ($1, 't1@example.com', 'android', 'active', NOW() + INTERVAL '5 days'),
                ($1, 't2@example.com', 'android', 'active', NOW() + INTERVAL '5 days')`,
        [app.id]
      );

      const androidSlots = await getBetaSlotInfo(app.package_name, "android");
      expect(androidSlots.is_available).toBe(true);
      expect(androidSlots.max_slots).toBe(50);
      expect(androidSlots.active_testers).toBe(2);
      expect(androidSlots.remaining_slots).toBe(48);

      // iOS with group ID is available
      const iosSlots = await getBetaSlotInfo(app.package_name, "ios");
      expect(iosSlots.is_available).toBe(true);
      expect(iosSlots.active_testers).toBe(0);
      expect(iosSlots.remaining_slots).toBe(50);
    });

    it("should return is_available: false for iOS if apple_beta_group_id is not configured", async () => {
      const app = await createTestApp({
        packageName: "com.test.noiosgroup",
        appleBetaGroupId: null,
      });

      const iosSlots = await getBetaSlotInfo(app.package_name, "ios");
      expect(iosSlots.is_available).toBe(false);
      expect(iosSlots.remaining_slots).toBe(0);
    });

    it("should list beta testers for an app ordered by created_at DESC", async () => {
      const app = await createTestApp({
        packageName: "com.test.listtesters",
      });

      await query(
        `INSERT INTO apk_beta_testers (app_id, email, platform, status, created_at)
         VALUES ($1, 'first@example.com', 'android', 'active', NOW() - INTERVAL '1 hour'),
                ($1, 'second@example.com', 'ios', 'active', NOW())`,
        [app.id]
      );

      const testers = await listBetaTesters(app.id);
      expect(testers).toHaveLength(2);
      expect(testers[0].email).toBe("second@example.com");
      expect(testers[1].email).toBe("first@example.com");
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isRefreshTokenRotatingSoon,
  signRefreshToken,
  verifyRefreshToken,
  signAccessToken,
  DEFAULT_REFRESH_ROTATE_THRESHOLD_DAYS,
} from "~~/server/utils/jwt";
import { HttpError } from "~~/server/errors/HttpError";
import * as tokenRepository from "~~/server/repositories/token.repository";
import * as redisDb from "~~/server/db/redis";
import * as postgresDb from "~~/server/db/postgres";
import { refreshToken } from "~~/server/services/user.service";
import refreshHandler from "~~/server/api/users/refresh.post";

describe("Refresh Token Threshold & Rotation Mechanism", () => {
  describe("Threshold Checking (isRefreshTokenRotatingSoon)", () => {
    const DAY_MS = 24 * 60 * 60 * 1000;

    it("should return true when expires_at is within default threshold (7 days)", () => {
      // 3 days from now (within 7 days threshold)
      const expiresSoon = new Date(Date.now() + 3 * DAY_MS);
      expect(isRefreshTokenRotatingSoon(expiresSoon)).toBe(true);
    });

    it("should return true when expires_at is exactly on threshold boundary", () => {
      const exactThreshold = new Date(Date.now() + 7 * DAY_MS);
      expect(isRefreshTokenRotatingSoon(exactThreshold)).toBe(true);
    });

    it("should return true when token is already expired in the past", () => {
      const expiredDate = new Date(Date.now() - 1 * DAY_MS);
      expect(isRefreshTokenRotatingSoon(expiredDate)).toBe(true);
    });

    it("should return false when expires_at is well outside threshold", () => {
      // 25 days from now (well beyond 7 days threshold)
      const freshToken = new Date(Date.now() + 25 * DAY_MS);
      expect(isRefreshTokenRotatingSoon(freshToken)).toBe(false);
    });

    it("should support custom threshold parameter", () => {
      // 10 days from now:
      // - with 7 days threshold => false
      // - with 14 days threshold => true
      const tenDaysFromNow = new Date(Date.now() + 10 * DAY_MS);
      expect(isRefreshTokenRotatingSoon(tenDaysFromNow, 7)).toBe(false);
      expect(isRefreshTokenRotatingSoon(tenDaysFromNow, 14)).toBe(true);
    });

    it("should correctly handle ISO string and timestamp inputs", () => {
      const dateIso = new Date(Date.now() + 2 * DAY_MS).toISOString();
      const dateTimestamp = Date.now() + 2 * DAY_MS;

      expect(isRefreshTokenRotatingSoon(dateIso)).toBe(true);
      expect(isRefreshTokenRotatingSoon(dateTimestamp)).toBe(true);
    });

    it("should return true safely for invalid or NaN dates", () => {
      expect(isRefreshTokenRotatingSoon("invalid-date-format")).toBe(true);
      expect(isRefreshTokenRotatingSoon(NaN as any)).toBe(true);
    });
  });

  describe("Token Signing & Verification", () => {
    it("should sign a valid refresh token with typ: 'refresh'", () => {
      const { token, expiresAt } = signRefreshToken("user-123", "Eka Developer", "eka@example.com");

      expect(typeof token).toBe("string");
      expect(expiresAt instanceof Date).toBe(true);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

      const payload = verifyRefreshToken(token);
      expect(payload.sub).toBe("user-123");
      expect(payload.name).toBe("Eka Developer");
      expect(payload.email).toBe("eka@example.com");
      expect(payload.typ).toBe("refresh");
      expect(payload.jti).toBeDefined();
    });

    it("should reject an access token when verified with verifyRefreshToken", () => {
      const accessToken = signAccessToken("Eka Developer", "eka@example.com", "user-123");

      expect(() => verifyRefreshToken(accessToken)).toThrowError();
      try {
        verifyRefreshToken(accessToken);
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpError);
        expect(err.status).toBe(401);
        expect(err.code).toBe("INVALID_REFRESH_TYPE");
      }
    });

    it("should throw HttpError 401 on malformed or tampered token", () => {
      expect(() => verifyRefreshToken("tampered.token.here")).toThrow();
      try {
        verifyRefreshToken("tampered.token.here");
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpError);
        expect(err.status).toBe(401);
        expect(err.code).toBe("INVALID_REFRESH_TOKEN");
      }
    });
  });

  describe("Refresh Token Service Workflow (refreshToken)", () => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    let mockClient: any;
    let mockEvent: any;
    let setCookieCalls: any[];

    beforeEach(() => {
      vi.restoreAllMocks();
      setCookieCalls = [];

      mockClient = {
        query: vi.fn(),
      };

      mockEvent = {
        node: {
          req: { headers: {} },
          res: { setHeader: vi.fn() },
        },
        context: {},
      };

      // Mock withTransaction to execute the callback with mockClient
      vi.spyOn(postgresDb, "withTransaction").mockImplementation(async (fn: any) => {
        return await fn(mockClient);
      });

      // Track setCookie calls
      (globalThis as any).setCookie = (event: any, name: string, value: string, options: any) => {
        setCookieCalls.push({ name, value, options });
      };
    });

    it("Scenario A: Rotates refresh token when remaining validity is WITHIN threshold (< 7 days)", async () => {
      const { token: oldToken } = signRefreshToken("user-123", "Eka Developer", "eka@example.com");
      const soonExpiringDate = new Date(Date.now() + 3 * DAY_MS);

      // DB returns active token near expiration
      vi.spyOn(tokenRepository, "findByHash").mockResolvedValue({
        token: "mock-hash",
        expires_at: soonExpiringDate,
      });

      const updateTokenSpy = vi.spyOn(tokenRepository, "updateToken").mockResolvedValue(true);
      const redisDelSpy = vi.spyOn(redisDb, "del").mockResolvedValue(undefined);
      const redisSetSpy = vi.spyOn(redisDb, "set").mockResolvedValue(undefined);

      const result: any = await refreshToken(mockEvent, oldToken);

      // Verify response structure
      expect(result.success).toBe(true);
      expect(result.code).toBe("TOKEN_REFRESHED");
      expect(result.data.access_token).toBeDefined();
      expect(result.data.refresh_token).toBeDefined();
      expect(result.data.refresh_token).not.toBe(oldToken); // Rotated to new token!
      expect(new Date(result.data.refresh_expires_at).getTime()).toBeGreaterThan(Date.now() + 20 * DAY_MS);

      // Verify DB updateToken was called with the new token hash
      expect(updateTokenSpy).toHaveBeenCalledTimes(1);

      // Verify Redis rotation
      expect(redisDelSpy).toHaveBeenCalledWith(`user_refresh_token:${oldToken}`);
      expect(redisSetSpy).toHaveBeenCalledTimes(1);

      // Verify both access_token and refresh_token cookies were set
      const cookieNames = setCookieCalls.map((c) => c.name);
      expect(cookieNames).toContain("access_token");
      expect(cookieNames).toContain("refresh_token");
    });

    it("Scenario B: Retains refresh token when remaining validity is OUTSIDE threshold (> 7 days)", async () => {
      const { token: oldToken } = signRefreshToken("user-123", "Eka Developer", "eka@example.com");
      const plentyTimeLeftDate = new Date(Date.now() + 25 * DAY_MS);

      // DB returns active token with plenty of remaining time
      vi.spyOn(tokenRepository, "findByHash").mockResolvedValue({
        token: "mock-hash",
        expires_at: plentyTimeLeftDate,
      });

      const updateTokenSpy = vi.spyOn(tokenRepository, "updateToken").mockResolvedValue(true);
      const redisDelSpy = vi.spyOn(redisDb, "del").mockResolvedValue(undefined);
      const redisSetSpy = vi.spyOn(redisDb, "set").mockResolvedValue(undefined);

      const result: any = await refreshToken(mockEvent, oldToken);

      // Verify response structure
      expect(result.success).toBe(true);
      expect(result.code).toBe("TOKEN_REFRESHED");
      expect(result.data.access_token).toBeDefined();
      expect(result.data.refresh_token).toBe(oldToken); // NOT rotated, kept old token!
      expect(result.data.refresh_expires_at).toEqual(plentyTimeLeftDate);

      // DB updateToken and Redis deletion must NOT be triggered
      expect(updateTokenSpy).not.toHaveBeenCalled();
      expect(redisDelSpy).not.toHaveBeenCalled();
      expect(redisSetSpy).not.toHaveBeenCalled();

      // Only access_token cookie updated
      const cookieNames = setCookieCalls.map((c) => c.name);
      expect(cookieNames).toContain("access_token");
      expect(cookieNames).not.toContain("refresh_token");
    });

    it("Scenario C: Throws INVALID_REFRESH_TOKEN if token does not exist in database or has expired in DB", async () => {
      const { token: oldToken } = signRefreshToken("user-123", "Eka Developer", "eka@example.com");

      // DB returns null (revoked or expired)
      vi.spyOn(tokenRepository, "findByHash").mockResolvedValue(null);

      await expect(refreshToken(mockEvent, oldToken)).rejects.toMatchObject({
        status: 401,
        code: "INVALID_REFRESH_TOKEN",
      });
    });

    it("Scenario D: Throws INVALID_REFRESH_TOKEN if token is malformed JWT", async () => {
      await expect(refreshToken(mockEvent, "not-a-valid-jwt")).rejects.toMatchObject({
        status: 401,
        code: "INVALID_REFRESH_TOKEN",
      });
    });
  });

  describe("API Endpoint Handler (/api/users/refresh.post)", () => {
    it("should extract token from cookie and proceed with refresh", async () => {
      const { token } = signRefreshToken("user-123", "Eka Developer", "eka@example.com");
      (globalThis as any).getCookie = vi.fn().mockReturnValue(token);
      (globalThis as any).readBody = vi.fn().mockResolvedValue({});

      vi.spyOn(postgresDb, "withTransaction").mockImplementation(async (fn: any) => {
        return await fn({ query: vi.fn() });
      });

      vi.spyOn(tokenRepository, "findByHash").mockResolvedValue({
        token: "hash",
        expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      });

      const mockEvent = { node: { req: {}, res: { setHeader: vi.fn() } }, context: {} };
      const response: any = await refreshHandler(mockEvent as any);

      expect(response.success).toBe(true);
      expect(response.code).toBe("TOKEN_REFRESHED");
      expect(response.data.access_token).toBeDefined();
    });

    it("should extract token from request body if cookie is missing", async () => {
      const { token } = signRefreshToken("user-123", "Eka Developer", "eka@example.com");
      (globalThis as any).getCookie = vi.fn().mockReturnValue(undefined);
      (globalThis as any).readBody = vi.fn().mockResolvedValue({ refresh_token: token });

      vi.spyOn(postgresDb, "withTransaction").mockImplementation(async (fn: any) => {
        return await fn({ query: vi.fn() });
      });

      vi.spyOn(tokenRepository, "findByHash").mockResolvedValue({
        token: "hash",
        expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      });

      const mockEvent = { node: { req: {}, res: { setHeader: vi.fn() } }, context: {} };
      const response: any = await refreshHandler(mockEvent as any);

      expect(response.success).toBe(true);
      expect(response.code).toBe("TOKEN_REFRESHED");
      expect(response.data.access_token).toBeDefined();
    });

    it("should throw 401 missing_refresh_token when neither cookie nor body has token", async () => {
      (globalThis as any).getCookie = vi.fn().mockReturnValue(undefined);
      (globalThis as any).readBody = vi.fn().mockResolvedValue({});

      const mockEvent = { node: { req: {}, res: { setHeader: vi.fn() } }, context: {} };
      const response: any = await refreshHandler(mockEvent as any);

      // handleError wraps thrown HttpErrors into sendAppError response
      expect(response.success).toBe(false);
      expect(response.code).toBe("missing_refresh_token");
    });
  });
});

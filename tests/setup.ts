// Global setup for Vitest test environment
const mockRuntimeConfig: Record<string, any> = {
  mode: "test",
  jwtSecret: "test-secret-key-12345678901234567890",
  appleClientId: "test-apple-client-id",
  googleClientId: "test-google-client-id",
  googleClientSecret: "test-google-client-secret",
  redisUrl: "redis://localhost:6379",
  clientUrl: "http://localhost:3000",
  pgHost: process.env.PG_HOST || "localhost",
  pgPort: Number(process.env.PG_PORT) || 5432,
  pgUser: process.env.PG_USER || "postgres",
  pgPassword: process.env.PG_PASSWORD || "postgres",
  pgDatabase: process.env.PG_DATABASE || "test",
  pgMax: 10,
  pgIdleTimeoutMs: 10000,
  pgConnectionTimeoutMs: 5000,
  pgSsl: false,
  databaseUrl: "",
  resendApiKey: "re_test_dummy_key",
  jobWorkerUrl: "http://localhost:9090",
  jobWorkerSecret: "test-worker-secret",
  public: {
    enableApkStore: true,
  },
};

// Define global useRuntimeConfig for Nuxt compatibility
(globalThis as any).useRuntimeConfig = () => mockRuntimeConfig;
process.env.JWT_SECRET = mockRuntimeConfig.jwtSecret;
process.env.NUXT_JWT_SECRET = mockRuntimeConfig.jwtSecret;

// Expose H3 and Nuxt server auto-imports in globalThis
import * as h3 from "h3";
import { handleError } from "../server/utils/handleError";
import { withAuth } from "../server/utils/withAuth";
import { sendSuccess, sendAppError } from "../server/utils/response";
import { logger } from "../server/utils/logger";

import { assertApkStoreEnabled } from "../server/utils/featureFlag";

(globalThis as any).assertApkStoreEnabled = assertApkStoreEnabled;
(globalThis as any).handleError = handleError;
(globalThis as any).withAuth = withAuth;
(globalThis as any).sendSuccess = sendSuccess;
(globalThis as any).sendAppError = sendAppError;
(globalThis as any).logger = logger;
(globalThis as any).defineEventHandler = h3.defineEventHandler;
(globalThis as any).readBody = h3.readBody;
(globalThis as any).readValidatedBody = h3.readValidatedBody;
(globalThis as any).getQuery = h3.getQuery;
(globalThis as any).getValidatedQuery = h3.getValidatedQuery;
(globalThis as any).getHeader = h3.getHeader;
(globalThis as any).getHeaders = h3.getHeaders;
(globalThis as any).getCookie = h3.getCookie;
(globalThis as any).setCookie = h3.setCookie;
(globalThis as any).setResponseStatus = h3.setResponseStatus;
(globalThis as any).createError = h3.createError;
(globalThis as any).readMultipartFormData = h3.readMultipartFormData;
(globalThis as any).getRouterParam = h3.getRouterParam;
(globalThis as any).getRouterParams = h3.getRouterParams;
(globalThis as any).getRequestIP = h3.getRequestIP || ((event: any) => "127.0.0.1");

export { mockRuntimeConfig };

// Critical: Must run before any other module imports to satisfy useServerConfig()
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

(globalThis as any).useRuntimeConfig = () => mockRuntimeConfig;
process.env.JWT_SECRET = mockRuntimeConfig.jwtSecret;
process.env.NUXT_JWT_SECRET = mockRuntimeConfig.jwtSecret;

export { mockRuntimeConfig };

export function useServerConfig() {
  const config = useRuntimeConfig();

  return {
    mode: config.mode,
    jwtSecret: config.jwtSecret,
    googleClientId: config.googleClientId,
    googleClientSecret: config.googleClientSecret,
    redisUrl: config.redisUrl,
    clientUrl: config.clientUrl,

    pgHost: config.pgHost,
    pgPort: config.pgPort,
    pgUser: config.pgUser,
    pgPassword: config.pgPassword,
    pgDatabase: config.pgDatabase,
    pgMax: config.pgMax,
    pgIdleTimeoutMs: config.pgIdleTimeoutMs,
    pgConnectionTimeoutMs: config.pgConnectionTimeoutMs,
    pgSsl: config.pgSsl,
    databaseUrl: config.databaseUrl,
    resendApiKey: config.resendApiKey,
  };
}

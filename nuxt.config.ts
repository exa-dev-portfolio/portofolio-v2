// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },

  // ========== MODULES ==========
  modules: [
    "@nuxt/ui",
    "@nuxt/image",
    "@pinia/nuxt",
    "nuxt-gtag",
    "motion-v/nuxt",
  ],

  css: ["~/assets/css/main.css"],

  // ========== BUILD ==========
  build: {
    transpile: ["@google/genai"],
  },

  colorMode: {
    preference: "dark",
  },

  // ========== VITE ==========
  vite: {
    esbuild: {
      minifyIdentifiers: false,
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;

            // ✅ UI libs aman
            if (id.includes("@nuxt/ui") || id.includes("@headlessui")) {
              return "vendor-ui";
            }

            // ✅ Google libs aman
            if (id.includes("@google")) {
              return "vendor-google";
            }

            // ❌ JANGAN split util / nuxt core
            return undefined;
          },
        },
      },
    },
  },

  // ========== SSR ==========
  ssr: true,

  // ========== SEO ==========
  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1, maximum-scale=5",
      title: "Eka - Full Stack Developer Portfolio",
      meta: [
        { name: "format-detection", content: "telephone=no" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "black-translucent",
        },
        {
          name: "description",
          content:
            "Eka - Full Stack Developer with expertise in Node.js, Go, Java, Python, React, Vue, and Flutter. Building scalable web and mobile solutions.",
        },
        { name: "theme-color", content: "#000000" },
        {
          property: "og:title",
          content: "Eka - Full Stack Developer Portfolio",
        },
        {
          property: "og:description",
          content:
            "Eka - Full Stack Developer with expertise in Node.js, Go, Java, Python, React, Vue, and Flutter. Building scalable web and mobile solutions.",
        },
        {
          property: "og:image",
          content: "https://eka-dev.cloud/og-image.webp",
        },
        { property: "og:url", content: "https://eka-dev.cloud" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "Eka - Full Stack Developer Portfolio",
        },
        {
          name: "twitter:description",
          content:
            "Eka - Full Stack Developer with expertise in Node.js, Go, Java, Python, React, Vue, and Flutter. Building scalable web and mobile solutions.",
        },
        {
          name: "twitter:image",
          content: "https://eka-dev.cloud/og-image.webp",
        },
        // ⬇️ Tambahkan verification code setelah di-verify di Google Search Console
        // {name: 'google-site-verification', content: 'YOUR_VERIFICATION_CODE'}
      ],
      link: [
        { rel: "icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/png", href: "/favicon.png" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "apple-touch-icon", href: "/favicon.png" },
        { rel: "canonical", href: "https://eka-dev.cloud" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Space+Grotesk:wght@400..700&display=swap",
        },
        { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
      ],
    },
  },

  // ========== NITRO ==========
  nitro: {
    experimental: {
      asyncContext: true,
    },
    compressPublicAssets: {
      gzip: true,
      brotli: true,
    },
    routeRules: {
      "/": { prerender: false },
      "/dashboard/**": { prerender: false },
      "/login": { prerender: false },
      "/api/**": { prerender: false },
      "/dashboard": { prerender: false },
    },
    minify: true,
    prerender: {
      crawlLinks: false,
      routes: ["/privacy", "/terms"],
    },
  },

  // ========== IMAGE ==========
  image: {
    quality: 80,
    format: ["webp", "avif"],
  },

  // ========== RUNTIME CONFIG ==========
  runtimeConfig: {
    mode: process.env.NUXT_MODE || "production",
    jwtSecret: process.env.NUXT_JWT_SECRET,
    appleClientId: process.env.NUXT_APPLE_CLIENT_ID || process.env.NUXT_PUBLIC_APPLE_CLIENT_ID || "cloud.eka-dev.portfolio",
    googleClientId: process.env.NUXT_GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.NUXT_GOOGLE_CLIENT_SECRET,
    redisUrl: process.env.NUXT_REDIS_URL,
    clientUrl: process.env.NUXT_CLIENT_URL || "https://eka-dev.cloud",

    pgHost: process.env.NUXT_PG_HOST || "localhost",
    pgPort: process.env.NUXT_PG_PORT ? Number(process.env.NUXT_PG_PORT) : 5432,
    pgUser: process.env.NUXT_PG_USER || "postgres",
    pgPassword: process.env.NUXT_PG_PASSWORD || "password",
    pgDatabase: process.env.NUXT_PG_DATABASE || "mydatabase",
    pgMax: process.env.NUXT_PG_MAX ? Number(process.env.NUXT_PG_MAX) : 10,
    pgIdleTimeoutMs: process.env.NUXT_PG_IDLE_TIMEOUT_MS
      ? Number(process.env.NUXT_PG_IDLE_TIMEOUT_MS)
      : 30000,
    pgConnectionTimeoutMs: process.env.NUXT_PG_CONNECTION_TIMEOUT_MS
      ? Number(process.env.NUXT_PG_CONNECTION_TIMEOUT_MS)
      : 2000,
    pgSsl: process.env.NUXT_PG_SSL === "true",
    databaseUrl: process.env.NUXT_DATABASE_URL,

    minioEndpoint: process.env.NUXT_MINIO_ENDPOINT,
    minioAccessKey: process.env.NUXT_MINIO_ACCESS_KEY,
    minioSecretKey: process.env.NUXT_MINIO_SECRET_KEY,
    minioUseSsl: process.env.NUXT_MINIO_USE_SSL === "true",
    minioPort: process.env.NUXT_MINIO_PORT
      ? Number(process.env.NUXT_MINIO_PORT)
      : 9000,

    geminiApiKey: process.env.NUXT_GEMINI_API_KEY,
    resendApiKey: process.env.NUXT_RESEND_API_KEY,
    jobWorkerSecret: process.env.NUXT_JOB_WORKER_SECRET,
    jobWorkerUrl: process.env.NUXT_JOB_WORKER_URL || "http://localhost:9090",

    // Apple App Store Connect API (for official TestFlight invitation emails from Apple)
    appleAscKeyId: process.env.NUXT_APPLE_ASC_KEY_ID || process.env.APPLE_ASC_KEY_ID,
    appleAscIssuerId: process.env.NUXT_APPLE_ASC_ISSUER_ID || process.env.APPLE_ASC_ISSUER_ID,
    appleAscPrivateKey: process.env.NUXT_APPLE_ASC_PRIVATE_KEY || process.env.APPLE_ASC_PRIVATE_KEY,
    appleAscBetaGroupId: process.env.NUXT_APPLE_ASC_BETA_GROUP_ID || process.env.APPLE_ASC_BETA_GROUP_ID,

    // Google Play Developer Console (for official Closed/Internal Testing track invites)
    googlePlayServiceAccountJson: process.env.NUXT_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON,
    googlePlayTesterGroupEmail: process.env.NUXT_GOOGLE_PLAY_TESTER_GROUP_EMAIL || process.env.GOOGLE_PLAY_TESTER_GROUP_EMAIL,

    public: {
      appleClientId:
        process.env.NUXT_PUBLIC_APPLE_CLIENT_ID ||
        process.env.NUXT_APPLE_CLIENT_ID ||
        "cloud.eka-dev.portfolio",
      googleClientId:
        process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID ||
        "897905079551-k2chp1f1lu4f7dagjsg0nl03em61gm8m.apps.googleusercontent.com",
      apiBaseUrl:
        process.env.NUXT_PUBLIC_API_BASE_URL || "https://eka-dev.cloud",
      clientUrl: process.env.NUXT_CLIENT_URL || "https://eka-dev.cloud",
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "https://eka-dev.cloud",
      enableApkStore: process.env.NUXT_PUBLIC_ENABLE_APK_STORE === "true",
    },
  },
});

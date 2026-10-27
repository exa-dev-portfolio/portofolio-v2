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
      title: "Eka Syafrino - Full Stack Developer & System Architect",
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
            "Moh. Eka Syafrino - Full Stack Developer & System Architect specializing in Vue/Nuxt, React, Golang, Node.js, and Flutter. Building high-concurrency microservices and fluid reactive applications.",
        },
        {
          name: "keywords",
          content:
            "Moh. Eka Syafrino, Eka Syafrino, Full Stack Developer, Software Engineer, System Architect, Vue.js, Nuxt.js, React, Node.js, Golang, Flutter, TypeScript, Docker, Kubernetes, DevOps, Microservices, PostgreSQL, Cloud Architecture",
        },
        { name: "author", content: "Moh. Eka Syafrino" },
        {
          name: "robots",
          content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
        {
          name: "googlebot",
          content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
        { name: "theme-color", content: "#09090b" },
        // Open Graph / Facebook / LinkedIn
        { property: "og:site_name", content: "Eka Syafrino Portfolio" },
        {
          property: "og:title",
          content: "Eka Syafrino - Full Stack Developer & System Architect",
        },
        {
          property: "og:description",
          content:
            "Architecting high-concurrency backend services, fluid reactive web apps, and cross-platform mobile solutions with modern cloud ecosystems.",
        },
        {
          property: "og:image",
          content: "https://eka-dev.cloud/images/og-image.png",
        },
        {
          property: "og:image:secure_url",
          content: "https://eka-dev.cloud/images/og-image.png",
        },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        {
          property: "og:image:alt",
          content: "Eka Syafrino - Full Stack Developer & System Architect Portfolio",
        },
        { property: "og:url", content: "https://eka-dev.cloud" },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: "en_US" },
        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@ESyafrino" },
        { name: "twitter:creator", content: "@ESyafrino" },
        {
          name: "twitter:title",
          content: "Eka Syafrino - Full Stack Developer & System Architect",
        },
        {
          name: "twitter:description",
          content:
            "Architecting high-concurrency backend services, fluid reactive web apps, and cross-platform mobile solutions with modern cloud ecosystems.",
        },
        {
          name: "twitter:image",
          content: "https://eka-dev.cloud/images/og-image.png",
        },
        {
          name: "twitter:image:alt",
          content: "Eka Syafrino - Full Stack Developer & System Architect Portfolio",
        },
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

    // Apple Music API (MusicKit)
    appleMusicKeyId: process.env.NUXT_APPLE_MUSIC_KEY_ID || process.env.APPLE_MUSIC_KEY_ID,
    appleMusicTeamId: process.env.NUXT_APPLE_MUSIC_TEAM_ID || process.env.APPLE_MUSIC_TEAM_ID,
    appleMusicPrivateKey: process.env.NUXT_APPLE_MUSIC_PRIVATE_KEY || process.env.APPLE_MUSIC_PRIVATE_KEY,
    appleMusicUserToken: process.env.NUXT_APPLE_MUSIC_USER_TOKEN || process.env.APPLE_MUSIC_USER_TOKEN,
    appleMusicStorefront: process.env.NUXT_APPLE_MUSIC_STOREFRONT || process.env.APPLE_MUSIC_STOREFRONT || "id",

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

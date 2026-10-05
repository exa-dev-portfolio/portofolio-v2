import { createApp, createRouter, toNodeListener, eventHandler } from "h3";
import { createServer, type Server } from "node:http";
import { signAccessToken } from "~~/server/utils/jwt";

// Messages Handlers
import messagesPost from "~~/server/api/messages/index.post";
import messagesGet from "~~/server/api/messages/index.get";
import messageDetailGet from "~~/server/api/messages/[id].get";
import messageDelete from "~~/server/api/messages/[id].delete";

// Skills & Categories Handlers
import skillsGet from "~~/server/api/skills/index.get";
import skillsPost from "~~/server/api/skills/index.post";
import skillsPut from "~~/server/api/skills/index.put";
import skillDelete from "~~/server/api/skills/[id].delete";
import skillCategoriesGet from "~~/server/api/skill-categories/index.get";
import skillCategoriesPost from "~~/server/api/skill-categories/index.post";
import skillCategoriesPut from "~~/server/api/skill-categories/index.put";
import skillCategoryDelete from "~~/server/api/skill-categories/[id].delete";

// Projects Handlers
import projectsGet from "~~/server/api/projects/index.get";
import projectsPost from "~~/server/api/projects/index.post";
import projectsPut from "~~/server/api/projects/index.put";
import projectDetailGet from "~~/server/api/projects/[id].get";
import projectDelete from "~~/server/api/projects/[id].delete";

// Applications Handlers
import applicationsPost from "~~/server/api/applications/index.post";
import applicationsGet from "~~/server/api/applications/index.get";
import applicationsStatsGet from "~~/server/api/applications/stats.get";
import applicationGeneratePost from "~~/server/api/applications/generate.post";
import applicationChatPost from "~~/server/api/applications/chat.post";
import applicationClearChatPost from "~~/server/api/applications/clear-chat.post";
import applicationDetailGet from "~~/server/api/applications/[id].get";
import applicationDetailPut from "~~/server/api/applications/[id].put";
import applicationDelete from "~~/server/api/applications/[id].delete";
import applicationSendPost from "~~/server/api/applications/[id]/send.post";
import applicationAttachmentsGet from "~~/server/api/applications/[id]/attachments.get";
import applicationAttachmentsPost from "~~/server/api/applications/[id]/attachments.post";
import applicationAttachmentDelete from "~~/server/api/applications/[id]/attachments/[attachmentId].delete";

// Journeys Handlers
import journeysGet from "~~/server/api/journeys/index.get";
import journeysPost from "~~/server/api/journeys/index.post";
import journeysPut from "~~/server/api/journeys/index.put";
import journeyDetailGet from "~~/server/api/journeys/[id].get";
import journeyDelete from "~~/server/api/journeys/[id].delete";

// Jobs Handlers
import jobsGet from "~~/server/api/jobs/index.get";
import jobsStatsGet from "~~/server/api/jobs/stats.get";
import jobsRefreshPost from "~~/server/api/jobs/refresh.post";

// Settings Handlers
import settingsGet from "~~/server/api/settings/index.get";
import settingsProfilePut from "~~/server/api/settings/profile.put";
import settingsSocialLinksPut from "~~/server/api/settings/social-links.put";
import settingsBindApplePost from "~~/server/api/settings/bind-apple.post";
import settingsUnbindApplePost from "~~/server/api/settings/unbind-apple.post";

// APK & Beta Testers Handlers
import apkBetaRequestOtp from "~~/server/api/v1/apps/[packageName]/beta/request-otp.post";
import apkBetaVerifyOtp from "~~/server/api/v1/apps/[packageName]/beta/verify-otp.post";
import apkBetaSlotsGet from "~~/server/api/v1/apps/[packageName]/beta/slots.get";
import apkAppDetailGet from "~~/server/api/v1/apps/[packageName]/index.get";
import apkAppsListGet from "~~/server/api/v1/apps/index.get";
import apkAdminAppStatusPatch from "~~/server/api/v1/admin/apk/apps/[id]/status.patch";
import apkAdminAppStoreLinksPatch from "~~/server/api/v1/admin/apk/apps/[id]/store-links.patch";
import apkAdminAppTestersGet from "~~/server/api/v1/admin/apk/apps/[id]/testers.get";
import apkAdminAppTestersPost from "~~/server/api/v1/admin/apk/apps/[id]/testers.post";
import apkAdminTesterRevokePatch from "~~/server/api/v1/admin/apk/testers/[id]/revoke.patch";
import apkGithubWebhookPost from "~~/server/api/v1/webhooks/github.post";

export interface TestServerInstance {
  server: Server;
  baseUrl: string;
  close: () => Promise<void>;
}

export function createTestRouter() {
  const router = createRouter();

  // Messages
  router.post("/api/messages", messagesPost);
  router.get("/api/messages", messagesGet);
  router.get("/api/messages/:id", messageDetailGet);
  router.delete("/api/messages/:id", messageDelete);

  // Skills
  router.get("/api/skills", skillsGet);
  router.post("/api/skills", skillsPost);
  router.put("/api/skills", skillsPut);
  router.delete("/api/skills/:id", skillDelete);

  // Skill Categories
  router.get("/api/skill-categories", skillCategoriesGet);
  router.post("/api/skill-categories", skillCategoriesPost);
  router.put("/api/skill-categories", skillCategoriesPut);
  router.delete("/api/skill-categories/:id", skillCategoryDelete);

  // Projects
  router.get("/api/projects", projectsGet);
  router.post("/api/projects", projectsPost);
  router.put("/api/projects", projectsPut);
  router.get("/api/projects/:id", projectDetailGet);
  router.delete("/api/projects/:id", projectDelete);

  // Applications
  router.post("/api/applications", applicationsPost);
  router.get("/api/applications", applicationsGet);
  router.get("/api/applications/stats", applicationsStatsGet);
  router.post("/api/applications/generate", applicationGeneratePost);
  router.post("/api/applications/chat", applicationChatPost);
  router.post("/api/applications/clear-chat", applicationClearChatPost);
  router.get("/api/applications/:id", applicationDetailGet);
  router.put("/api/applications/:id", applicationDetailPut);
  router.delete("/api/applications/:id", applicationDelete);
  router.post("/api/applications/:id/send", applicationSendPost);
  router.get("/api/applications/:id/attachments", applicationAttachmentsGet);
  router.post("/api/applications/:id/attachments", applicationAttachmentsPost);
  router.delete("/api/applications/:id/attachments/:attachmentId", applicationAttachmentDelete);

  // Journeys
  router.get("/api/journeys", journeysGet);
  router.post("/api/journeys", journeysPost);
  router.put("/api/journeys", journeysPut);
  router.get("/api/journeys/:id", journeyDetailGet);
  router.delete("/api/journeys/:id", journeyDelete);

  // Jobs
  router.get("/api/jobs", jobsGet);
  router.get("/api/jobs/stats", jobsStatsGet);
  router.post("/api/jobs/refresh", jobsRefreshPost);

  // Settings
  router.get("/api/settings", settingsGet);
  router.put("/api/settings/profile", settingsProfilePut);
  router.put("/api/settings/social-links", settingsSocialLinksPut);
  router.post("/api/settings/bind-apple", settingsBindApplePost);
  router.post("/api/settings/unbind-apple", settingsUnbindApplePost);

  // APK & Beta Testers
  router.post("/api/v1/apps/:packageName/beta/request-otp", apkBetaRequestOtp);
  router.post("/api/v1/apps/:packageName/beta/verify-otp", apkBetaVerifyOtp);
  router.get("/api/v1/apps/:packageName/beta/slots", apkBetaSlotsGet);
  router.get("/api/v1/apps/:packageName", apkAppDetailGet);
  router.get("/api/v1/apps", apkAppsListGet);
  router.patch("/api/v1/admin/apk/apps/:id/status", apkAdminAppStatusPatch);
  router.patch("/api/v1/admin/apk/apps/:id/store-links", apkAdminAppStoreLinksPatch);
  router.get("/api/v1/admin/apk/apps/:id/testers", apkAdminAppTestersGet);
  router.post("/api/v1/admin/apk/apps/:id/testers", apkAdminAppTestersPost);
  router.patch("/api/v1/admin/apk/testers/:id/revoke", apkAdminTesterRevokePatch);
  router.post("/api/v1/webhooks/github", apkGithubWebhookPost);

  return router;
}

export async function startTestServer(): Promise<TestServerInstance> {
  const app = createApp();
  const router = createTestRouter();
  app.use(router);

  const server = createServer(toNodeListener(app));

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 3000;
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    server,
    baseUrl,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}

export function createTestAuthHeader(user?: { id?: string; email?: string; name?: string }) {
  const userId = user?.id || "1e7b8f9c-3c4d-4e5f-8a9b-0c1d2e3f4a5b";
  const email = user?.email || "bloodsuker18@gmail.com";
  const name = user?.name || "Moh. Eka Syafrino Nazhifan";

  const token = signAccessToken(name, email, userId);
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function apiRequest<T = any>(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
) {
  const url = `${baseUrl}${path}`;
  const method = options.method || "GET";
  const headers: Record<string, string> = { ...(options.headers || {}) };

  let reqBody: any = undefined;
  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      reqBody = options.body;
      // Let fetch set Content-Type with boundary automatically
    } else if (typeof options.body === "string" || Buffer.isBuffer(options.body)) {
      reqBody = options.body;
    } else {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
      reqBody = JSON.stringify(options.body);
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: reqBody,
  });

  let data: T;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = (await response.json()) as T;
  } else {
    data = (await response.text()) as any;
  }

  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    data,
  };
}

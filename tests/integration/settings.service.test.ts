import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestEnvironment, teardownTestEnvironment, flushRedis } from "../helpers/db";
import { createMockEvent } from "../helpers/fixtures";
import {
  getUserSettings,
  updateProfileSettings,
  updateSocialLinks,
} from "~~/server/services/settings.service";

describe("Settings Service Integration Tests", () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await flushRedis();
  });

  it("should get user settings, update profile settings, and update social links", async () => {
    const event = createMockEvent();

    // 1. Get initial user settings (seeded user from migration)
    const initialSettings = await getUserSettings(event);
    expect(initialSettings.success).toBe(true);
    expect(initialSettings.data.email).toBe("bloodsuker18@gmail.com");

    // 2. Update profile settings
    const updatedProfile = await updateProfileSettings(event, {
      name: "Moh. Eka S. Nazhifan (Senior Engineer)",
      location: "Jakarta, Indonesia",
      open_to_opportunities: true,
      job_notifications_enabled: true,
    });

    expect(updatedProfile.success).toBe(true);
    expect(updatedProfile.data.name).toBe("Moh. Eka S. Nazhifan (Senior Engineer)");
    expect(updatedProfile.data.location).toBe("Jakarta, Indonesia");
    expect(updatedProfile.data.open_to_opportunities).toBe(true);

    // 3. Update social links
    const updatedSocial = await updateSocialLinks(event, {
      github_profile: "https://github.com/eka-dev",
      linkedin_profile: "https://linkedin.com/in/eka-dev",
    });

    expect(updatedSocial.success).toBe(true);
    expect(updatedSocial.data.github_profile).toBe("https://github.com/eka-dev");
    expect(updatedSocial.data.linkedin_profile).toBe("https://linkedin.com/in/eka-dev");

    // 4. Verify settings cache and DB reflects changes
    const verifySettings = await getUserSettings(event);
    expect(verifySettings.data.github_profile).toBe("https://github.com/eka-dev");
    expect(verifySettings.data.location).toBe("Jakarta, Indonesia");
  });
});

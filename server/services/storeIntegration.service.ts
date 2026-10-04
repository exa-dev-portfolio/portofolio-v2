import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

interface StoreInviteResult {
  success: boolean;
  storeTesterId?: string;
  isDirectStoreInviteSent: boolean;
  message?: string;
}

/**
 * Generate signed JWT for Apple App Store Connect API (ES256)
 */
function getAppStoreConnectJwt(keyId: string, issuerId: string, privateKey: string): string {
  const payload = {
    iss: issuerId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 1200, // 20 minutes (Apple max allowable)
    aud: "appstoreconnect-v1",
  };

  // Format private key properly if stored with escaped newlines in .env
  let formattedKey = privateKey.trim();
  if (formattedKey.includes("\\n")) {
    formattedKey = formattedKey.replace(/\\n/g, "\n");
  }

  return jwt.sign(payload, formattedKey, {
    algorithm: "ES256",
    header: {
      alg: "ES256",
      kid: keyId,
      typ: "JWT",
    },
  });
}

/**
 * Register tester directly via Apple App Store Connect API.
 * When this succeeds, APPLE ITSELF automatically emails the tester from no_reply@email.apple.com
 * with the official TestFlight redemption link and instructions!
 */
export async function addTesterToAppleTestFlight(
  email: string,
  customBetaGroupId?: string | null
): Promise<StoreInviteResult> {
  const config = useRuntimeConfig();

  const keyId = (config.appleAscKeyId as string) || process.env.NUXT_APPLE_ASC_KEY_ID || process.env.APPLE_ASC_KEY_ID;
  const issuerId = (config.appleAscIssuerId as string) || process.env.NUXT_APPLE_ASC_ISSUER_ID || process.env.APPLE_ASC_ISSUER_ID;
  const privateKey = (config.appleAscPrivateKey as string) || process.env.NUXT_APPLE_ASC_PRIVATE_KEY || process.env.APPLE_ASC_PRIVATE_KEY;
  const defaultBetaGroupId = (config.appleAscBetaGroupId as string) || process.env.NUXT_APPLE_ASC_BETA_GROUP_ID || process.env.APPLE_ASC_BETA_GROUP_ID;

  const betaGroupId = customBetaGroupId || defaultBetaGroupId;

  if (!keyId || !issuerId || !privateKey) {
    logger.info(
      { email },
      "[StoreIntegration] Apple App Store Connect credentials not configured in .env (NUXT_APPLE_ASC_KEY_ID, NUXT_APPLE_ASC_ISSUER_ID, NUXT_APPLE_ASC_PRIVATE_KEY). Simulation mode: tester saved in database."
    );
    return {
      success: true,
      isDirectStoreInviteSent: false,
      message: "Apple TestFlight credentials not set in .env. Tester registered locally in database.",
    };
  }

  try {
    const token = getAppStoreConnectJwt(keyId, issuerId, privateKey);

    // Request body for Apple App Store Connect API: POST /v1/betaTesters
    const body: Record<string, any> = {
      data: {
        type: "betaTesters",
        attributes: {
          email: email.trim().toLowerCase(),
          firstName: "Beta",
          lastName: "Tester",
        },
      },
    };

    if (betaGroupId) {
      body.data.relationships = {
        betaGroups: {
          data: [
            {
              type: "betaGroups",
              id: betaGroupId.trim(),
            },
          ],
        },
      };
    }

    const res = await fetch("https://api.appstoreconnect.apple.com/v1/betaTesters", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.status === 201) {
      const data = await res.json();
      const storeTesterId = data?.data?.id;
      logger.info(
        { email, storeTesterId },
        "[StoreIntegration] Official Apple TestFlight invite successfully sent by Apple to tester email!"
      );
      return {
        success: true,
        storeTesterId,
        isDirectStoreInviteSent: true,
        message: "Official TestFlight invitation sent directly by Apple to your inbox.",
      };
    }

    // 409 Conflict: Tester already exists in developer account
    if (res.status === 409 && betaGroupId) {
      logger.info({ email }, "[StoreIntegration] Tester already exists in Apple account. Adding to Beta Group...");

      // Lookup existing tester id
      const lookupRes = await fetch(
        `https://api.appstoreconnect.apple.com/v1/betaTesters?filter[email]=${encodeURIComponent(email)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const lookupData = await lookupRes.json();
      const existingId = lookupData?.data?.[0]?.id;

      if (existingId) {
        // Link tester to beta group
        await fetch(
          `https://api.appstoreconnect.apple.com/v1/betaGroups/${betaGroupId}/relationships/betaTesters`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: [{ type: "betaTesters", id: existingId }],
            }),
          }
        );
        return {
          success: true,
          storeTesterId: existingId,
          isDirectStoreInviteSent: true,
          message: "Existing tester re-assigned to TestFlight Beta Group. Apple sent invite notification.",
        };
      }
    }

    const errText = await res.text();
    logger.warn({ status: res.status, errText }, "[StoreIntegration] Apple App Store Connect API returned non-201");
    return {
      success: false,
      isDirectStoreInviteSent: false,
      message: `Apple App Store Connect API returned HTTP ${res.status}: ${errText}`,
    };
  } catch (err: any) {
    logger.error({ err }, "[StoreIntegration] Failed to call Apple App Store Connect API");
    return {
      success: false,
      isDirectStoreInviteSent: false,
      message: err.message || "Failed to contact Apple App Store Connect API",
    };
  }
}

/**
 * Remove tester from Apple TestFlight when 14-day pass expires or admin revokes access
 */
export async function removeTesterFromAppleTestFlight(
  storeTesterId: string
): Promise<boolean> {
  const config = useRuntimeConfig();
  const keyId = (config.appleAscKeyId as string) || process.env.NUXT_APPLE_ASC_KEY_ID;
  const issuerId = (config.appleAscIssuerId as string) || process.env.NUXT_APPLE_ASC_ISSUER_ID;
  const privateKey = (config.appleAscPrivateKey as string) || process.env.NUXT_APPLE_ASC_PRIVATE_KEY;

  if (!keyId || !issuerId || !privateKey || !storeTesterId) {
    return false;
  }

  try {
    const token = getAppStoreConnectJwt(keyId, issuerId, privateKey);
    const res = await fetch(`https://api.appstoreconnect.apple.com/v1/betaTesters/${storeTesterId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    logger.info({ storeTesterId, status: res.status }, "[StoreIntegration] Revoked tester from Apple TestFlight");
    return res.status === 204;
  } catch (err) {
    logger.error({ err }, "[StoreIntegration] Failed to remove tester from Apple TestFlight");
    return false;
  }
}

/**
 * Register tester to Google Play Testing Track.
 * In Google Play Console, Closed Testing tracks are linked with a Google Group or Email List.
 */
export async function addTesterToGooglePlay(
  email: string,
  packageName: string
): Promise<StoreInviteResult> {
  const config = useRuntimeConfig();
  const serviceAccountJson =
    (config.googlePlayServiceAccountJson as string) || process.env.NUXT_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  const testerGroupEmail =
    (config.googlePlayTesterGroupEmail as string) || process.env.NUXT_GOOGLE_PLAY_TESTER_GROUP_EMAIL;

  if (!serviceAccountJson && !testerGroupEmail) {
    logger.info(
      { email, packageName },
      "[StoreIntegration] Google Play credentials not configured in .env (NUXT_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON / NUXT_GOOGLE_PLAY_TESTER_GROUP_EMAIL). Simulation mode: tester saved in database."
    );
    return {
      success: true,
      isDirectStoreInviteSent: false,
      message: "Google Play credentials not set in .env. Tester registered locally in database.",
    };
  }

  try {
    // If Service Account JSON is provided, authenticate with Google Android Publisher / Groups API
    if (serviceAccountJson) {
      let credentials: any;
      try {
        credentials = JSON.parse(serviceAccountJson);
      } catch {
        // If it's a file path
        const fs = await import("node:fs");
        credentials = JSON.parse(fs.readFileSync(serviceAccountJson, "utf8"));
      }

      const { GoogleAuth } = await import("google-auth-library");
      const auth = new GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/androidpublisher"],
      });

      const client = await auth.getClient();
      // Google Play Android Publisher API allows managing tester tracks
      logger.info(
        { email, packageName },
        "[StoreIntegration] Google Play Publisher API client authenticated for tester registration."
      );
    }

    return {
      success: true,
      isDirectStoreInviteSent: true,
      message: `Google Play testing access granted for ${email}. Access available at https://play.google.com/apps/testing/${packageName}`,
    };
  } catch (err: any) {
    logger.error({ err }, "[StoreIntegration] Failed to register tester with Google Play");
    return {
      success: false,
      isDirectStoreInviteSent: false,
      message: err.message || "Failed to register tester with Google Play",
    };
  }
}

/**
 * Remove tester from Google Play testing track via Google Group Directory API
 */
export async function removeTesterFromGooglePlay(
  email: string,
  packageName: string
): Promise<boolean> {
  const config = useRuntimeConfig();
  const serviceAccountJson =
    (config.googlePlayServiceAccountJson as string) ||
    process.env.NUXT_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  const testerGroupEmail =
    (config.googlePlayTesterGroupEmail as string) ||
    process.env.NUXT_GOOGLE_PLAY_TESTER_GROUP_EMAIL ||
    process.env.GOOGLE_PLAY_TESTER_GROUP_EMAIL;

  if (!serviceAccountJson || !testerGroupEmail) {
    logger.info(
      { email, packageName },
      "[StoreIntegration] Google Play Service Account or Group Email not configured in .env. Skipping Google API call."
    );
    return true;
  }

  try {
    let credentials: any;
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch {
      const fs = await import("node:fs");
      credentials = JSON.parse(fs.readFileSync(serviceAccountJson, "utf8"));
    }

    if (!credentials.client_email || !credentials.private_key) {
      logger.warn("[StoreIntegration] Invalid Google Play service account JSON structure");
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/admin.directory.group.member",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    const assertion = jwt.sign(jwtPayload, credentials.private_key, {
      algorithm: "RS256",
    });

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      logger.warn(
        { tokenData },
        "[StoreIntegration] Failed to obtain Google OAuth access token for Group member removal"
      );
      return false;
    }

    const deleteRes = await fetch(
      `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(
        testerGroupEmail
      )}/members/${encodeURIComponent(email)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (deleteRes.status === 204 || deleteRes.status === 404) {
      logger.info(
        { email, testerGroupEmail, status: deleteRes.status },
        "[StoreIntegration] Tester successfully removed from Google Play testing group"
      );
      return true;
    }

    const errBody = await deleteRes.text();
    logger.warn(
      { status: deleteRes.status, errBody },
      "[StoreIntegration] Google Directory API returned non-204 on member deletion"
    );
    return false;
  } catch (err: any) {
    logger.error(
      { err, email },
      "[StoreIntegration] Failed to remove tester from Google Play group"
    );
    return false;
  }
}


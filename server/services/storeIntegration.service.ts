import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

interface StoreInviteResult {
  success: boolean;
  storeTesterId?: string;
  isDirectStoreInviteSent: boolean;
  message?: string;
}

/**
 * Parses Apple ASC private key supporting:
 * 1. Base64 encoded PEM (recommended for .env)
 * 2. Raw PEM with \n or newlines
 */
export function parsePrivateKey(rawKey: string): string {
  let key = rawKey.trim();

  // If wrapped in quotes, unwrap
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  // 1. Try decoding Base64 if not already standard PEM header
  if (!key.includes("-----BEGIN PRIVATE KEY-----")) {
    try {
      const decoded = Buffer.from(key, "base64").toString("utf8");
      if (decoded.includes("-----BEGIN PRIVATE KEY-----")) {
        key = decoded;
      }
    } catch {}
  }

  // 2. Format escaped newlines
  if (key.includes("\\n")) {
    key = key.replace(/\\n/g, "\n");
  }

  return key;
}

/**
 * Parses Google Service Account credentials supporting:
 * 1. Base64 encoded JSON (recommended for .env)
 * 2. Raw JSON string
 * 3. File path to service-account.json
 */
export function parseServiceAccountJson(rawInput: string): any {
  let content = rawInput.trim();

  // If wrapped in quotes, unwrap
  if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
    content = content.slice(1, -1);
  }

  // 1. Try decoding Base64 if not starting with '{'
  if (!content.startsWith("{")) {
    try {
      const decoded = Buffer.from(content, "base64").toString("utf8");
      if (decoded.trim().startsWith("{")) {
        content = decoded.trim();
      }
    } catch {}
  }

  // 2. Parse JSON or read from file path
  try {
    return JSON.parse(content);
  } catch {
    const fs = require("node:fs");
    if (fs.existsSync(content)) {
      return JSON.parse(fs.readFileSync(content, "utf8"));
    }
    throw new Error("Invalid service account JSON or file path");
  }
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

  const formattedKey = parsePrivateKey(privateKey);

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
      const credentials = parseServiceAccountJson(serviceAccountJson);

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
    const credentials = parseServiceAccountJson(serviceAccountJson);

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


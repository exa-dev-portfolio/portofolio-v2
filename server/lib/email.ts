import { logger } from '../utils/logger'
import { Resend } from "resend";

export const sendContactNotification = async (
  to: string,
  name: string,
  email: string,
  subject: string,
  message: string,
) => {
  const config = useRuntimeConfig();

  const apiKey = config.resendApiKey as string | undefined;
  if (!apiKey) {
    logger.warn("[Email] RESEND_API_KEY not configured, skipping email");
    return;
  }

  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: `Portfolio Contact <no-reply@eka-dev.cloud>`,
    to,
    replyTo: email,
    subject: `[Portfolio] ${subject}`,
    html: `
            <h2>New Contact Form Submission</h2>
            <table style="border-collapse:collapse;width:100%;max-width:600px;">
                <tr><td style="padding:8px 12px;font-weight:bold;border:1px solid #ddd;">Name</td><td style="padding:8px 12px;border:1px solid #ddd;">${name}</td></tr>
                <tr><td style="padding:8px 12px;font-weight:bold;border:1px solid #ddd;">Email</td><td style="padding:8px 12px;border:1px solid #ddd;">${email}</td></tr>
                <tr><td style="padding:8px 12px;font-weight:bold;border:1px solid #ddd;">Subject</td><td style="padding:8px 12px;border:1px solid #ddd;">${subject}</td></tr>
                <tr><td style="padding:8px 12px;font-weight:bold;border:1px solid #ddd;">Message</td><td style="padding:8px 12px;border:1px solid #ddd;">${message}</td></tr>
            </table>
        `,
  });
};

export const sendBetaTesterOtp = async (
  to: string,
  appName: string,
  platform: "ios" | "android",
  otpCode: string,
) => {
  const config = useRuntimeConfig();

  const apiKey = config.resendApiKey as string | undefined;
  if (!apiKey) {
    logger.warn(`[Email] RESEND_API_KEY not configured. Verification OTP for ${to} is: ${otpCode}`);
    return;
  }

  const resend = new Resend(apiKey);
  const platformName = platform === "ios" ? "Apple TestFlight (iOS)" : "Google Play Testing Track (Android)";

  await resend.emails.send({
    from: `Eka Apps <no-reply@eka-dev.cloud>`,
    to,
    subject: `[${otpCode}] Your verification code for ${appName} (${platformName})`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #0c1222; color: #f1f5f9; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <div style="background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); padding: 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">Official Store Access Verification</h1>
          <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">${appName} • ${platformName}</p>
        </div>

        <div style="padding: 28px 24px;">
          <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
            Hello, you requested access to test <strong>${appName}</strong> via <strong>${platformName}</strong>.
          </p>

          <p style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8;">
            Please enter the following 6-digit confirmation code on the website to activate your 14-day testing pass:
          </p>

          <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
            <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8;">${otpCode}</span>
          </div>

          <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
            • This verification code is valid for <strong>10 minutes</strong>.<br />
            • If you did not request this invite, please disregard this email.
          </p>
        </div>

        <div style="background: #080c16; padding: 16px 24px; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center; font-size: 11px; color: #64748b;">
          &copy; ${new Date().getFullYear()} Eka Portfolio • Self-Hosted App Distribution Platform
        </div>
      </div>
    `,
  });
};


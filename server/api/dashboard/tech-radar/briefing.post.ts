import { withAuth } from "~~/server/utils/withAuth";
import { sendSuccess } from "~~/server/utils/response";
import { GoogleGenAI } from "@google/genai";
import { getAggregatedTechFeed } from "~~/server/services/techNews.service";
import { getJson, setJson } from "~~/server/db/redis";
import { logger } from "~~/server/utils/logger";
import type { DailyBriefingResponse } from "~~/app/types/tech-news";

import { techRadarBriefingSchema } from "~~/server/model/techRadar.model";
import { HttpError } from "~~/server/errors/HttpError";
import z from "zod";

const BRIEFING_CACHE_KEY = "tech_radar:briefing:v1";
const BRIEFING_TTL = 7200; // 2 hours

export default withAuth(async (event) => {
  const parsed = await readValidatedBody(event, (body) =>
    techRadarBriefingSchema.safeParse(body || {})
  );

  if (!parsed.success) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Invalid request data",
      z.treeifyError(parsed.error).properties
    );
  }

  const forceRefresh = parsed.data.force;

  // 1. Check Redis cache for briefing
  if (!forceRefresh) {
    try {
      const cachedBriefing = await getJson<DailyBriefingResponse>(BRIEFING_CACHE_KEY);
      if (cachedBriefing?.headline && Array.isArray(cachedBriefing?.takeaways)) {
        return sendSuccess(event, cachedBriefing);
      }
    } catch (_) {
      // Redis fallback
    }
  }

  // 2. Get top 15 tech items
  const { items } = await getAggregatedTechFeed(false);
  const topItems = items.slice(0, 15).map((i) => ({
    title: i.title,
    source: i.source,
    category: i.category,
    summary: i.summary,
    score: i.score,
  }));

  const config = useRuntimeConfig();
  const apiKey = (config.geminiApiKey as string) || process.env.NUXT_GEMINI_API_KEY || "";

  if (!apiKey) {
    // Graceful fallback if no Gemini key
    const fallback: DailyBriefingResponse = {
      headline: "Highlight Berita & Perkembangan Teknologi Terkini",
      market_pulse: "Aktivitas tinggi pada open-source, AI engineering, dan modern web tooling.",
      takeaways: topItems.slice(0, 3).map((item) => ({
        title: item.title,
        desc: item.summary || `Diskusi hangat di ${item.source}`,
        tag: item.category.toUpperCase(),
      })),
      generated_at: new Date().toISOString(),
    };
    return sendSuccess(event, fallback);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Anda adalah seorang Senior Tech Lead & Curator teknologi terpercaya.
Berdasarkan daftar berita & trending tech teratas hari ini berikut:
${JSON.stringify(topItems, null, 2)}

Buatlah "1-Minute Daily Tech Executive Briefing" yang tajam, padat, dan bernilai tinggi bagi seorang Software Engineer / Full-Stack Developer.
Formatkan respon Anda HANYA dalam JSON valid tanpa markdown backticks (pure JSON):
{
  "headline": "1 kalimat headline paling menarik/berpengaruh tentang arah teknologi hari ini",
  "market_pulse": "1 kalimat sentimen atau tema besar komunitas tech hari ini (misal pergeseran AI open weights, update framework, dsb)",
  "takeaways": [
    {
      "title": "Poin 1: Judul singkat padat",
      "desc": "Penjelasan 1-2 kalimat mengapa ini penting bagi developer",
      "tag": "Kategori (contoh: AI, Web, DevOps, Mobile, Tools)"
    },
    {
      "title": "Poin 2: Judul singkat padat",
      "desc": "Penjelasan 1-2 kalimat mengapa ini penting bagi developer",
      "tag": "Kategori"
    },
    {
      "title": "Poin 3: Judul singkat padat",
      "desc": "Penjelasan 1-2 kalimat mengapa ini penting bagi developer",
      "tag": "Kategori"
    }
  ]
}
Gunakan Bahasa Indonesia yang profesional dan natural.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = response.text || "";
    const cleanJson = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      logger.warn({ rawText }, "[tech-radar briefing] Failed to parse Gemini response as JSON");
    }

    const briefing: DailyBriefingResponse = {
      headline: parsed?.headline || "Highlight Berita & Perkembangan Teknologi Terkini",
      market_pulse: parsed?.market_pulse || "Fokus komunitas mengarah ke adopsi AI dan efisiensi sistem.",
      takeaways: Array.isArray(parsed?.takeaways) && parsed.takeaways.length > 0
        ? parsed.takeaways
        : topItems.slice(0, 3).map((item) => ({
            title: item.title,
            desc: item.summary || `Trending di ${item.source}`,
            tag: item.category.toUpperCase(),
          })),
      generated_at: new Date().toISOString(),
    };

    // Save to cache
    try {
      await setJson(BRIEFING_CACHE_KEY, briefing, BRIEFING_TTL);
    } catch (_) {}

    return sendSuccess(event, briefing);
  } catch (error: any) {
    logger.warn({ err: error.message }, "[tech-radar briefing] Gemini error, returning fallback:");
    const fallback: DailyBriefingResponse = {
      headline: "Highlight Berita & Perkembangan Teknologi Terkini",
      market_pulse: "Aktivitas tinggi pada open-source, AI engineering, dan modern web tooling.",
      takeaways: topItems.slice(0, 3).map((item) => ({
        title: item.title,
        desc: item.summary || `Diskusi hangat di ${item.source}`,
        tag: item.category.toUpperCase(),
      })),
      generated_at: new Date().toISOString(),
    };
    return sendSuccess(event, fallback);
  }
});

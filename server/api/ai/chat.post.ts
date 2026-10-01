import {GoogleGenAI} from "@google/genai";
import {HttpError} from "~~/server/errors/HttpError";
import {sendSuccess} from "~~/server/utils/response";
import {query} from "~~/server/db/postgres";

function markdownToHtml(markdown: string): string {
    return markdown
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
        .replace(/\n/g, '<br/>')
}

async function fetchPortfolioData(): Promise<{
    settings: any;
    skills: any[];
    projects: any[];
    journeys: any[];
}> {
    const settingsResult = await query(`
        SELECT name, email, location, open_to_opportunities, github_profile, linkedin_profile, cv_url
        FROM users LIMIT 1
    `);

    const skillsResult = await query(`
        SELECT name FROM skills ORDER BY name ASC
    `);

    const projectsResult = await query(`
        SELECT p.name, p.description, p.status, p.start_date, p.end_date,
               p.features, p.live_url, p.repo_url,
               ARRAY_AGG(s.name) AS technologies
        FROM projects p
        JOIN project_skills ps ON p.id = ps.project_id
        JOIN skills s ON ps.skill_id = s.id
        GROUP BY p.id
        ORDER BY p.start_date DESC
    `);

    const journeysResult = await query(`
        SELECT j.title, j.company, j.location, j.start_date, j.end_date,
               j.key_responsibilities, j.description, j.is_current,
               ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL) AS skills
        FROM journeys j
        LEFT JOIN journey_skills js ON j.id = js.journey_id
        LEFT JOIN skills s ON js.skill_id = s.id
        GROUP BY j.id
        ORDER BY j.start_date DESC
    `);

    return {
        settings: settingsResult.rows[0] || null,
        skills: skillsResult.rows,
        projects: projectsResult.rows,
        journeys: journeysResult.rows,
    };
}

function buildPortfolioContext(data: {
    settings: any;
    skills: any[];
    projects: any[];
    journeys: any[];
}): string {
    let context = '';

    if (data.settings) {
        const s = data.settings;
        context += `=== PROFILE ===\n`;
        context += `Name: ${s.name}\n`;
        context += `Role: Full-Stack Developer\n`;
        context += `Location: ${s.location || 'Tegal, Central Java, Indonesia'}\n`;
        context += `Status: ${s.open_to_opportunities ? 'Open to work opportunities' : 'Not currently open to work'}\n`;
        context += `Email: ${s.email}\n`;
        if (s.github_profile) context += `GitHub: ${s.github_profile}\n`;
        if (s.linkedin_profile) context += `LinkedIn: ${s.linkedin_profile}\n`;
        context += '\n';
    }

    if (data.skills.length > 0) {
        context += `=== SKILLS ===\n`;
        context += data.skills.map(s => `- ${s.name}`).join('\n');
        context += '\n\n';
    }

    if (data.projects.length > 0) {
        context += `=== PROJECTS ===\n`;
        for (const p of data.projects) {
            const features = p.features?.join(', ') || '';
            const tech = p.technologies?.filter(Boolean)?.join(', ') || '';
            context += `\n[${p.name}]`;
            if (p.start_date) context += ` (${p.start_date?.split('-')[0] || ''})`;
            context += `\n`;
            if (p.description) context += `Description: ${p.description}\n`;
            if (features) context += `Features: ${features}\n`;
            if (tech) context += `Technologies: ${tech}\n`;
            if (p.live_url) context += `Live URL: ${p.live_url}\n`;
            const statusLabel = typeof p.status === 'string' ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : (p.status ? 'Published' : 'Draft');
            context += `Status: ${statusLabel}\n`;
        }
        context += '\n';
    }

    if (data.journeys.length > 0) {
        context += `=== EXPERIENCE ===\n`;
        for (const j of data.journeys) {
            const period = `${j.start_date || ''} - ${j.end_date || (j.is_current ? 'Present' : '')}`;
            const responsibilities = j.key_responsibilities?.join(', ') || '';
            const tech = j.skills?.filter(Boolean)?.join(', ') || '';
            context += `\n[${j.title}] at ${j.company}\n`;
            if (j.location) context += `Location: ${j.location}\n`;
            context += `Period: ${period}\n`;
            if (j.description) context += `Description: ${j.description}\n`;
            if (responsibilities) context += `Key Responsibilities: ${responsibilities}\n`;
            if (tech) context += `Technologies: ${tech}\n`;
        }
        context += '\n';
    }

    return context;
}

export default handleError(async (event) => {
    const {prompt} = await readBody(event)

    if (!prompt || typeof prompt !== 'string') {
        throw createError({
            statusCode: 400,
            statusMessage: 'Prompt is required',
        })
    }

    const config = useRuntimeConfig()
    const apiKey = config.geminiApiKey

    if (!apiKey || apiKey.trim() === '') {
        logger.error('[AI Chat] GEMINI_API_KEY not configured')
        throw new HttpError(
            500,
            'AI_NOT_CONFIGURED',
            'AI service is not configured. Please set GEMINI_API_KEY environment variable.'
        )
    }

    let portfolioContext = '';
    try {
        const data = await fetchPortfolioData();
        portfolioContext = buildPortfolioContext(data);
    } catch (err) {
        logger.warn({ err: err }, '[AI Chat] Failed to fetch portfolio data, proceeding without context:');
    }

    const systemPrompt = `You are an AI Assistant for the personal portfolio website of
Moh. Eka Syafrino Nazhifan, a Full-Stack Developer based in Tegal, Central Java, Indonesia.

Your responsibilities:
- Answer visitor questions about Eka's skills, experience, projects, and interests
- Help recruiters or collaborators quickly understand Eka's technical capabilities
- Respond professionally, clearly, concisely, and directly to the question context
- Encourage visitors to contact Eka when discussing hiring, collaboration, or freelance opportunities

=== COMMUNICATION RULES ===
- Always answer based on the visitor's question context
- Prioritize the portfolio data below when answering
- Do NOT repeat Eka's full profile or resume unless explicitly requested
- Keep responses clear, direct, and professional
- If the question is unclear, politely ask for clarification
- If the topic is hiring, collaboration, or freelance work, encourage contacting Eka
- Respond in English or Indonesian depending on the user's language

${portfolioContext ? `${portfolioContext}\n` : ''}User question:
"${prompt}"

Answer professionally, clearly, and directly based on the question context and portfolio data.
Do not restate Eka's profile unless explicitly requested.
Always represent Eka as a fast-learning, performance-oriented developer with strong problem-solving skills.`

    try {
        logger.info('[AI Chat] Initializing GoogleGenAI with API key...')
        const ai = new GoogleGenAI({apiKey});

        logger.info('[AI Chat] Sending request to Gemini API...')
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: systemPrompt
        })
        const text = response.text

        if (!text || !text.trim()) {
            logger.warn('[AI Chat] Empty response from Gemini')
            throw new HttpError(
                500,
                "EMPTY_AI_RESPONSE",
                "The AI service did not return any content."
            )
        }

        const htmlContent = markdownToHtml(text.trim())

        logger.info(`[AI Chat] Generated response (${text.length} chars) for prompt: "${prompt.substring(0, 50)}..."`)

        return sendSuccess(
            event,
            htmlContent,
            "AI response generated successfully",
            "ai_chat_response",
            200
        )
    } catch (error) {
        logger.error({ err: error }, '[AI Chat] Error:')

        if (error instanceof HttpError) {
            throw error
        }

        if (error instanceof Error && error.message.includes('default credentials')) {
            logger.error('[AI Chat] Google Auth error - API key might be invalid or not properly configured')
            throw new HttpError(
                500,
                "GEMINI_AUTH_ERROR",
                "Failed to authenticate with Gemini API. Please check GEMINI_API_KEY environment variable."
            )
        }

        throw new HttpError(
            500,
            "INTERNAL_SERVER_ERROR",
            error instanceof Error ? error.message : "An unexpected error occurred while processing the AI response."
        )
    }
})
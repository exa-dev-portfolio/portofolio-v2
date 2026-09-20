export interface Application {
    id: string
    user_id: string
    company_name: string
    position: string
    hr_email: string
    job_description: string | null
    job_link: string | null
    email_subject: string | null
    email_body: string | null
    email_reasoning: string | null
    chat_history?: Array<{ role: 'user' | 'assistant'; content: string }> | null
    status: 'draft' | 'sent'
    sent_at: string | null
    created_at: string
    updated_at: string
}

export interface ApplicationAttachment {
    id: string
    application_id: string
    file_name: string
    file_url: string
    file_size: number | null
    mime_type: string | null
    created_at: string
}

export interface GmailStatus {
    connected: boolean
    email: string | null
}

export interface GenerateInput {
    company_name: string
    position: string
    hr_email: string
    job_description: string
    job_link?: string
}

export interface GenerateResult {
    application: Application
    subject: string
    body: string
    reasoning: string[]
    analysis: string
}

export interface ChatResult {
    reply: string
    revised_subject: string | null
    revised_body: string | null
    reasoning: string[]
    chat_history?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface ApplicationStats {
    total: number
    draft: number
    sent: number
}

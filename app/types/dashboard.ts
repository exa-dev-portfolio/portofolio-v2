export interface DashboardStats {
    projects: {
        total: number
        published: number
        draft: number
        archived?: number
    }
    skills: {
        total: number
    }
    journeys: {
        total: number
        current: number
    }
    messages: {
        unread: number
    }
}


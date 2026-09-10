export interface ProjectPreviewImage {
    url: string
    title?: string
    caption?: string
}

export interface ProjectPreviewInput {
    id?: string
    url?: string
    file?: File | null
    previewUrl?: string
    title?: string
    caption?: string
}

export type AppType = "mobile" | "web" | "backend" | "pos" | "other";

export interface SubApp {
    id?: string;
    name: string;
    app_type: AppType;
    type?: AppType;
    description?: string;
    repo_url?: string;
    live_url?: string;
    demo_url?: string;
    technologies?: string[];
}

export interface GitHubRepoItem {
    id: number;
    name: string;
    full_name: string;
    description: string;
    html_url: string;
    homepage: string;
    language: string;
    stars: number;
    forks: number;
    topics: string[];
    updated_at: string;
    is_fork: boolean;
    archived: boolean;
    app_type: AppType;
}

export interface GitHubOrgData {
    org: string;
    org_url: string;
    avatar_url: string;
    total_repos: number;
    repos: GitHubRepoItem[];
}

export type Project = {
    id?: number
    name: string
    description: string
    image: File | null
    status: boolean
    features: string[]
    technologies: string[]
    repo_url?: string
    live_url?: string
    is_organization?: boolean
    github_org?: string
    sub_apps?: SubApp[]
    start_date?: string
    end_date?: string
    created_at?: string
    updated_at?: string
    id_skills?: number[] // For backward compatibility
    preview_image?: string // URL of the image for preview purposes
    preview_images?: ProjectPreviewImage[] // Gallery/feature preview images with title & caption
}

export type ProjectsResponse = {
    data: Project[]
    has_next: boolean
}
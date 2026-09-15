export type SkillCategory = {
    id: number;
    name: string;
    description?: string | null;
    color: string;
    created_at?: string;
    updated_at?: string;
    skills_count?: number;
};

export type SkillCategoriesResponse = {
    data: SkillCategory[];
};

export type Skill = {
    id: number;
    name: string;
    color: string;
    icon: string;
    category_id?: number | null;
    category_name?: string | null;
    category_color?: string | null;
    created_at?: string;
};

export type SkillsResponse = {
    data: Skill[];
    has_next: boolean;
};
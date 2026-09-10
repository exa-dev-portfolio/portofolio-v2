export const shorthands = undefined;

export const up = (pgm) => {
    pgm.addColumn('projects', {
        is_organization: {
            type: 'boolean',
            notNull: true,
            default: false
        },
        github_org: {
            type: 'varchar(255)',
            notNull: false
        },
        sub_apps: {
            type: 'jsonb',
            notNull: true,
            default: '[]'
        }
    });
};

export const down = (pgm) => {
    pgm.dropColumn('projects', ['is_organization', 'github_org', 'sub_apps']);
};

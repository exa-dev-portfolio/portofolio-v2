export const shorthands = undefined;

export const up = (pgm) => {
    pgm.alterColumn('projects', 'status', {
        type: 'varchar(20)',
        using: "CASE WHEN status = true THEN 'published' ELSE 'draft' END",
        default: 'draft',
        notNull: true,
    });
};

export const down = (pgm) => {
    pgm.alterColumn('projects', 'status', {
        type: 'boolean',
        using: "CASE WHEN status = 'published' THEN true ELSE false END",
        default: false,
        notNull: true,
    });
};

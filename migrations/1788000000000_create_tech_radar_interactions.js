export const shorthands = undefined;

export const up = async (pgm) => {
    pgm.createTable('tech_radar_interactions', {
        id: {
            type: 'serial',
            primaryKey: true,
            notNull: true
        },
        user_id: {
            type: 'uuid',
            notNull: true,
            references: 'users(id)',
            onDelete: 'cascade'
        },
        article_id: {
            type: 'varchar(255)',
            notNull: true
        },
        title: {
            type: 'text',
            notNull: true
        },
        url: {
            type: 'text',
            notNull: true
        },
        source: {
            type: 'varchar(50)',
            notNull: true
        },
        category: {
            type: 'varchar(50)',
            notNull: false
        },
        author: {
            type: 'varchar(100)',
            notNull: false
        },
        published_at: {
            type: 'varchar(100)',
            notNull: false
        },
        is_read: {
            type: 'boolean',
            notNull: true,
            default: false
        },
        read_at: {
            type: 'timestamp with time zone',
            notNull: false
        },
        is_bookmarked: {
            type: 'boolean',
            notNull: true,
            default: false
        },
        bookmarked_at: {
            type: 'timestamp with time zone',
            notNull: false
        },
        created_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
        updated_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    });

    pgm.addConstraint('tech_radar_interactions', 'uq_tech_radar_user_article', {
        unique: ['user_id', 'article_id']
    });

    pgm.createIndex('tech_radar_interactions', ['user_id', 'is_read']);
    pgm.createIndex('tech_radar_interactions', ['user_id', 'is_bookmarked']);
};

export const down = async (pgm) => {
    pgm.dropTable('tech_radar_interactions');
};

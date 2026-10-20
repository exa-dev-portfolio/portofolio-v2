export const shorthands = undefined;

export const up = async (pgm) => {
    pgm.createTable('analytics_events', {
        id: {
            type: 'bigserial',
            primaryKey: true,
            notNull: true
        },
        session_id: {
            type: 'varchar(64)',
            notNull: true
        },
        event_type: {
            type: 'varchar(50)',
            notNull: true,
            default: 'page_view'
        },
        path: {
            type: 'varchar(255)',
            notNull: true
        },
        title: {
            type: 'varchar(255)',
            notNull: false
        },
        referrer: {
            type: 'text',
            notNull: false
        },
        referrer_domain: {
            type: 'varchar(255)',
            notNull: false
        },
        device_type: {
            type: 'varchar(30)',
            notNull: true,
            default: 'desktop'
        },
        os: {
            type: 'varchar(50)',
            notNull: false
        },
        browser: {
            type: 'varchar(50)',
            notNull: false
        },
        country: {
            type: 'varchar(10)',
            notNull: false
        },
        duration_seconds: {
            type: 'integer',
            notNull: true,
            default: 0
        },
        created_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    });

    pgm.createIndex('analytics_events', 'created_at');
    pgm.createIndex('analytics_events', 'path');
    pgm.createIndex('analytics_events', 'session_id');
    pgm.createIndex('analytics_events', 'event_type');
    pgm.createIndex('analytics_events', 'referrer_domain');
};

export const down = async (pgm) => {
    pgm.dropTable('analytics_events');
};

export const shorthands = undefined;

export const up = async (pgm) => {
    pgm.createTable('apk_beta_testers', {
        id: {
            type: 'uuid',
            primaryKey: true,
            notNull: true,
            default: pgm.func('gen_random_uuid()')
        },
        app_id: {
            type: 'uuid',
            notNull: true,
            references: 'apk_apps(id)',
            onDelete: 'CASCADE'
        },
        email: {
            type: 'varchar(255)',
            notNull: true
        },
        platform: {
            type: 'varchar(20)',
            notNull: true // 'ios' | 'android'
        },
        status: {
            type: 'varchar(50)',
            notNull: true,
            default: 'pending_otp' // 'pending_otp' | 'active' | 'revoked' | 'expired'
        },
        otp_code: {
            type: 'varchar(10)',
            notNull: false
        },
        otp_expires_at: {
            type: 'timestamp with time zone',
            notNull: false
        },
        otp_attempts: {
            type: 'integer',
            notNull: true,
            default: 0
        },
        revoked_reason: {
            type: 'text',
            notNull: false
        },
        expires_at: {
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

    pgm.createIndex('apk_beta_testers', ['app_id', 'platform', 'status']);
    pgm.createIndex('apk_beta_testers', ['email', 'app_id', 'platform']);
    pgm.createIndex('apk_beta_testers', 'expires_at');
};

export const down = async (pgm) => {
    pgm.dropTable('apk_beta_testers');
};

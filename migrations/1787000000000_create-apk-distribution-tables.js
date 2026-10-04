export const shorthands = undefined;

export const up = async (pgm) => {
    // 1. Ensure uuid-ossp or pgcrypto extension exists for gen_random_uuid()
    pgm.sql('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    // 2. Table apk_repositories
    pgm.createTable('apk_repositories', {
        id: {
            type: 'uuid',
            primaryKey: true,
            notNull: true,
            default: pgm.func('gen_random_uuid()')
        },
        repo_slug: {
            type: 'varchar(255)',
            notNull: true,
            unique: true
        },
        is_private: {
            type: 'boolean',
            notNull: true,
            default: false
        },
        access_token: {
            type: 'text',
            notNull: false
        },
        webhook_secret: {
            type: 'varchar(255)',
            notNull: true
        },
        asset_filter_regex: {
            type: 'varchar(255)',
            notNull: true,
            default: '.*\\.apk$'
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

    // 3. Table apk_apps
    pgm.createTable('apk_apps', {
        id: {
            type: 'uuid',
            primaryKey: true,
            notNull: true,
            default: pgm.func('gen_random_uuid()')
        },
        repo_id: {
            type: 'uuid',
            notNull: true,
            references: 'apk_repositories(id)',
            onDelete: 'CASCADE'
        },
        package_name: {
            type: 'varchar(255)',
            notNull: true,
            unique: true
        },
        app_name: {
            type: 'varchar(255)',
            notNull: true
        },
        description: {
            type: 'text',
            notNull: false
        },
        icon_url: {
            type: 'text',
            notNull: false
        },
        latest_version_code: {
            type: 'integer',
            notNull: true,
            default: 0
        },
        latest_version_name: {
            type: 'varchar(100)',
            notNull: false
        },
        is_published: {
            type: 'boolean',
            notNull: true,
            default: true
        },
        download_count: {
            type: 'integer',
            notNull: true,
            default: 0
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

    pgm.createIndex('apk_apps', 'repo_id');
    pgm.createIndex('apk_apps', 'package_name');

    // 4. Table apk_releases
    pgm.createTable('apk_releases', {
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
        github_release_id: {
            type: 'bigint',
            notNull: false
        },
        tag_name: {
            type: 'varchar(100)',
            notNull: true
        },
        version_code: {
            type: 'integer',
            notNull: true
        },
        version_name: {
            type: 'varchar(100)',
            notNull: true
        },
        min_sdk: {
            type: 'integer',
            notNull: false
        },
        target_sdk: {
            type: 'integer',
            notNull: false
        },
        changelog: {
            type: 'text',
            notNull: false
        },
        file_size_bytes: {
            type: 'bigint',
            notNull: true,
            default: 0
        },
        sha256_hash: {
            type: 'varchar(64)',
            notNull: false
        },
        storage_path: {
            type: 'text',
            notNull: false
        },
        download_url: {
            type: 'text',
            notNull: false
        },
        download_count: {
            type: 'integer',
            notNull: true,
            default: 0
        },
        published_at: {
            type: 'timestamp with time zone',
            notNull: false
        },
        created_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    });

    pgm.createIndex('apk_releases', 'app_id');
    pgm.createIndex('apk_releases', ['app_id', 'version_code'], { unique: true });

    // 5. Table apk_sync_jobs (for tracking webhook triggers and worker progress)
    pgm.createTable('apk_sync_jobs', {
        id: {
            type: 'uuid',
            primaryKey: true,
            notNull: true,
            default: pgm.func('gen_random_uuid()')
        },
        repo_id: {
            type: 'uuid',
            notNull: true,
            references: 'apk_repositories(id)',
            onDelete: 'CASCADE'
        },
        event_type: {
            type: 'varchar(50)',
            notNull: true,
            default: 'webhook'
        },
        status: {
            type: 'varchar(50)',
            notNull: true,
            default: 'pending' // pending | processing | completed | failed
        },
        error_message: {
            type: 'text',
            notNull: false
        },
        payload: {
            type: 'jsonb',
            notNull: true,
            default: '{}'
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

    pgm.createIndex('apk_sync_jobs', 'repo_id');
    pgm.createIndex('apk_sync_jobs', 'status');
};

export const down = async (pgm) => {
    pgm.dropTable('apk_sync_jobs');
    pgm.dropTable('apk_releases');
    pgm.dropTable('apk_apps');
    pgm.dropTable('apk_repositories');
};

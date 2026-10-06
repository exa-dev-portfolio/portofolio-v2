export const shorthands = undefined;

export const up = async (pgm) => {
    // 1. Add platform, original_filename, and arch to apk_releases
    pgm.addColumn('apk_releases', {
        platform: {
            type: 'varchar(50)',
            notNull: true,
            default: 'android'
        },
        original_filename: {
            type: 'varchar(255)',
            notNull: true,
            default: ''
        },
        arch: {
            type: 'varchar(50)',
            notNull: false,
            default: 'universal'
        }
    });

    // 2. Add supported_platforms to apk_apps
    pgm.addColumn('apk_apps', {
        supported_platforms: {
            type: 'text[]',
            notNull: true,
            default: pgm.func("ARRAY['android']::text[]")
        }
    });

    // 3. Drop old unique index on (app_id, version_code)
    pgm.dropIndex('apk_releases', ['app_id', 'version_code'], { ifExists: true, name: 'apk_releases_app_id_version_code_unique_index' });

    // 4. Create new unique index supporting multiple platforms/filenames per version
    pgm.createIndex('apk_releases', ['app_id', 'version_code', 'platform', 'original_filename'], {
        unique: true,
        name: 'apk_releases_app_version_platform_filename_unique_idx'
    });

    // 5. Index on platform for fast filtering
    pgm.createIndex('apk_releases', 'platform');

    // 6. Update default asset_filter_regex on apk_repositories for future repos
    pgm.alterColumn('apk_repositories', 'asset_filter_regex', {
        default: '.*\\.(apk|exe|msi|dmg|pkg|AppImage|deb|zip)$'
    });
};

export const down = async (pgm) => {
    pgm.dropIndex('apk_releases', 'platform');
    pgm.dropIndex('apk_releases', ['app_id', 'version_code', 'platform', 'original_filename'], {
        ifExists: true,
        name: 'apk_releases_app_version_platform_filename_unique_idx'
    });
    pgm.createIndex('apk_releases', ['app_id', 'version_code'], {
        unique: true,
        name: 'apk_releases_app_id_version_code_unique_index'
    });
    pgm.dropColumn('apk_apps', 'supported_platforms');
    pgm.dropColumn('apk_releases', ['platform', 'original_filename', 'arch']);
    pgm.alterColumn('apk_repositories', 'asset_filter_regex', {
        default: '.*\\.apk$'
    });
};

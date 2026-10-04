export const shorthands = undefined;

export const up = async (pgm) => {
    // 1. Add status column to apk_apps ('development' | 'production')
    pgm.addColumn('apk_apps', {
        status: {
            type: 'varchar(50)',
            notNull: true,
            default: 'development'
        }
    });

    // 2. Add status column to apk_releases ('development' | 'production')
    pgm.addColumn('apk_releases', {
        status: {
            type: 'varchar(50)',
            notNull: true,
            default: 'development'
        }
    });

    pgm.createIndex('apk_apps', 'status');
    pgm.createIndex('apk_releases', 'status');
};

export const down = async (pgm) => {
    pgm.dropIndex('apk_releases', 'status');
    pgm.dropIndex('apk_apps', 'status');
    pgm.dropColumn('apk_releases', 'status');
    pgm.dropColumn('apk_apps', 'status');
};

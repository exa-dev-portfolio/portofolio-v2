export const shorthands = undefined;

export const up = async (pgm) => {
    pgm.addColumn('users', {
        apple_id: { type: 'varchar(255)', notNull: false, default: null, unique: true },
        apple_email: { type: 'varchar(255)', notNull: false, default: null },
    });
};

export const down = async (pgm) => {
    pgm.dropColumn('users', 'apple_id');
    pgm.dropColumn('users', 'apple_email');
};

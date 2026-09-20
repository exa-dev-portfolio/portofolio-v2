export const shorthands = undefined;

export const up = async (pgm) => {
    pgm.addColumn('job_applications', {
        chat_history: {
            type: 'jsonb',
            notNull: true,
            default: '[]',
        },
    });
};

export const down = async (pgm) => {
    pgm.dropColumn('job_applications', 'chat_history');
};

export const shorthands = undefined;

export const up = async (pgm) => {
    // 1. Create skill_categories table
    pgm.createTable('skill_categories', {
        id: { type: 'serial', primaryKey: true, notNull: true },
        name: { type: 'varchar(100)', notNull: true, unique: true },
        description: { type: 'text' },
        color: { type: 'varchar(50)', notNull: true, default: '#38bdf8' },
        created_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
        updated_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') }
    });

    // 2. Seed initial default categories
    pgm.sql(`
        INSERT INTO skill_categories (name, description, color) VALUES
        ('Frontend & Mobile', 'Client-side applications, user interfaces, and mobile app ecosystems', '#38bdf8'),
        ('Backend & APIs', 'Server-side architectures, microservices, and robust REST/gRPC APIs', '#3b82f6'),
        ('Cloud & DevOps', 'Infrastructure automation, container orchestration, and cloud native tooling', '#10b981'),
        ('Databases & Queues', 'Relational, NoSQL, high-throughput in-memory stores, and message brokers', '#a855f7');
    `);

    // 3. Add category_id column to skills table
    pgm.addColumn('skills', {
        category_id: {
            type: 'integer',
            references: 'skill_categories(id)',
            onDelete: 'SET NULL'
        }
    });

    // 4. Create index on category_id for fast joins & filtering
    pgm.createIndex('skills', 'category_id');

    // 5. Backfill existing 29 skills into their appropriate category_id
    pgm.sql(`
        -- Frontend & Mobile
        UPDATE skills SET category_id = (SELECT id FROM skill_categories WHERE name = 'Frontend & Mobile')
        WHERE name ILIKE ANY(ARRAY['%vue%', '%react%', '%nuxt%', '%next%', '%flutter%', '%dart%', '%javascript%', '%typescript%', '%tailwind%', '%html%', '%css%']);

        -- Cloud & DevOps
        UPDATE skills SET category_id = (SELECT id FROM skill_categories WHERE name = 'Cloud & DevOps')
        WHERE name ILIKE ANY(ARRAY['%kuber%', '%docker%', '%kong%', '%pub/sub%', '%aws%', '%gcp%', '%cloud%', '%ci/cd%', '%linux%']);

        -- Databases & Queues
        UPDATE skills SET category_id = (SELECT id FROM skill_categories WHERE name = 'Databases & Queues')
        WHERE name ILIKE ANY(ARRAY['%sql%', '%mongo%', '%redis%', '%bigquery%', '%bigtable%', '%rabbit%', '%kafka%', '%database%']);

        -- Backend & APIs (any remaining skills or explicit matches)
        UPDATE skills SET category_id = (SELECT id FROM skill_categories WHERE name = 'Backend & APIs')
        WHERE category_id IS NULL;
    `);
};

export const down = async (pgm) => {
    pgm.dropIndex('skills', 'category_id');
    pgm.dropColumn('skills', 'category_id');
    pgm.dropTable('skill_categories');
};

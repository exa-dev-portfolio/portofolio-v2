/**
 * Add store_tester_id column to apk_beta_testers
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export async function up(pgm) {
  pgm.addColumn("apk_beta_testers", {
    store_tester_id: {
      type: "varchar(255)",
      notNull: false,
    },
  });
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export async function down(pgm) {
  pgm.dropColumn("apk_beta_testers", "store_tester_id");
}

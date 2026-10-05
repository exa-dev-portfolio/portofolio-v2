/**
 * Add apple_beta_group_id and google_tester_group_email columns to apk_apps table
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export async function up(pgm) {
  pgm.addColumn("apk_apps", {
    apple_beta_group_id: {
      type: "text",
      notNull: false,
    },
    google_tester_group_email: {
      type: "text",
      notNull: false,
    },
  });
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export async function down(pgm) {
  pgm.dropColumn("apk_apps", ["apple_beta_group_id", "google_tester_group_email"]);
}

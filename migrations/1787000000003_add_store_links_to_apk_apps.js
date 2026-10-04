/**
 * Add play_store_url and testflight_url columns to apk_apps table
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export async function up(pgm) {
  pgm.addColumn("apk_apps", {
    play_store_url: {
      type: "text",
      notNull: false,
    },
    testflight_url: {
      type: "text",
      notNull: false,
    },
  });
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export async function down(pgm) {
  pgm.dropColumn("apk_apps", ["play_store_url", "testflight_url"]);
}

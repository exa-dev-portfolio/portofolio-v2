/**
 * Add app_store_url column to apk_apps table
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export async function up(pgm) {
  pgm.addColumn("apk_apps", {
    app_store_url: {
      type: "text",
      notNull: false,
    },
  });
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export async function down(pgm) {
  pgm.dropColumn("apk_apps", ["app_store_url"]);
}

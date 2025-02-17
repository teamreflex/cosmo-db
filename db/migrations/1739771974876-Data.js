module.exports = class Data1739771974876 {
  name = "Data1739771974876";

  // for querying stats for the last 24 hours
  async up(db) {
    await db.query(
      `CREATE INDEX "IDX_objekt_minted_at" ON "objekt" ("minted_at") `
    );
  }

  async down(db) {
    await db.query(`DROP INDEX "public"."IDX_objekt_minted_at"`);
  }
};

module.exports = class Data1700720000001 {
  name = "Data1700720000001";

  async up(db) {
    await db.query(
      `CREATE INDEX "IDX_1bea560f6519e67c443d28f1e4" ON "objekt" ("received_at") `
    );
    await db.query(
      `CREATE INDEX "IDX_4f191afa06e5b2fdd4cf25bc3d" ON "objekt" ("serial") `
    );
    await db.query(
      `CREATE INDEX "IDX_05e7786db61c42d0546065cee5" ON "objekt" ("transferable") `
    );
    await db.query(
      `CREATE INDEX "IDX_316ce023e0d56f7e71fb759bc3" ON "objekt" ("used_for_grid") `
    );
  }

  async down(db) {
    await db.query(`DROP INDEX "public"."IDX_1bea560f6519e67c443d28f1e4"`);
    await db.query(`DROP INDEX "public"."IDX_4f191afa06e5b2fdd4cf25bc3d"`);
    await db.query(`DROP INDEX "public"."IDX_05e7786db61c42d0546065cee5"`);
    await db.query(`DROP INDEX "public"."IDX_316ce023e0d56f7e71fb759bc3"`);
  }
};

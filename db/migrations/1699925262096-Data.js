module.exports = class Data1699925262096 {
  name = "Data1699925262096";

  async up(db) {
    await db.query(`ALTER TABLE "objekt" ADD "timestamp" bigint NOT NULL`);
    await db.query(
      `CREATE INDEX "IDX_588a701ba69ea6ecbb6f9cc8dc" ON "como_calendar" ("timestamp") `
    );
  }

  async down(db) {
    await db.query(`DROP INDEX "public"."IDX_588a701ba69ea6ecbb6f9cc8dc"`);
    await db.query(`ALTER TABLE "objekt" DROP COLUMN "timestamp"`);
  }
};

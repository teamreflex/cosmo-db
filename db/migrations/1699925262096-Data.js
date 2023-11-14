module.exports = class Data1699925262096 {
  name = "Data1699925262096";

  async up(db) {
    await db.query(`ALTER TABLE "objekt" ADD "timestamp" bigint NOT NULL`);
  }

  async down(db) {
    await db.query(`ALTER TABLE "objekt" DROP COLUMN "timestamp"`);
  }
};

module.exports = class Data1755862697000 {
  name = "Data1755862697000";

  async up(db) {
    // add bandImageUrl column to collection table
    await db.query(
      `ALTER TABLE "public"."collection" ADD COLUMN "bandImageUrl" varchar(255);`
    );
  }

  async down(db) {
    // drop bandImageUrl column from collection table
    await db.query(
      `ALTER TABLE "public"."collection" DROP COLUMN "bandImageUrl";`
    );
  }
};

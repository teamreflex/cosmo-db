module.exports = class Data1755862698000 {
  name = "Data1755862698000";

  async up(db) {
    // add front_media column to collection table
    await db.query(
      `ALTER TABLE "public"."collection" ADD COLUMN "front_media" varchar(255);`
    );
  }

  async down(db) {
    // drop front_media column from collection table
    await db.query(
      `ALTER TABLE "public"."collection" DROP COLUMN "front_media";`
    );
  }
};

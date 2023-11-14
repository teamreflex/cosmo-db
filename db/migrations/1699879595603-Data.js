module.exports = class Data1699879595603 {
  name = "Data1699879595603";

  async up(db) {
    await db.query(
      `CREATE TABLE "objekt" ("id" SERIAL NOT NULL, "contract" text NOT NULL, "collection_id" text NOT NULL, "season" text NOT NULL, "member" text NOT NULL, "artist" text NOT NULL, "collection_no" text NOT NULL, "class" text NOT NULL, "front_image" text NOT NULL, "back_image" text NOT NULL, "background_color" text NOT NULL, "text_color" text NOT NULL, "como_amount" integer NOT NULL, "on_offline" text NOT NULL, CONSTRAINT "PK_a50fda223abd7f6ae55f2cf629f" PRIMARY KEY ("id"))`
    );
    await db.query(
      `CREATE INDEX "IDX_3e2b40803c0b64942151d0063b" ON "objekt" ("contract") `
    );
    await db.query(
      `CREATE INDEX "IDX_cc0196669f13f5958a307824a2" ON "objekt" ("collection_id") `
    );
    await db.query(
      `CREATE INDEX "IDX_d8c9587af788a5587c2a03496e" ON "objekt" ("season") `
    );
    await db.query(
      `CREATE INDEX "IDX_d65fc785743546e3eb34c34d24" ON "objekt" ("member") `
    );
    await db.query(
      `CREATE INDEX "IDX_dece9431c39a60cd7fa810e873" ON "objekt" ("artist") `
    );
    await db.query(
      `CREATE INDEX "IDX_6e97036b0295355bb484ef5c81" ON "objekt" ("collection_no") `
    );
    await db.query(
      `CREATE INDEX "IDX_645c594b9fa94609b836a14c83" ON "objekt" ("class") `
    );
    await db.query(
      `CREATE INDEX "IDX_5b0745b5c4e63951327cea3164" ON "objekt" ("on_offline") `
    );
    await db.query(
      `CREATE TABLE "como_calendar" ("id" SERIAL NOT NULL, "contract" text NOT NULL, "address" text NOT NULL, "day" integer NOT NULL, "amount" integer NOT NULL, CONSTRAINT "PK_c7cd8ddc32f266bb7d4ebce879c" PRIMARY KEY ("id"))`
    );
    await db.query(
      `CREATE INDEX "IDX_65aac0fc9960b9cfeccec52558" ON "como_calendar" ("contract") `
    );
    await db.query(
      `CREATE INDEX "IDX_169d48c1c86e664938fcf218bd" ON "como_calendar" ("address") `
    );
    await db.query(
      `CREATE INDEX "IDX_ef77678bfc2f645791a1a4e13f" ON "como_calendar" ("day") `
    );
  }

  async down(db) {
    await db.query(`DROP TABLE "objekt"`);
    await db.query(`DROP INDEX "public"."IDX_3e2b40803c0b64942151d0063b"`);
    await db.query(`DROP INDEX "public"."IDX_cc0196669f13f5958a307824a2"`);
    await db.query(`DROP INDEX "public"."IDX_d8c9587af788a5587c2a03496e"`);
    await db.query(`DROP INDEX "public"."IDX_d65fc785743546e3eb34c34d24"`);
    await db.query(`DROP INDEX "public"."IDX_dece9431c39a60cd7fa810e873"`);
    await db.query(`DROP INDEX "public"."IDX_6e97036b0295355bb484ef5c81"`);
    await db.query(`DROP INDEX "public"."IDX_645c594b9fa94609b836a14c83"`);
    await db.query(`DROP INDEX "public"."IDX_5b0745b5c4e63951327cea3164"`);
    await db.query(`DROP TABLE "como_calendar"`);
    await db.query(`DROP INDEX "public"."IDX_65aac0fc9960b9cfeccec52558"`);
    await db.query(`DROP INDEX "public"."IDX_169d48c1c86e664938fcf218bd"`);
    await db.query(`DROP INDEX "public"."IDX_ef77678bfc2f645791a1a4e13f"`);
  }
};

module.exports = class Data1700375196715 {
  name = "Data1700375196715";

  async up(db) {
    await db.query(
      `CREATE TABLE "transfer" ("id" character varying NOT NULL, "from" text NOT NULL, "to" text NOT NULL, "timestamp" timestamp NOT NULL, "token_id" integer NOT NULL, "objekt_id" character varying, CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id"))`
    );
    await db.query(
      `CREATE INDEX "IDX_be54ea276e0f665ffc38630fc0" ON "transfer" ("from") `
    );
    await db.query(
      `CREATE INDEX "IDX_4cbc37e8c3b47ded161f44c24f" ON "transfer" ("to") `
    );
    await db.query(
      `CREATE INDEX "IDX_98d4c0e33193fdd3edfc826c37" ON "transfer" ("objekt_id") `
    );
    await db.query(
      `CREATE TABLE "objekt" ("id" character varying NOT NULL, "contract" text NOT NULL, "timestamp" timestamp NOT NULL, "collection_id" text NOT NULL, "season" text NOT NULL, "member" text NOT NULL, "artist" text NOT NULL, "collection_no" text NOT NULL, "class" text NOT NULL, "front_image" text NOT NULL, "back_image" text NOT NULL, "background_color" text NOT NULL, "text_color" text NOT NULL, "como_amount" integer NOT NULL, "on_offline" text NOT NULL, CONSTRAINT "PK_a50fda223abd7f6ae55f2cf629f" PRIMARY KEY ("id"))`
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
      `ALTER TABLE "transfer" ADD CONSTRAINT "FK_98d4c0e33193fdd3edfc826c37f" FOREIGN KEY ("objekt_id") REFERENCES "objekt"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  async down(db) {
    await db.query(`DROP TABLE "transfer"`);
    await db.query(`DROP INDEX "public"."IDX_be54ea276e0f665ffc38630fc0"`);
    await db.query(`DROP INDEX "public"."IDX_4cbc37e8c3b47ded161f44c24f"`);
    await db.query(`DROP INDEX "public"."IDX_98d4c0e33193fdd3edfc826c37"`);
    await db.query(`DROP TABLE "objekt"`);
    await db.query(`DROP INDEX "public"."IDX_3e2b40803c0b64942151d0063b"`);
    await db.query(`DROP INDEX "public"."IDX_cc0196669f13f5958a307824a2"`);
    await db.query(`DROP INDEX "public"."IDX_d8c9587af788a5587c2a03496e"`);
    await db.query(`DROP INDEX "public"."IDX_d65fc785743546e3eb34c34d24"`);
    await db.query(`DROP INDEX "public"."IDX_dece9431c39a60cd7fa810e873"`);
    await db.query(`DROP INDEX "public"."IDX_6e97036b0295355bb484ef5c81"`);
    await db.query(`DROP INDEX "public"."IDX_645c594b9fa94609b836a14c83"`);
    await db.query(`DROP INDEX "public"."IDX_5b0745b5c4e63951327cea3164"`);
    await db.query(
      `ALTER TABLE "transfer" DROP CONSTRAINT "FK_98d4c0e33193fdd3edfc826c37f"`
    );
  }
};

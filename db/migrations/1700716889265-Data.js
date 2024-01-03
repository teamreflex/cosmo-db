module.exports = class Data1700716889265 {
  name = "Data1700716889265";

  async up(db) {
    await db.query(
      `CREATE TABLE "objekt" ("id" character varying NOT NULL, "owner" text NOT NULL, "minted_at" TIMESTAMP WITH TIME ZONE NOT NULL, "received_at" TIMESTAMP WITH TIME ZONE NOT NULL, "serial" integer NOT NULL, "collection_id" character varying, "transferable" boolean NOT NULL, CONSTRAINT "PK_a50fda223abd7f6ae55f2cf629f" PRIMARY KEY ("id"))`
    );
    await db.query(
      `CREATE INDEX "IDX_d2ddf18405b46538e169ab03e8" ON "objekt" ("owner") `
    );
    await db.query(
      `CREATE INDEX "IDX_cc0196669f13f5958a307824a2" ON "objekt" ("collection_id") `
    );
    await db.query(
      `CREATE TABLE "transfer" ("id" character varying NOT NULL, "from" text NOT NULL, "to" text NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "token_id" text NOT NULL, "objekt_id" character varying, "collection_id" character varying, CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id"))`
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
      `CREATE INDEX "IDX_15a8d2966ae7e5e9b2ff47104f" ON "transfer" ("collection_id") `
    );
    await db.query(
      `CREATE TABLE "collection" ("id" character varying NOT NULL, "contract" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "collection_id" text NOT NULL, "slug" text NOT NULL, "season" text NOT NULL, "member" text NOT NULL, "artist" text NOT NULL, "collection_no" text NOT NULL, "class" text NOT NULL, "thumbnail_image" text NOT NULL, "front_image" text NOT NULL, "back_image" text NOT NULL, "background_color" text NOT NULL, "text_color" text NOT NULL, "accent_color" text NOT NULL, "como_amount" integer NOT NULL, "on_offline" text NOT NULL, CONSTRAINT "PK_ad3f485bbc99d875491f44d7c85" PRIMARY KEY ("id"))`
    );
    await db.query(
      `CREATE INDEX "IDX_e814aff6539600dfcc88af41fc" ON "collection" ("contract") `
    );
    await db.query(
      `CREATE UNIQUE INDEX "IDX_f7f39206eb394d7d788699c600" ON "collection" ("slug") `
    );
    await db.query(
      `CREATE INDEX "IDX_81f585f60e03d2dc803d8a4945" ON "collection" ("season") `
    );
    await db.query(
      `CREATE INDEX "IDX_76242b6e82adf6f4ab4b388858" ON "collection" ("member") `
    );
    await db.query(
      `CREATE INDEX "IDX_6f89ec57ebbfd978e196751051" ON "collection" ("artist") `
    );
    await db.query(
      `CREATE INDEX "IDX_a8dbe2a49e54f73e2e7063dbb0" ON "collection" ("collection_no") `
    );
    await db.query(
      `CREATE INDEX "IDX_d01899107849250643b52f2324" ON "collection" ("class") `
    );
    await db.query(
      `CREATE INDEX "IDX_429351eac26f87942861266e48" ON "collection" ("on_offline") `
    );
    await db.query(
      `ALTER TABLE "objekt" ADD CONSTRAINT "FK_cc0196669f13f5958a307824a2b" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await db.query(
      `ALTER TABLE "transfer" ADD CONSTRAINT "FK_98d4c0e33193fdd3edfc826c37f" FOREIGN KEY ("objekt_id") REFERENCES "objekt"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await db.query(
      `ALTER TABLE "transfer" ADD CONSTRAINT "FK_15a8d2966ae7e5e9b2ff47104f0" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  async down(db) {
    await db.query(`DROP TABLE "objekt"`);
    await db.query(`DROP INDEX "public"."IDX_d2ddf18405b46538e169ab03e8"`);
    await db.query(`DROP INDEX "public"."IDX_cc0196669f13f5958a307824a2"`);
    await db.query(`DROP TABLE "transfer"`);
    await db.query(`DROP INDEX "public"."IDX_be54ea276e0f665ffc38630fc0"`);
    await db.query(`DROP INDEX "public"."IDX_4cbc37e8c3b47ded161f44c24f"`);
    await db.query(`DROP INDEX "public"."IDX_98d4c0e33193fdd3edfc826c37"`);
    await db.query(`DROP INDEX "public"."IDX_15a8d2966ae7e5e9b2ff47104f"`);
    await db.query(`DROP TABLE "collection"`);
    await db.query(`DROP INDEX "public"."IDX_e814aff6539600dfcc88af41fc"`);
    await db.query(`DROP INDEX "public"."IDX_f7f39206eb394d7d788699c600"`);
    await db.query(`DROP INDEX "public"."IDX_81f585f60e03d2dc803d8a4945"`);
    await db.query(`DROP INDEX "public"."IDX_76242b6e82adf6f4ab4b388858"`);
    await db.query(`DROP INDEX "public"."IDX_6f89ec57ebbfd978e196751051"`);
    await db.query(`DROP INDEX "public"."IDX_a8dbe2a49e54f73e2e7063dbb0"`);
    await db.query(`DROP INDEX "public"."IDX_d01899107849250643b52f2324"`);
    await db.query(`DROP INDEX "public"."IDX_429351eac26f87942861266e48"`);
    await db.query(
      `ALTER TABLE "objekt" DROP CONSTRAINT "FK_cc0196669f13f5958a307824a2b"`
    );
    await db.query(
      `ALTER TABLE "transfer" DROP CONSTRAINT "FK_98d4c0e33193fdd3edfc826c37f"`
    );
    await db.query(
      `ALTER TABLE "transfer" DROP CONSTRAINT "FK_15a8d2966ae7e5e9b2ff47104f0"`
    );
  }
};

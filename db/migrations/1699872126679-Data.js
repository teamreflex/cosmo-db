module.exports = class Data1699872126679 {
    name = 'Data1699872126679'

    async up(db) {
        await db.query(`ALTER TABLE "objekt" DROP CONSTRAINT "PK_a50fda223abd7f6ae55f2cf629f"`)
        await db.query(`ALTER TABLE "objekt" DROP COLUMN "id"`)
        await db.query(`ALTER TABLE "objekt" ADD "id" SERIAL NOT NULL`)
        await db.query(`ALTER TABLE "objekt" ADD CONSTRAINT "PK_a50fda223abd7f6ae55f2cf629f" PRIMARY KEY ("id")`)
        await db.query(`ALTER TABLE "como_calendar" DROP CONSTRAINT "PK_c7cd8ddc32f266bb7d4ebce879c"`)
        await db.query(`ALTER TABLE "como_calendar" DROP COLUMN "id"`)
        await db.query(`ALTER TABLE "como_calendar" ADD "id" SERIAL NOT NULL`)
        await db.query(`ALTER TABLE "como_calendar" ADD CONSTRAINT "PK_c7cd8ddc32f266bb7d4ebce879c" PRIMARY KEY ("id")`)
    }

    async down(db) {
        await db.query(`ALTER TABLE "objekt" ADD CONSTRAINT "PK_a50fda223abd7f6ae55f2cf629f" PRIMARY KEY ("id")`)
        await db.query(`ALTER TABLE "objekt" ADD "id" character varying NOT NULL`)
        await db.query(`ALTER TABLE "objekt" DROP COLUMN "id"`)
        await db.query(`ALTER TABLE "objekt" DROP CONSTRAINT "PK_a50fda223abd7f6ae55f2cf629f"`)
        await db.query(`ALTER TABLE "como_calendar" ADD CONSTRAINT "PK_c7cd8ddc32f266bb7d4ebce879c" PRIMARY KEY ("id")`)
        await db.query(`ALTER TABLE "como_calendar" ADD "id" character varying NOT NULL`)
        await db.query(`ALTER TABLE "como_calendar" DROP COLUMN "id"`)
        await db.query(`ALTER TABLE "como_calendar" DROP CONSTRAINT "PK_c7cd8ddc32f266bb7d4ebce879c"`)
    }
}

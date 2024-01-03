module.exports = class Data1700720000000 {
  name = "Data1700720000000";

  async up(db) {
    const dbName = process.env.DB_NAME;
    const readUser = process.env.DB_READ_USER;
    const readPass = process.env.DB_READ_PASS;

    // create role
    await db.query(`CREATE ROLE ${readUser} WITH LOGIN PASSWORD '${readPass}'`);
    // give connect privileges
    await db.query(`GRANT CONNECT ON DATABASE ${dbName} TO ${readUser}`);
    // allow public schema access
    await db.query(`GRANT USAGE ON SCHEMA public TO ${readUser}`);
    // give select privileges to all tables
    await db.query(
      `GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${readUser}`
    );
    // give select privileges to all sequences
    await db.query(
      `GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO ${readUser}`
    );
    // give select privileges to all future tables
    await db.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ${readUser}`
    );
    // give select privileges to all future sequences
    await db.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO ${readUser}`
    );
  }

  async down(db) {
    const readUser = process.env.DB_READ_USER;
    await db.query(`DROP USER IF EXISTS ${readUser}`);
  }
};

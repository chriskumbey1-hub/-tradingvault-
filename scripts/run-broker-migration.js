/**
 * Run broker integration migration
 * Usage: node scripts/run-broker-migration.js
 */

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres.sanidnusfseaoklekqph:Kumbey14life@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";

async function runMigration() {
  const client = new Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log("Connected to database");

    const sqlPath = path.join(__dirname, "..", "supabase", "broker-migration.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Execute the entire SQL file as one query (supports multiple statements)
    await client.query(sql);
    console.log("Migration executed successfully!");
  } catch (err) {
    if (err.code === "42710" || err.code === "42P07" || err.code === "42701") {
      console.log("Tables/indexes already exist — skipping");
    } else {
      console.error("Migration error:", err.message);
    }
  } finally {
    await client.end();
  }
}

runMigration();

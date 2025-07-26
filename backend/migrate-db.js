import { getDb } from "./utils/db.js";

const db = await getDb();

async function migrate() {
  const columns = await db.all(`PRAGMA table_info(content_fields)`);

  const hasColumn = (name) => columns.some((c) => c.name === name);

  if (!hasColumn("columns")) {
    await db.run(`ALTER TABLE content_fields ADD COLUMN columns INTEGER DEFAULT 12`);
    console.log("Hozzáadva: columns");
  }

  if (!hasColumn("description")) {
    await db.run(`ALTER TABLE content_fields ADD COLUMN description TEXT DEFAULT ''`);
    console.log("Hozzáadva: description");
  }

  if (!hasColumn("icon")) {
    await db.run(`ALTER TABLE content_fields ADD COLUMN icon TEXT DEFAULT ''`);
    console.log("Hozzáadva: icon");
  }

  console.log("Migráció kész.");
}

await migrate();

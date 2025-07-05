import { getDb } from "./utils/db.js";

const db = await getDb();

await db.exec(`
  CREATE TABLE IF NOT EXISTS content_meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );

 CREATE TABLE IF NOT EXISTS content_fields (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    name TEXT,
    type TEXT NOT NULL,
    placeholder TEXT,
    enabled INTEGER DEFAULT 1,
    required INTEGER DEFAULT 0,
    \`group\` TEXT,
    validations TEXT,
    source TEXT,
    sourceField TEXT,
    position INTEGER
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log("Adatbázis inicializálva: content_meta + content_fields.");

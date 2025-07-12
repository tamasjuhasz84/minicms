import { getDb } from "../utils/db.js";

export async function loadContent() {
  const db = await getDb();

  const form = await db.all("SELECT * FROM content_fields ORDER BY position ASC");

  const metaRows = await db.all("SELECT key, value FROM content_meta");
  const meta = Object.fromEntries(metaRows.map((row) => [row.key, JSON.parse(row.value)]));

  return {
    header: meta.header || {},
    footer: meta.footer || {},
    form: form.map((field) => ({
      id: field.id,
      label: field.label,
      name: field.name,
      type: field.type,
      placeholder: field.placeholder,
      enabled: !!field.enabled,
      required: !!field.required,
      validations: field.validations ? JSON.parse(field.validations) : {},
      source: field.source,
      sourceField: field.sourceField,
      sourceType: field.sourceType || "",
      options: field.options ? JSON.parse(field.options) : [],
    })),
  };
}

export async function saveContent(data) {
  const db = await getDb();
  const { header = {}, footer = {}, form = [] } = data;

  await db.run("DELETE FROM content_fields");
  await db.run("INSERT OR REPLACE INTO content_meta (key, value) VALUES (?, ?)", [
    "header",
    JSON.stringify(header),
  ]);
  await db.run("INSERT OR REPLACE INTO content_meta (key, value) VALUES (?, ?)", [
    "footer",
    JSON.stringify(footer),
  ]);

  const insertStmt = await db.prepare(`
    INSERT INTO content_fields (
      id, label, name, type, placeholder, enabled,
      required, validations, source, sourceField, options, position, sourceType
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    for (let index = 0; index < form.length; index++) {
      const f = form[index];
      await insertStmt.run(
        f.id,
        f.label,
        f.name,
        f.type,
        f.placeholder,
        f.enabled ? 1 : 0,
        f.required ? 1 : 0,
        JSON.stringify(f.validations || {}),
        f.source || "",
        f.sourceField || "",
        JSON.stringify(f.options || []),
        index,
        f.sourceType || "",
      );
    }
  } finally {
    await insertStmt.finalize();
  }
}

export function isValidContent(data) {
  return (
    data &&
    typeof data === "object" &&
    data.header &&
    typeof data.header.title === "string" &&
    (typeof data.header.image === "string" || data.header.image === undefined) &&
    data.footer &&
    typeof data.footer.title === "string" &&
    typeof data.footer.text === "string" &&
    Array.isArray(data.form) &&
    data.form.every(
      (f) =>
        typeof f.label === "string" &&
        typeof f.type === "string" &&
        ["text", "select", "switch", "number"].includes(f.type),
    )
  );
}

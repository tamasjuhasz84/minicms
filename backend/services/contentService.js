import { getDb } from "../utils/db.js";

export async function loadContent() {
  const db = await getDb();

  const form = await db.all("SELECT * FROM content_fields ORDER BY position ASC");

  const metaRows = await db.all("SELECT key, value FROM content_meta");
  const meta = Object.fromEntries(metaRows.map(row => [row.key, JSON.parse(row.value)]));

  return {
    header: meta.header || {},
    footer: meta.footer || {},
    form: form.map(field => ({
      id: field.id,
      label: field.label,
      name: field.name,
      type: field.type,
      placeholder: field.placeholder,
      enabled: !!field.enabled,
      required: !!field.required,
      group: field.group,
      validations: field.validations ? JSON.parse(field.validations) : {},
      source: field.source,
      sourceField: field.sourceField
    }))
  };
}

export async function saveContent(data) {
  const db = await getDb();

  const { header = {}, footer = {}, form = [] } = data;

  await db.run("DELETE FROM content_meta");
  await db.run("DELETE FROM content_fields");

  await db.run("INSERT INTO content_meta (key, value) VALUES (?, ?)", ["header", JSON.stringify(header)]);
  await db.run("INSERT INTO content_meta (key, value) VALUES (?, ?)", ["footer", JSON.stringify(footer)]);

  const insertStmt = await db.prepare(`
    INSERT INTO content_fields (
      id, label, name, type, placeholder, enabled,
      required, \`group\`, validations, source, sourceField, position
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        f.group || "",
        JSON.stringify(f.validations || {}),
        f.source || "",
        f.sourceField || "",
        index
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
    Array.isArray(data.form) &&
    data.form.every(
      (f) =>
        typeof f.label === "string" &&
        typeof f.type === "string" &&
        ["text", "select", "switch", "number"].includes(f.type)
    )
  );
}
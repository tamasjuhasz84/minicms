import { getDb } from "../utils/db.js";

export async function loadContent() {
  const db = await getDb();

  const form = await db.all("SELECT * FROM content_fields ORDER BY position ASC");

  const metaRows = await db.all("SELECT key, value FROM content_meta");
  const meta = Object.fromEntries(metaRows.map((row) => [row.key, JSON.parse(row.value)]));

  return {
    header: meta.header || {},
    footer: meta.footer || {},
    description: meta.description || { text: "" },
    styles: meta.styles || {},
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
      columns: typeof field.columns === "number" ? field.columns : 12, // <- új mező
      description: field.description || "", // <- leírás is visszatöltve
    })),
  };
}

export async function saveContent(data) {
  const db = await getDb();
  const { header = {}, footer = {}, styles = {}, description = {}, form = [] } = data;

  await db.run("DELETE FROM content_fields");

  await db.run("INSERT OR REPLACE INTO content_meta (key, value) VALUES (?, ?)", [
    "header",
    JSON.stringify(header),
  ]);
  await db.run("INSERT OR REPLACE INTO content_meta (key, value) VALUES (?, ?)", [
    "footer",
    JSON.stringify(footer),
  ]);
  await db.run("INSERT OR REPLACE INTO content_meta (key, value) VALUES (?, ?)", [
    "styles",
    JSON.stringify(styles),
  ]);
  await db.run("INSERT OR REPLACE INTO content_meta (key, value) VALUES (?, ?)", [
    "description",
    JSON.stringify(description),
  ]);

  const insertStmt = await db.prepare(`
    INSERT INTO content_fields (
      id, label, name, type, placeholder, enabled,
      required, validations, source, sourceField, options, position, sourceType,
      columns, description
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        typeof f.columns === "number" ? f.columns : 12,
        f.description || "",
      );
    }
  } finally {
    await insertStmt.finalize();
  }
}

export function isValidContent(data) {
  const validTypes = [
    "text",
    "textarea",
    "email",
    "tel",
    "date",
    "file",
    "select",
    "switch",
    "number",
    "slider",
    "range",
    "rating",
    "headline",
    "divider",
    "checkbox",
    "checkbox-group",
    "radio",
    "time",
  ];

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
        typeof f.label === "string" && typeof f.type === "string" && validTypes.includes(f.type),
    )
  );
}

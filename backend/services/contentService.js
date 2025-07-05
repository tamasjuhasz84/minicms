import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONTENT_PATH = path.join(__dirname, "..", "data", "content.json");

export async function loadContent() {
  const data = await fs.readFile(CONTENT_PATH, "utf-8");
  return JSON.parse(data);
}

export async function saveContent(data) {
  await fs.writeFile(CONTENT_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function isValidContent(data) {
  return (
    data &&
    Array.isArray(data.form) &&
    data.form.every(
      (f) =>
        typeof f.label === "string" &&
        typeof f.type === "string" &&
        ["text", "select", "switch", "number"].includes(f.type)
    )
  );
}

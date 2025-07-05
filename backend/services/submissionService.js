import { getDb } from "../utils/db.js";

export async function getAllSubmissions() {
  const db = await getDb();
  return db.all("SELECT * FROM submissions ORDER BY created_at DESC");
}

export async function addSubmission(data, ip) {
  const db = await getDb();
  await db.run("INSERT INTO submissions (data, ip_address) VALUES (?, ?)", [
    JSON.stringify(data),
    ip,
  ]);
}

export async function deleteSubmission(id) {
  const db = await getDb();
  const result = await db.run("DELETE FROM submissions WHERE id = ?", id);
  return result.changes;
}

export async function deleteAllSubmissions() {
  const db = await getDb();
  await db.run("DELETE FROM submissions");
}

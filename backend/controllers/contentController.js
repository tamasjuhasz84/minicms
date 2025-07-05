import {
  loadContent,
  saveContent as saveContentToDb,
  isValidContent,
} from "../services/contentService.js";

export async function getContent(req, res) {
  try {
    const data = await loadContent();
    res.json(data);
  } catch (err) {
    console.error("Hiba a tartalom betöltésekor:", err);
    res.status(500).json({ error: "Hiba a tartalom betöltésekor." });
  }
}

export async function saveContent(req, res) {
  try {
    const content = req.body;

    if (!isValidContent(content)) {
      return res.status(400).json({ error: "Érvénytelen űrlap struktúra." });
    }

    await saveContentToDb(content);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Hiba a tartalom mentésekor:", err);
    res.status(500).json({ error: "Hiba a tartalom mentésekor." });
  }
}

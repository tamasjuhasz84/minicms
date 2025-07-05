import * as contentService from "../services/contentService.js";

export async function getContent(req, res) {
  try {
    const content = await contentService.loadContent();
    res.json(content);
  } catch (err) {
    console.error("Hiba tartalom lekérésekor:", err);
    res.status(500).json({ error: "Nem sikerült betölteni a tartalmat." });
  }
}

export async function saveContent(req, res) {
  try {
    if (!contentService.isValidContent(req.body)) {
      return res.status(400).json({ error: "Érvénytelen tartalomstruktúra" });
    }

    await contentService.saveContent(req.body);
    res.json({ message: "A tartalom frissítve lett." });
  } catch (err) {
    console.error("Hiba mentéskor:", err);
    res.status(500).json({ error: "Nem sikerült menteni a tartalmat" });
  }
}

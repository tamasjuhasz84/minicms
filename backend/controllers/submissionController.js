import * as submissionService from "../services/submissionService.js";

export async function getSubmissions(req, res) {
  try {
    const rows = await submissionService.getAllSubmissions();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Lekérdezési hiba" });
  }
}

export async function submitForm(req, res) {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "ismeretlen";
    await submissionService.addSubmission(req.body, ip);
    res.json({ success: true, message: "Mentés sikeres." });
  } catch (err) {
    console.error("Mentési hiba:", err);
    res.status(500).json({ success: false, message: "Mentési hiba." });
  }
}

export async function deleteSubmissionById(req, res) {
  try {
    const deleted = await submissionService.deleteSubmission(req.params.id);
    if (deleted === 0)
      return res.status(404).json({ error: "Nem található a beküldés" });
    res.json({ success: true, message: `Törölve: ${req.params.id}` });
  } catch (err) {
    res.status(500).json({ error: "Törlési hiba" });
  }
}

export async function deleteAll(req, res) {
  try {
    await submissionService.deleteAllSubmissions();
    res.json({ success: true, message: "Összes beküldés törölve." });
  } catch (err) {
    res.status(500).json({ error: "Nem sikerült törölni az összes beküldést" });
  }
}

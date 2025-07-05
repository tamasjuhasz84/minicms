import { getStaticOptions } from "../services/optionsService.js";

export function getOptions(req, res) {
  try {
    const options = getStaticOptions();
    res.json(options);
  } catch (err) {
    console.error("Hiba az opciók lekérésekor:", err);
    res.status(500).json({ error: "Nem sikerült lekérni az opciókat" });
  }
}

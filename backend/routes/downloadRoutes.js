import express from "express";
import path from "path";
import fs from "fs";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();
const UPLOAD_DIR = path.join("data", "uploads");

router.get("/:filename", verifyToken, (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fájl nem található." });
  }
  res.sendFile(filePath, { root: "." });
});

export default router;

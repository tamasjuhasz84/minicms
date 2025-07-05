import express from "express";
import { getContent, saveContent } from "../controllers/contentController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", getContent);
router.post("/", verifyToken, saveContent);

export default router;

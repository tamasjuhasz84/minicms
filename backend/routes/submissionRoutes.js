import express from "express";
import {
  submitForm,
  getSubmissions,
} from "../controllers/submissionController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", submitForm); // POST /submit
router.get("/", verifyToken, getSubmissions); // GET /submissions

export default router;

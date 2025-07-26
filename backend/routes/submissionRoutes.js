import express from "express";
import {
  submitForm,
  getSubmissions,
  deleteSubmissionById,
  deleteAll,
} from "../controllers/submissionController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/", upload.any(), submitForm);
router.post("/", submitForm); // POST /submit
router.get("/", verifyToken, getSubmissions); // GET /submissions
router.delete("/", verifyToken, deleteAll); // DELETE /submissions
router.delete("/:id", verifyToken, deleteSubmissionById); // DELETE /submissions/:id

export default router;

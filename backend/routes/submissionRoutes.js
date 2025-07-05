import express from "express";
import {
  getSubmissions,
  submitForm,
  deleteSubmissionById,
  deleteAll,
} from "../controllers/submissionController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getSubmissions);
router.post("/", submitForm);
router.delete("/:id", verifyToken, deleteSubmissionById);
router.delete("/", verifyToken, deleteAll);

export default router;

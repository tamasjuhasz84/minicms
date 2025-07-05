import express from "express";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import submissionRoutes from "./routes/submissionRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import optionsRoutes from "./routes/optionsRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiter csak /submit-re
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Túl sok kérés érkezett. Kérlek, próbáld meg később.",
});

// Global middlewares
app.use(helmet());
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE"],
    credentials: false,
  })
);

// Routes
app.use("/submit", limiter, submissionRoutes);
app.use("/submissions", submissionRoutes);
app.use("/content", contentRoutes);
app.use("/", authRoutes);
app.use("/options", optionsRoutes);

// HTTPS redirect (production only)
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.protocol !== "https") {
      return res.redirect("https://" + req.get("host") + req.url);
    }
    next();
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Backend fut: http://localhost:${PORT}`);
});

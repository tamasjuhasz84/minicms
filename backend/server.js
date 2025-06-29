const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;
const CONTENT_PATH = path.join(__dirname, "data", "content.json");
const DB_PATH = path.join(__dirname, "data", "submissions.db");
const API_KEY = process.env.API_KEY || "secret";
app.use(helmet());

// Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/submit", limiter); // Apply the rate limit for the /submit endpoint

// CORS - restrict allowed origins
app.use(
  cors({
    origin: "https://your-allowed-domain.com", // adjust accordingly
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Body parsing middleware
app.use(bodyParser.json());

// SQLite adatbázis inicializálása
const db = new sqlite3.Database(DB_PATH);
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const validUsers = {
    admin147: "admin147",
  };

  if (validUsers[username] && validUsers[username] === password) {
    res.json({
      success: true,
      role: username.startsWith("admin") ? "admin" : "user",
    });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Tartalom lekérdezése
app.get("/content", (req, res) => {
  fs.readFile(CONTENT_PATH, "utf-8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to load content." });
    res.json(JSON.parse(data));
  });
});

// JSON struktúra ellenőrzése mentés előtt
function isValidContent(data) {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.form)) return false;
  return data.form.every(
    (field) =>
      typeof field.label === "string" &&
      typeof field.type === "string" &&
      ["text", "select", "switch", "number"].includes(field.type)
  );
}

// Tartalom mentése
app.post("/content", (req, res) => {
  if (req.query.api_key !== API_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  if (!isValidContent(req.body)) {
    return res.status(400).json({ error: "Invalid content structure." });
  }

  fs.writeFile(
    CONTENT_PATH,
    JSON.stringify(req.body, null, 2),
    "utf-8",
    (err) => {
      if (err)
        return res.status(500).json({ error: "Failed to save content." });
      res.json({ message: "Content updated successfully." });
    }
  );
});

// Select mezőhöz opciók kiszolgálása
app.get("/options", (req, res) => {
  const options = {
    type: [
      { value: "basic", text: "Alap csomag" },
      { value: "premium", text: "Prémium csomag" },
      { value: "enterprise", text: "Vállalati csomag" },
    ],
  };
  res.json(options);
});

// Kalkuláció beküldése és mentése adatbázisba
app.post("/submit", (req, res) => {
  const submittedData = req.body;
  console.log("Beküldött adat:", submittedData);

  const stmt = db.prepare("INSERT INTO submissions (data) VALUES (?)");
  stmt.run(JSON.stringify(submittedData), (err) => {
    if (err) {
      console.error("Hiba adatbázismentéskor:", err);
      return res
        .status(500)
        .json({ success: false, message: "Adatmentési hiba." });
    }
    res.json({ success: true, message: "Adat mentve az adatbázisba." });
  });
  stmt.finalize();
});

// Adatlekérés admin részére
app.get("/submissions", (req, res) => {
  db.all("SELECT * FROM submissions ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: "DB lekérdezési hiba" });
    res.json(rows);
  });
});

app.delete("/submissions/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM submissions WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Hiba törlés közben:", err);
      return res
        .status(500)
        .json({ error: "Nem sikerült törölni a rekordot." });
    }
    if (this.changes === 0) {
      return res
        .status(404)
        .json({ error: "Nincs ilyen azonosítójú beküldés." });
    }
    res.json({ success: true, message: `Beküldés ${id} törölve.` });
  });
});

app.delete("/submissions", (req, res) => {
  db.run("DELETE FROM submissions", function (err) {
    if (err) {
      console.error("Hiba az összes törlése közben:", err);
      return res
        .status(500)
        .json({ error: "Nem sikerült törölni a beküldéseket." });
    }
    res.json({ success: true, message: "Összes beküldés törölve." });
  });
});

// Https redirect (ha élesben HTTPS-t használsz)
// Ha a szerver nem HTTPS-en fut, átirányítja HTTP-ről HTTPS-re
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.protocol !== "https") {
      return res.redirect("https://" + req.get("host") + req.url);
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;
const CONTENT_PATH = path.join(__dirname, "data", "content.json");
const DB_PATH = path.join(__dirname, "data", "submissions.db");
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

app.use(helmet());
app.use(bodyParser.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Túl sok kérés érkezett. Kérlek, próbáld meg később.",
});
app.use("/submit", limiter);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE"],
    credentials: false,
  })
);

// SQLite init
const db = new sqlite3.Database(DB_PATH);
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT
    )
  `);

  db.all("PRAGMA table_info(submissions)", (err, columns) => {
    if (err)
      return console.error("Nem sikerült lekérdezni az oszlopokat:", err);
    const hasIp = columns.some((col) => col.name === "ip_address");
    if (!hasIp) {
      db.run("ALTER TABLE submissions ADD COLUMN ip_address TEXT", (err) => {
        if (err) console.error("Nem sikerült IP mezőt hozzáadni:", err.message);
        else console.log("ip_address mező hozzáadva.");
      });
    }
  });
});

// Middleware: JWT ellenőrzés
function verifyToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token hiányzik" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Érvénytelen token" });
    req.user = user;
    next();
  });
}

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USER) {
    return res
      .status(401)
      .json({ success: false, message: "Hibás felhasználónév" });
  }

  bcrypt.compare(password, ADMIN_PASS_HASH, (err, result) => {
    if (err || !result) {
      return res
        .status(401)
        .json({ success: false, message: "Hibás bejelentkezés" });
    }

    const token = jwt.sign({ username, role: "admin" }, JWT_SECRET, {
      expiresIn: "2h",
    });
    res.json({ success: true, role: "admin", token });
  });
});

// Publikus tartalom lekérés
app.get("/content", (req, res) => {
  fs.readFile(CONTENT_PATH, "utf-8", (err, data) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Nem sikerült betölteni a tartalmat." });
    res.json(JSON.parse(data));
  });
});

// Tartalom validálása
function isValidContent(data) {
  return (
    data &&
    Array.isArray(data.form) &&
    data.form.every(
      (f) =>
        typeof f.label === "string" &&
        typeof f.type === "string" &&
        ["text", "select", "switch", "number"].includes(f.type)
    )
  );
}

// Tartalom mentés
app.post("/content", verifyToken, (req, res) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Nincs jogosultság" });

  if (!isValidContent(req.body)) {
    return res.status(400).json({ error: "Érvénytelen tartalomstruktúra" });
  }

  fs.writeFile(
    CONTENT_PATH,
    JSON.stringify(req.body, null, 2),
    "utf-8",
    (err) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Nem sikerült menteni a tartalmat" });
      res.json({ message: "A tartalom frissítve lett." });
    }
  );
});

// Select mező opciók
app.get("/options", (req, res) => {
  res.json({
    type: [
      { value: "basic", text: "Alap csomag" },
      { value: "premium", text: "Prémium csomag" },
      { value: "enterprise", text: "Vállalati csomag" },
    ],
  });
});

// Beküldés mentése IP-vel
app.post("/submit", (req, res) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    "ismeretlen";

  const stmt = db.prepare(
    "INSERT INTO submissions (data, ip_address) VALUES (?, ?)"
  );
  stmt.run(JSON.stringify(req.body), ip, (err) => {
    if (err) {
      console.error("Hiba mentéskor:", err);
      return res.status(500).json({ success: false, message: "Mentési hiba." });
    }
    res.json({ success: true, message: "Mentés sikeres." });
  });
  stmt.finalize();
});

// Beküldések lekérése
app.get("/submissions", verifyToken, (req, res) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Nincs jogosultság" });

  db.all("SELECT * FROM submissions ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: "Lekérdezési hiba" });
    res.json(rows);
  });
});

// Egy beküldés törlése
app.delete("/submissions/:id", verifyToken, (req, res) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Nincs jogosultság" });

  db.run(
    "DELETE FROM submissions WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Törlési hiba" });
      if (this.changes === 0)
        return res.status(404).json({ error: "Nem található a beküldés" });
      res.json({ success: true, message: `Törölve: ${req.params.id}` });
    }
  );
});

// Összes beküldés törlése
app.delete("/submissions", verifyToken, (req, res) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Nincs jogosultság" });

  db.run("DELETE FROM submissions", function (err) {
    if (err)
      return res
        .status(500)
        .json({ error: "Nem sikerült törölni az összes beküldést" });
    res.json({ success: true, message: "Összes beküldés törölve." });
  });
});

// HTTPS redirect csak production környezetben
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

import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
  const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token hiányzik" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Érvénytelen token" });
    req.user = user;
    next();
  });
}

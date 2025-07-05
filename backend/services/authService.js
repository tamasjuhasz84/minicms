import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

console.log("ADMIN_USER:", ADMIN_USER);
console.log("ADMIN_PASS_HASH:", ADMIN_PASS_HASH);

export async function verifyCredentials(username, password) {
  if (username !== ADMIN_USER) return false;
  return bcrypt.compare(password, ADMIN_PASS_HASH);
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
}

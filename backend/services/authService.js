import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function verifyCredentials(username, password) {
  const adminUser = process.env.ADMIN_USER;
  const adminPassHash = process.env.ADMIN_PASS_HASH;

  if (username !== adminUser) return false;
  return bcrypt.compare(password, adminPassHash);
}

export function generateToken(payload) {
  const jwtSecret = process.env.JWT_SECRET || "supersecretkey";
  return jwt.sign(payload, jwtSecret, { expiresIn: "2h" });
}

import * as authService from "../services/authService.js";

export async function login(req, res) {
  const { username, password } = req.body;

  try {
    const isValid = await authService.verifyCredentials(username, password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Hibás bejelentkezés",
      });
    }

    const token = authService.generateToken({ username, role: "admin" });

    return res.json({
      success: true,
      role: "admin",
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Szerver hiba" });
  }
}

import jwt from "jsonwebtoken";

/**
 * Verifies the Supabase JWT (access_token). 
 * After verification, attaches decoded payload to req.user (payload includes `sub` which is user id).
 */
export default function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader) return res.status(401).json({ error: "Missing Authorization header" });

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ error: "Malformed Authorization header" });

    const token = parts[1];
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) return res.status(500).json({ error: "Server misconfiguration: missing SUPABASE_JWT_SECRET" });

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        console.error("JWT verify error:", err);
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      // decoded is the token payload — includes `sub` (user id), `email`, `role`, etc.
      req.user = decoded;
      next();
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

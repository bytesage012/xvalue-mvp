import express from "express";

/**
 * Factory that returns the auth router given a supabase client
 * - POST /signup { email, password, full_name? }
 * - POST /login  { email, password }
 * - POST /refresh (optional) - left out for simplicity (use supabase client on frontend)
 */
export default function authRoutes(supabase) {
  const router = express.Router();

  // Signup: create user in auth, then create a profile row (if profiles table exists)
  router.post("/signup", async (req, res) => {
    try {
      const { email, password, full_name } = req.body;
      if (!email || !password) return res.status(400).json({ error: "email and password required" });

      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) return res.status(400).json({ error: error.message });

      // If signup succeeded, try to create a profile row (non-blocking - but we will attempt)
      try {
        const userId = data.user?.id;
        if (userId) {
          const profilePayload = { id: userId };
          if (full_name) profilePayload.full_name = full_name;
          await supabase.from("profiles").insert([profilePayload]);
        }
      } catch (profileErr) {
        // Log but don't break signup
        console.error("Profile insert warning:", profileErr);
      }

      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Login: returns user + session (access_token)
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "email and password required" });

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(400).json({ error: error.message });

      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Optional: get current user by access token (can be used to validate token)
  router.get("/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Missing token" });

      const { data, error } = await supabase.auth.getUser(token);
      if (error) return res.status(401).json({ error: error.message });

      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

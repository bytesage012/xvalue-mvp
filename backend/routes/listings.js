import express from "express";
import requireAuth from "../middleware/requireAuth.js";

export default function listingRoutes(supabase) {
  const router = express.Router();

  // Public GET (if you want listings to be public, remove requireAuth)
  router.get("/", async (req, res) => {
    try {
      const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
      if (error) return res.status(400).json({ error: error.message });
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a listing - protected
  router.post("/", requireAuth, async (req, res) => {
    try {
      const { title, price } = req.body;
      if (!title || price == null) return res.status(400).json({ error: "title and price required" });

      // req.user.sub is the Supabase user id
      const owner_id = req.user?.sub || null;

      const { data, error } = await supabase
        .from("listings")
        .insert([{ title, price, owner_id }])
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Optional: GET single listing
  router.get("/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { data, error } = await supabase.from("listings").select("*").eq("id", id).single();
      if (error) return res.status(404).json({ error: error.message });
      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Optional: delete/update - you can requireAuth and ensure owner_id matches req.user.sub
  router.delete("/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      // ensure owner
      const { data: listing, error: selectErr } = await supabase.from("listings").select("*").eq("id", id).single();
      if (selectErr) return res.status(404).json({ error: selectErr.message });

      if (listing.owner_id !== req.user.sub) return res.status(403).json({ error: "Not allowed" });

      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) return res.status(400).json({ error: error.message });

      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

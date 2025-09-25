import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// For __dirname in ESM:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Supabase client (backend uses service role key)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Import route factories
import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listings.js";

// Wire routes (pass supabase client)
app.use("/api/auth", authRoutes(supabase));
app.use("/api/listings", listingRoutes(supabase));

app.get("/", (req, res) => {
  res.json({ message: "Xvalue backend running" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`✅ Backend running on http://localhost:${port}`);
});

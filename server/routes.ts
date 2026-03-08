import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWaitlistEntrySchema, insertBlogPostSchema, updateBlogPostSchema } from "@shared/schema";
import { googleSheetsService } from "./services/google-sheets";
import { supabase } from "./lib/supabase";
import crypto from "crypto";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Supabase Auth ────────────────────────────────────────────────────

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ message: "Session expired" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {

  // ── Waitlist Routes ────────────────────────────────────────────────

  app.get("/api/waitlist/count", async (req, res) => {
    try {
      let count = 0;
      try {
        count = await googleSheetsService.getWaitlistCountFromSheet();
      } catch (error) {
        console.log('Google Sheets unavailable, using memory storage count');
        count = await storage.getWaitlistCount();
      }
      res.json({ count });
    } catch (error) {
      console.error('Error getting waitlist count:', error);
      res.status(500).json({
        message: "Failed to get waitlist count",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/waitlist", async (req, res) => {
    try {
      const validatedData = insertWaitlistEntrySchema.parse(req.body);
      const emailExists = await storage.isEmailInWaitlist(validatedData.email);
      if (emailExists) {
        return res.status(400).json({ message: "Email already registered in waitlist" });
      }
      try {
        await googleSheetsService.addEmailToSheet(validatedData.email);
      } catch (error) {
        console.error('Failed to add to Google Sheets:', error);
      }
      // Store subscriber preference in Supabase
      try {
        await supabase.from("waitlist_subscribers").upsert({
          email: validatedData.email,
          receive_updates: validatedData.receiveUpdates !== false,
        }, { onConflict: "email" });
      } catch (error) {
        console.error('Failed to save subscriber preference:', error);
      }
      const entry = await storage.addToWaitlist(validatedData);
      let count = 0;
      try {
        count = await googleSheetsService.getWaitlistCountFromSheet();
      } catch (error) {
        count = await storage.getWaitlistCount();
      }
      res.status(201).json({
        message: "Successfully added to waitlist",
        entry: { id: entry.id, email: entry.email },
        count
      });
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      if (error instanceof Error) {
        if (error.message === "Email already registered") {
          return res.status(400).json({ message: error.message });
        }
        if (error.name === 'ZodError') {
          return res.status(400).json({ message: "Invalid email format", error: error.message });
        }
      }
      res.status(500).json({
        message: "Failed to add email to waitlist",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ── Admin Auth (Supabase) ──────────────────────────────────────────

  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });
    if (error || !data.session) {
      return res.status(401).json({ message: error?.message || "Invalid credentials" });
    }
    return res.json({
      token: data.session.access_token,
      message: "Login successful",
    });
  });

  app.post("/api/admin/logout", requireAdmin, async (req, res) => {
    // Supabase handles session invalidation; just acknowledge
    res.json({ message: "Logged out" });
  });

  app.get("/api/admin/verify", requireAdmin, (req, res) => {
    res.json({ authenticated: true });
  });

  // ── Image Upload (Supabase Storage) ─────────────────────────────────

  app.post("/api/admin/upload", requireAdmin, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const ext = req.file.originalname.split(".").pop() || "png";
      const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

      const { error } = await supabase.storage
        .from("blog-images")
        .upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Storage upload error:", error);
        return res.status(500).json({ message: "Upload failed", error: error.message });
      }

      const { data: urlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filename);

      res.json({ url: urlData.publicUrl });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // ── Admin Blog CRUD (protected) ───────────────────────────────────

  app.get("/api/admin/blogs", requireAdmin, async (req, res) => {
    try {
      const posts = await storage.getAllBlogPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/admin/blogs/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getBlogPost(id);
      if (!post) return res.status(404).json({ message: "Post not found" });
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post("/api/admin/blogs", requireAdmin, async (req, res) => {
    try {
      const validated = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(validated);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", error: error.message });
      }
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.put("/api/admin/blogs/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = updateBlogPostSchema.parse(req.body);
      const post = await storage.updateBlogPost(id, validated);
      if (!post) return res.status(404).json({ message: "Post not found" });
      res.json(post);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", error: error.message });
      }
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.delete("/api/admin/blogs/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBlogPost(id);
      if (!success) return res.status(404).json({ message: "Post not found" });
      res.json({ message: "Post deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // ── Public Blog API ────────────────────────────────────────────────

  app.get("/api/blogs", async (req, res) => {
    try {
      const posts = await storage.getPublishedBlogPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blogs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getBlogPost(id);
      if (!post || post.status !== "published") {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  // Admin preview — returns any post regardless of status
  app.get("/api/admin/blogs/preview/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getBlogPost(id);
      if (!post) return res.status(404).json({ message: "Post not found" });
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

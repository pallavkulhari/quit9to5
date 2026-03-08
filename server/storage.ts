import {
  users, type User, type InsertUser,
  waitlistEntries, type WaitlistEntry, type InsertWaitlistEntry,
  type BlogPost, type InsertBlogPost, type UpdateBlogPost,
} from "@shared/schema";
import { supabase } from "./lib/supabase";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Waitlist methods
  addToWaitlist(entry: InsertWaitlistEntry): Promise<WaitlistEntry>;
  getWaitlistCount(): Promise<number>;
  isEmailInWaitlist(email: string): Promise<boolean>;
  getAllWaitlistEntries(): Promise<WaitlistEntry[]>;

  // Blog methods (Supabase)
  getAllBlogPosts(): Promise<BlogPost[]>;
  getPublishedBlogPosts(): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: UpdateBlogPost): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private waitlistEntries: Map<number, WaitlistEntry>;
  private userCurrentId: number;
  private waitlistCurrentId: number;

  constructor() {
    this.users = new Map();
    this.waitlistEntries = new Map();
    this.userCurrentId = 1;
    this.waitlistCurrentId = 1;
  }

  // ── User methods ─────────────────────────────────────────────────────

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // ── Waitlist methods ─────────────────────────────────────────────────

  async addToWaitlist(insertEntry: InsertWaitlistEntry): Promise<WaitlistEntry> {
    const existingEntry = Array.from(this.waitlistEntries.values()).find(
      (entry) => entry.email === insertEntry.email
    );
    if (existingEntry) {
      throw new Error("Email already registered");
    }
    const id = this.waitlistCurrentId++;
    const entry: WaitlistEntry = {
      ...insertEntry,
      id,
      createdAt: new Date(),
    };
    this.waitlistEntries.set(id, entry);
    return entry;
  }

  async getWaitlistCount(): Promise<number> {
    return this.waitlistEntries.size;
  }

  async isEmailInWaitlist(email: string): Promise<boolean> {
    return Array.from(this.waitlistEntries.values()).some(
      (entry) => entry.email === email
    );
  }

  async getAllWaitlistEntries(): Promise<WaitlistEntry[]> {
    return Array.from(this.waitlistEntries.values()).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  // ── Blog methods (Supabase Postgres) ─────────────────────────────────

  private mapRow(row: any): BlogPost {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: row.content,
      coverImage: row.cover_image,
      date: row.date,
      readTime: row.read_time,
      author: row.author,
      featured: row.featured,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async getAllBlogPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("id", { ascending: false });
    if (error) throw new Error(`Supabase error: ${error.message}`);
    return (data || []).map(this.mapRow);
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("id", { ascending: false });
    if (error) throw new Error(`Supabase error: ${error.message}`);
    return (data || []).map(this.mapRow);
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return undefined;
    return this.mapRow(data);
  }

  async createBlogPost(insert: InsertBlogPost): Promise<BlogPost> {
    // Only one post can be featured at a time
    if (insert.featured) {
      await supabase.from("blog_posts").update({ featured: false }).eq("featured", true);
    }
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        title: insert.title,
        slug: insert.slug,
        excerpt: insert.excerpt,
        content: insert.content,
        cover_image: insert.coverImage,
        date: insert.date,
        read_time: insert.readTime,
        author: insert.author || "Pallav Kulhari",
        featured: insert.featured || false,
        status: insert.status || "draft",
      })
      .select()
      .single();
    if (error) throw new Error(`Supabase error: ${error.message}`);
    return this.mapRow(data);
  }

  async updateBlogPost(id: number, update: UpdateBlogPost): Promise<BlogPost | undefined> {
    // Only one post can be featured at a time
    if (update.featured) {
      await supabase.from("blog_posts").update({ featured: false }).eq("featured", true);
    }
    // Build update object with snake_case keys
    const updateObj: Record<string, any> = { updated_at: new Date().toISOString() };
    if (update.title !== undefined) updateObj.title = update.title;
    if (update.slug !== undefined) updateObj.slug = update.slug;
    if (update.excerpt !== undefined) updateObj.excerpt = update.excerpt;
    if (update.content !== undefined) updateObj.content = update.content;
    if (update.coverImage !== undefined) updateObj.cover_image = update.coverImage;
    if (update.date !== undefined) updateObj.date = update.date;
    if (update.readTime !== undefined) updateObj.read_time = update.readTime;
    if (update.author !== undefined) updateObj.author = update.author;
    if (update.featured !== undefined) updateObj.featured = update.featured;
    if (update.status !== undefined) updateObj.status = update.status;

    const { data, error } = await supabase
      .from("blog_posts")
      .update(updateObj)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) return undefined;
    return this.mapRow(data);
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", id);
    return !error;
  }
}

export const storage = new MemStorage();

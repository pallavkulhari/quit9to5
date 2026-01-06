import { users, type User, type InsertUser, waitlistEntries, type WaitlistEntry, type InsertWaitlistEntry } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Waitlist methods
  addToWaitlist(entry: InsertWaitlistEntry): Promise<WaitlistEntry>;
  getWaitlistCount(): Promise<number>;
  isEmailInWaitlist(email: string): Promise<boolean>;
  getAllWaitlistEntries(): Promise<WaitlistEntry[]>;
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

  async addToWaitlist(insertEntry: InsertWaitlistEntry): Promise<WaitlistEntry> {
    // Check if email already exists
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
}

export const storage = new MemStorage();

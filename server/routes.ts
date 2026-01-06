import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWaitlistEntrySchema } from "@shared/schema";
import { googleSheetsService } from "./services/google-sheets";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get waitlist count
  app.get("/api/waitlist/count", async (req, res) => {
    try {
      // Try to get count from Google Sheets first, fallback to memory storage
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

  // Add email to waitlist
  app.post("/api/waitlist", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertWaitlistEntrySchema.parse(req.body);
      
      // Check if email already exists in memory storage
      const emailExists = await storage.isEmailInWaitlist(validatedData.email);
      if (emailExists) {
        return res.status(400).json({ 
          message: "Email already registered in waitlist" 
        });
      }

      // Add to Google Sheets first
      try {
        await googleSheetsService.addEmailToSheet(validatedData.email);
      } catch (error) {
        console.error('Failed to add to Google Sheets:', error);
        // Continue with memory storage even if Google Sheets fails
      }

      // Add to memory storage
      const entry = await storage.addToWaitlist(validatedData);
      
      // Get updated count
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
        
        // Handle validation errors
        if (error.name === 'ZodError') {
          return res.status(400).json({ 
            message: "Invalid email format",
            error: error.message
          });
        }
      }

      res.status(500).json({ 
        message: "Failed to add email to waitlist",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertParkingLotSchema,
  insertParkingSpaceSchema,
  insertBookingSchema,
  insertReviewSchema,
} from "@shared/schema";

// For session storage in memory
import MemoryStore from "memorystore";
const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 24 hours
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "smart-parking-secret",
    })
  );

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: () => void) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireOwner = async (req: Request, res: Response, next: () => void) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "owner") {
      return res.status(403).json({ message: "Forbidden: Owner access required" });
    }
    
    next();
  };

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      req.session.userId = user.id;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error during registration" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      req.session.userId = user.id;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error during login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Parking lot routes
  app.get("/api/parking-lots", async (req, res) => {
    try {
      const parkingLots = await storage.getParkingLots();
      res.status(200).json(parkingLots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parking lots" });
    }
  });

  app.get("/api/parking-lots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parkingLot = await storage.getParkingLot(id);
      
      if (!parkingLot) {
        return res.status(404).json({ message: "Parking lot not found" });
      }
      
      res.status(200).json(parkingLot);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parking lot" });
    }
  });

  app.get("/api/owner/parking-lots", requireOwner, async (req, res) => {
    try {
      const parkingLots = await storage.getParkingLotsByOwner((req.session as any).userId!);
      res.status(200).json(parkingLots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch owner's parking lots" });
    }
  });

  app.post("/api/parking-lots", requireOwner, async (req, res) => {
    try {
      const parkingLotData = insertParkingLotSchema.parse({
        ...req.body,
        ownerId: (req.session as any).userId
      });
      
      const parkingLot = await storage.createParkingLot(parkingLotData);
      res.status(201).json(parkingLot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create parking lot" });
    }
  });

  app.patch("/api/parking-lots/:id", requireOwner, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parkingLot = await storage.getParkingLot(id);
      if (!parkingLot) {
        return res.status(404).json({ message: "Parking lot not found" });
      }
      if (parkingLot.ownerId !== (req.session as any).userId) {
        return res.status(403).json({ message: "Not authorized to update this parking lot" });
      }
      const updatedParkingLot = await storage.updateParkingLot(id, req.body);
      res.status(200).json(updatedParkingLot);
    } catch (error) {
      res.status(500).json({ message: "Failed to update parking lot" });
    }
  });

  // Parking space routes
  app.get("/api/parking-lots/:id/spaces", async (req, res) => {
    try {
      const parkingLotId = parseInt(req.params.id);
      const parkingLot = await storage.getParkingLot(parkingLotId);
      
      if (!parkingLot) {
        return res.status(404).json({ message: "Parking lot not found" });
      }
      
      const spaces = await storage.getParkingSpaces(parkingLotId);
      res.status(200).json(spaces);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parking spaces" });
    }
  });

  app.post("/api/parking-spaces", requireOwner, async (req, res) => {
    try {
      const spaceData = insertParkingSpaceSchema.parse(req.body);
      
      const parkingLot = await storage.getParkingLot(spaceData.parkingLotId);
      if (!parkingLot) {
        return res.status(404).json({ message: "Parking lot not found" });
      }
      
      if (parkingLot.ownerId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to add spaces to this parking lot" });
      }
      
      const space = await storage.createParkingSpace(spaceData);
      res.status(201).json(space);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create parking space" });
    }
  });

  app.patch("/api/parking-spaces/:id/status", requireOwner, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!["available", "occupied", "reserved"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const space = await storage.getParkingSpace(id);
      if (!space) {
        return res.status(404).json({ message: "Parking space not found" });
      }
      const parkingLot = await storage.getParkingLot(space.parkingLotId);
      if (!parkingLot || parkingLot.ownerId !== (req.session as any).userId) {
        return res.status(403).json({ message: "Not authorized to update this parking space" });
      }
      const updatedSpace = await storage.updateParkingSpaceStatus(id, status);
      res.status(200).json(updatedSpace);
    } catch (error) {
      res.status(500).json({ message: "Failed to update parking space status" });
    }
  });

  // Booking routes
  app.get("/api/bookings", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId!;
      const bookings = await storage.getBookings(userId);
      res.status(200).json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/parking-lots/:id/bookings", requireOwner, async (req, res) => {
    try {
      const parkingLotId = parseInt(req.params.id);
      const parkingLot = await storage.getParkingLot(parkingLotId);
      
      if (!parkingLot) {
        return res.status(404).json({ message: "Parking lot not found" });
      }
      
      if (parkingLot.ownerId !== (req.session as any).userId) {
        return res.status(403).json({ message: "Not authorized to view bookings for this parking lot" });
      }
      
      const bookings = await storage.getBookings(undefined, parkingLotId);
      res.status(200).json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      // Convert date strings to Date objects if needed
      const sessionUserId = (req.session as any).userId;
      const bookingInput = {
        ...req.body,
        userId: sessionUserId,
      };
      if (typeof bookingInput.startTime === "string") {
        bookingInput.startTime = new Date(bookingInput.startTime);
      }
      if (typeof bookingInput.endTime === "string") {
        bookingInput.endTime = new Date(bookingInput.endTime);
      }
      const bookingData = insertBookingSchema.parse(bookingInput);
      // Check if space is available
      const space = await storage.getParkingSpace(bookingData.parkingSpaceId);
      if (!space) {
        return res.status(404).json({ message: "Parking space not found" });
      }
      if (space.status !== "available") {
        return res.status(400).json({ message: "Parking space is not available" });
      }
      // Create booking
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      // Check authorization - user can cancel their own booking, owner can confirm/complete
      if ((req.session as any).userId === booking.userId) {
        // User can only cancel their own booking
        if (status !== "cancelled") {
          return res.status(403).json({ message: "Users can only cancel bookings" });
        }
      } else {
        // Owner validation
        const parkingLot = await storage.getParkingLot(booking.parkingLotId);
        if (!parkingLot || parkingLot.ownerId !== (req.session as any).userId) {
          return res.status(403).json({ message: "Not authorized to update this booking" });
        }
      }
      const updatedBooking = await storage.updateBookingStatus(id, status);
      res.status(200).json(updatedBooking);
    } catch (error) {
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Review routes
  app.get("/api/parking-lots/:id/reviews", async (req, res) => {
    try {
      const parkingLotId = parseInt(req.params.id);
      const parkingLot = await storage.getParkingLot(parkingLotId);
      
      if (!parkingLot) {
        return res.status(404).json({ message: "Parking lot not found" });
      }
      
      const reviews = await storage.getReviews(parkingLotId);
      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId: (req.session as any).userId
      });
      
      // Check if parking lot exists
      const parkingLot = await storage.getParkingLot(reviewData.parkingLotId);
      if (!parkingLot) {
        return res.status(404).json({ message: "Parking lot not found" });
      }
      
      // Create review
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

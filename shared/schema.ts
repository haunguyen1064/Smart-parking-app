import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  role: text("role").notNull().default("user"), // user or owner
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  role: true,
});

// Parking lot model
export const parkingLots = pgTable("parking_lots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  totalSpots: integer("total_spots").notNull(),
  availableSpots: integer("available_spots").notNull(),
  pricePerHour: integer("price_per_hour").notNull(),
  description: text("description"),
  openingHour: text("opening_hour").notNull(),
  closingHour: text("closing_hour").notNull(),
  ownerId: integer("owner_id").notNull(),
  images: text("images").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertParkingLotSchema = createInsertSchema(parkingLots).pick({
  name: true,
  address: true,
  latitude: true,
  longitude: true,
  totalSpots: true,
  availableSpots: true,
  pricePerHour: true,
  description: true,
  openingHour: true,
  closingHour: true,
  ownerId: true,
  images: true,
});

// Parking spaces model
export const parkingSpaces = pgTable("parking_spaces", {
  id: serial("id").primaryKey(),
  parkingLotId: integer("parking_lot_id").notNull(),
  spotNumber: text("spot_number").notNull(),
  zone: text("zone").notNull(),
  status: text("status").notNull().default("available"), // available, occupied, reserved
});

export const insertParkingSpaceSchema = createInsertSchema(parkingSpaces).pick({
  parkingLotId: true,
  spotNumber: true,
  zone: true,
  status: true,
});

// Booking model
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  parkingLotId: integer("parking_lot_id").notNull(),
  parkingSpaceId: integer("parking_space_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, completed, cancelled
  totalPrice: integer("total_price").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  userId: true,
  parkingLotId: true,
  parkingSpaceId: true,
  startTime: true,
  endTime: true,
  status: true,
  totalPrice: true,
});

// Review model
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  parkingLotId: integer("parking_lot_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  parkingLotId: true,
  rating: true,
  comment: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ParkingLot = typeof parkingLots.$inferSelect;
export type InsertParkingLot = z.infer<typeof insertParkingLotSchema>;

export type ParkingSpace = typeof parkingSpaces.$inferSelect;
export type InsertParkingSpace = z.infer<typeof insertParkingSpaceSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

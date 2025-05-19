import {
  users, User, InsertUser,
  parkingLots, ParkingLot, InsertParkingLot,
  parkingSpaces, ParkingSpace, InsertParkingSpace,
  bookings, Booking, InsertBooking,
  reviews, Review, InsertReview
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Parking lot operations
  getParkingLots(): Promise<ParkingLot[]>;
  getParkingLot(id: number): Promise<ParkingLot | undefined>;
  getParkingLotsByOwner(ownerId: number): Promise<ParkingLot[]>;
  createParkingLot(parkingLot: InsertParkingLot): Promise<ParkingLot>;
  updateParkingLot(id: number, parkingLot: Partial<ParkingLot>): Promise<ParkingLot | undefined>;
  
  // Parking space operations
  getParkingSpaces(parkingLotId: number): Promise<ParkingSpace[]>;
  getParkingSpace(id: number): Promise<ParkingSpace | undefined>;
  createParkingSpace(parkingSpace: InsertParkingSpace): Promise<ParkingSpace>;
  updateParkingSpaceStatus(id: number, status: string): Promise<ParkingSpace | undefined>;
  
  // Booking operations
  getBookings(userId?: number, parkingLotId?: number): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  
  // Review operations
  getReviews(parkingLotId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private parkingLots: Map<number, ParkingLot>;
  private parkingSpaces: Map<number, ParkingSpace>;
  private bookings: Map<number, Booking>;
  private reviews: Map<number, Review>;
  
  private userId: number;
  private parkingLotId: number;
  private parkingSpaceId: number;
  private bookingId: number;
  private reviewId: number;
  
  constructor() {
    this.users = new Map();
    this.parkingLots = new Map();
    this.parkingSpaces = new Map();
    this.bookings = new Map();
    this.reviews = new Map();
    
    this.userId = 1;
    this.parkingLotId = 1;
    this.parkingSpaceId = 1;
    this.bookingId = 1;
    this.reviewId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    // Create a sample owner
    const owner: User = {
      id: this.userId++,
      username: "owner@uit.edu.vn",
      password: "password",
      fullName: "Phi Yến",
      email: "owner@example.com",
      phoneNumber: "0123456789",
      role: "owner"
    };
    this.users.set(owner.id, owner);
    
    // Create a sample user
    const user: User = {
      id: this.userId++,
      username: "user@uit.edu.vn",
      password: "password",
      fullName: "Thanh Hậu",
      email: "user@example.com",
      phoneNumber: "0987654321",
      role: "user"
    };
    this.users.set(user.id, user);
    
    // Create sample parking lots
    const parkingLotA: ParkingLot = {
      id: this.parkingLotId++,
      name: "Bãi đỗ xe A",
      address: "123 Đường ABC",
      latitude: "10.7769",
      longitude: "106.7009",
      totalSpots: 20,
      availableSpots: 8,
      pricePerHour: 20000,
      description: "Bãi đỗ xe ngoài trời, có bảo vệ",
      openingHour: "06:00",
      closingHour: "22:00",
      ownerId: owner.id,
      images: [
        "https://plus.unsplash.com/premium_photo-1661962915138-c10a03d4ae28?q=80&w=2071&auto=format&fit=crop&w=800&h=400",
        "https://images.unsplash.com/photo-1593280405106-e438ebe93f5b?q=80&w=2080&auto=format&fit=crop&w=800&h=400"
      ],
      createdAt: new Date(),
      layouts: [
        {
          name: "Khu A",
          rows: [
            {
              prefix: "A",
              slots: Array.from({ length: 6 }).map((_, i) => ({
                id: `A${i+1}`,
                status: [4,7].includes(i+1) ? "occupied" : "available"
              }))
            },
            {
              prefix: "B",
              slots: Array.from({ length: 5 }).map((_, i) => ({
                id: `B${i+1}`,
                status: "available"
              }))
            },
            {
              prefix: "C",
              slots: Array.from({ length: 6 }).map((_, i) => ({
                id: `C${i+1}`,
                status: [1,2,3].includes(i+1) ? "occupied" : "available"
              }))
            }
          ]
        }
      ]
    };
    this.parkingLots.set(parkingLotA.id, parkingLotA);
    
    const parkingLotB: ParkingLot = {
      id: this.parkingLotId++,
      name: "Bãi đỗ xe B",
      address: "456 Đường XYZ",
      latitude: "10.7866",
      longitude: "106.6800",
      totalSpots: 15,
      availableSpots: 3,
      pricePerHour: 25000,
      description: "Bãi đỗ xe trong nhà, có camera an ninh",
      openingHour: "00:00",
      closingHour: "24:00",
      ownerId: owner.id,
      images: [
        "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
      ],
      createdAt: new Date(),
      layouts: [
        {
          name: "Khu Chính",
          rows: [
            {
              prefix: "A",
              slots: Array.from({ length: 8 }).map((_, i) => ({
                id: `A${i+1}`,
                status: "occupied"
              }))
            },
            {
              prefix: "B",
              slots: Array.from({ length: 10 }).map((_, i) => ({
                id: `B${i+1}`,
                status: "occupied"
              }))
            }
          ]
        }
      ]
    };
    this.parkingLots.set(parkingLotB.id, parkingLotB);
    
    const parkingLotC: ParkingLot = {
      id: this.parkingLotId++,
      name: "Bãi đỗ xe C",
      address: "789 Đường LMN",
      latitude: "10.8231",
      longitude: "106.6297",
      totalSpots: 25,
      availableSpots: 15,
      pricePerHour: 15000,
      description: "Bãi đỗ xe cao tầng, có thang máy",
      openingHour: "05:00",
      closingHour: "23:00",
      ownerId: owner.id,
      images: [
        "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
      ],
      createdAt: new Date(),
      layouts: [
        {
          name: "Khu C",
          rows: [
            {
              prefix: "C",
              slots: Array.from({ length: 15 }).map((_, i) => ({
                id: `C${i+1}`,
                status: "available"
              }))
            }
          ]
        }
      ]
    };
    this.parkingLots.set(parkingLotC.id, parkingLotC);
    
    // Create sample parking spaces for Parking Lot A
    for (let i = 1; i <= 10; i++) {
      const status = [4, 7].includes(i) ? "occupied" : "available";
      const parkingSpace: ParkingSpace = {
        id: this.parkingSpaceId++,
        parkingLotId: parkingLotA.id,
        spotNumber: `A${i}`,
        zone: "A",
        status
      };
      this.parkingSpaces.set(parkingSpace.id, parkingSpace);
    }
    
    // Create sample parking spaces for Parking Lot B
    for (let i = 1; i <= 10; i++) {
      const status = "occupied"; // All spaces occupied
      const parkingSpace: ParkingSpace = {
        id: this.parkingSpaceId++,
        parkingLotId: parkingLotB.id,
        spotNumber: `B${i}`,
        zone: "B",
        status
      };
      this.parkingSpaces.set(parkingSpace.id, parkingSpace);
    }
    
    // Create sample bookings
    const booking1: Booking = {
      id: this.bookingId++,
      userId: user.id,
      parkingLotId: parkingLotA.id,
      parkingSpaceId: 3, // A3
      startTime: new Date("2025-08-17T13:00:00"),
      endTime: new Date("2025-08-17T15:00:00"),
      status: "confirmed",
      totalPrice: 40000,
      createdAt: new Date()
    };
    this.bookings.set(booking1.id, booking1);
    
    const booking2: Booking = {
      id: this.bookingId++,
      userId: user.id,
      parkingLotId: parkingLotA.id,
      parkingSpaceId: 8, // A8
      startTime: new Date("2025-08-17T14:00:00"),
      endTime: new Date("2025-08-17T17:00:00"),
      status: "pending",
      totalPrice: 60000,
      createdAt: new Date()
    };
    this.bookings.set(booking2.id, booking2);
    
    // Mark the booked spots as "reserved"
    // const parkingSpace3 = this.getParkingSpaceBySpotNumber(parkingLotA.id, "A3");
    // if (parkingSpace3) {
    //   parkingSpace3.status = "reserved";
    //   this.parkingSpaces.set(parkingSpace3.id, parkingSpace3);
    // }
    
    // const parkingSpace8 = this.getParkingSpaceBySpotNumber(parkingLotA.id, "A8");
    // if (parkingSpace8) {
    //   parkingSpace8.status = "reserved";
    //   this.parkingSpaces.set(parkingSpace8.id, parkingSpace8);
    // }
    
    // Create sample reviews
    const review: Review = {
      id: this.reviewId++,
      userId: user.id,
      parkingLotId: parkingLotA.id,
      rating: 4,
      comment: "Bãi đỗ xe sạch sẽ, dễ tìm, nhân viên thân thiện",
      createdAt: new Date()
    };
    this.reviews.set(review.id, review);
  }
  
  private getParkingSpaceBySpotNumber(parkingLotId: number, spotNumber: string): ParkingSpace | undefined {
    for (const space of this.parkingSpaces.values()) {
      if (space.parkingLotId === parkingLotId && space.spotNumber === spotNumber) {
        return space;
      }
    }
    return undefined;
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Parking lot operations
  async getParkingLots(): Promise<ParkingLot[]> {
    return Array.from(this.parkingLots.values());
  }
  
  async getParkingLot(id: number): Promise<ParkingLot | undefined> {
    return this.parkingLots.get(id);
  }
  
  async getParkingLotsByOwner(ownerId: number): Promise<ParkingLot[]> {
    return Array.from(this.parkingLots.values()).filter(
      (parkingLot) => parkingLot.ownerId === ownerId
    );
  }
  
  async createParkingLot(insertParkingLot: InsertParkingLot): Promise<ParkingLot> {
    const id = this.parkingLotId++;
    const parkingLot: ParkingLot = { 
      ...insertParkingLot, 
      id, 
      createdAt: new Date(),
      description: insertParkingLot.description ?? null,
      images: insertParkingLot.images ?? [],
      layouts: insertParkingLot.layouts ?? [], // Đảm bảo layouts luôn có giá trị mảng
    };
    this.parkingLots.set(id, parkingLot);
    return parkingLot;
  }
  
  async updateParkingLot(id: number, updates: Partial<ParkingLot>): Promise<ParkingLot | undefined> {
    const parkingLot = this.parkingLots.get(id);
    if (!parkingLot) return undefined;
    const updatedParkingLot = { ...parkingLot, ...updates };
    if (!updatedParkingLot.layouts) updatedParkingLot.layouts = [];
    this.parkingLots.set(id, updatedParkingLot);
    return updatedParkingLot;
  }
  
  // Parking space operations
  async getParkingSpaces(parkingLotId: number): Promise<ParkingSpace[]> {
    return Array.from(this.parkingSpaces.values()).filter(
      (space) => space.parkingLotId === parkingLotId
    );
  }
  
  async getParkingSpace(id: number): Promise<ParkingSpace | undefined> {
    return this.parkingSpaces.get(id);
  }
  
  async createParkingSpace(insertParkingSpace: InsertParkingSpace): Promise<ParkingSpace> {
    const id = this.parkingSpaceId++;
    const parkingSpace: ParkingSpace = { 
      ...insertParkingSpace, 
      id,
      status: insertParkingSpace.status ?? "available"
    };
    this.parkingSpaces.set(id, parkingSpace);
    return parkingSpace;
  }
  
  async updateParkingSpaceStatus(id: number, status: string): Promise<ParkingSpace | undefined> {
    const parkingSpace = this.parkingSpaces.get(id);
    if (!parkingSpace) return undefined;
    
    const updatedSpace = { ...parkingSpace, status };
    this.parkingSpaces.set(id, updatedSpace);
    
    // Update available spots in the parking lot
    const parkingLot = this.parkingLots.get(updatedSpace.parkingLotId);
    if (parkingLot) {
      const allSpaces = await this.getParkingSpaces(parkingLot.id);
      const availableCount = allSpaces.filter(space => space.status === "available").length;
      
      const updatedParkingLot = { ...parkingLot, availableSpots: availableCount };
      this.parkingLots.set(parkingLot.id, updatedParkingLot);
    }
    
    return updatedSpace;
  }
  
  // Booking operations
  async getBookings(userId?: number, parkingLotId?: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => {
      let match = true;
      if (userId !== undefined) match = match && booking.userId === userId;
      if (parkingLotId !== undefined) match = match && booking.parkingLotId === parkingLotId;
      return match;
    });
  }
  
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }
  
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.bookingId++;
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      createdAt: new Date(),
      status: insertBooking.status ?? "pending"
    };
    this.bookings.set(id, booking);
    
    // Update the parking space status to reserved
    const parkingSpace = await this.getParkingSpace(booking.parkingSpaceId);
    if (parkingSpace) {
      await this.updateParkingSpaceStatus(parkingSpace.id, "reserved");
    }
    
    return booking;
  }
  
  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, status };
    this.bookings.set(id, updatedBooking);
    
    // If cancelled, update the parking space status back to available
    if (status === "cancelled") {
      const parkingSpace = await this.getParkingSpace(booking.parkingSpaceId);
      if (parkingSpace) {
        await this.updateParkingSpaceStatus(parkingSpace.id, "available");
      }
    }
    
    return updatedBooking;
  }
  
  // Review operations
  async getReviews(parkingLotId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.parkingLotId === parkingLotId
    );
  }
  
  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewId++;
    const review: Review = { 
      ...insertReview, 
      id, 
      createdAt: new Date(),
      comment: insertReview.comment ?? null
    };
    this.reviews.set(id, review);
    return review;
  }
}

export const storage = new MemStorage();

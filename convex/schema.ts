import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("customer"))),
    phone: v.optional(v.string()),
    licenseUrl: v.optional(v.string()),
    licenseVerified: v.optional(v.boolean()),
  }).index("by_token", ["tokenIdentifier"]),

  cars: defineTable({
    make: v.string(),
    model: v.string(),
    year: v.number(),
    category: v.union(
      v.literal("economy"),
      v.literal("compact"),
      v.literal("sedan"),
      v.literal("suv"),
      v.literal("luxury"),
      v.literal("sports"),
      v.literal("van")
    ),
    color: v.string(),
    licensePlate: v.string(),
    dailyRate: v.number(),
    imageUrl: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    seats: v.number(),
    transmission: v.union(v.literal("automatic"), v.literal("manual")),
    fuelType: v.union(v.literal("gasoline"), v.literal("diesel"), v.literal("electric"), v.literal("hybrid")),
    isAvailable: v.boolean(),
    locationId: v.id("locations"),
    mileage: v.optional(v.number()),
    features: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  })
    .index("by_location", ["locationId"])
    .index("by_category", ["category"])
    .index("by_available", ["isAvailable"]),

  locations: defineTable({
    name: v.string(),
    address: v.string(),
    city: v.string(),
    phone: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_active", ["isActive"]),

  additionalServices: defineTable({
    name: v.string(),
    description: v.string(),
    dailyRate: v.number(),
    category: v.union(
      v.literal("equipment"),
      v.literal("driver"),
      v.literal("insurance"),
      v.literal("other")
    ),
    isActive: v.boolean(),
  }).index("by_active", ["isActive"]),

  bookings: defineTable({
    userId: v.id("users"),
    carId: v.id("cars"),
    pickupLocationId: v.id("locations"),
    dropoffLocationId: v.id("locations"),
    pickupDate: v.string(),
    pickupTime: v.optional(v.string()),
    returnDate: v.string(),
    returnTime: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("checked_in"),
      v.literal("checked_out"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    totalAmount: v.number(),
    additionalServiceIds: v.optional(v.array(v.id("additionalServices"))),
    licenseUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    paymentStatus: v.optional(v.union(v.literal("pending"), v.literal("paid"), v.literal("refunded"))),
  })
    .index("by_user", ["userId"])
    .index("by_car", ["carId"])
    .index("by_status", ["status"]),

  vehicleInspections: defineTable({
    bookingId: v.id("bookings"),
    carId: v.id("cars"),
    type: v.union(v.literal("check_in"), v.literal("check_out")),
    mileage: v.number(),
    fuelLevel: v.union(
      v.literal("empty"),
      v.literal("quarter"),
      v.literal("half"),
      v.literal("three_quarter"),
      v.literal("full")
    ),
    notes: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    conductedBy: v.id("users"),
  })
    .index("by_booking", ["bookingId"])
    .index("by_car", ["carId"]),

  maintenance: defineTable({
    carId: v.id("cars"),
    type: v.string(),
    description: v.string(),
    scheduledDate: v.string(),
    completedDate: v.optional(v.string()),
    cost: v.optional(v.number()),
    status: v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed")),
    notes: v.optional(v.string()),
  })
    .index("by_car", ["carId"])
    .index("by_status", ["status"]),
});

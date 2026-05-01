import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    category: v.optional(v.string()),
    locationId: v.optional(v.id("locations")),
    availableOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let cars = await ctx.db.query("cars").collect();
    if (args.availableOnly) {
      cars = cars.filter((c) => c.isAvailable);
    }
    if (args.category) {
      cars = cars.filter((c) => c.category === args.category);
    }
    if (args.locationId) {
      cars = cars.filter((c) => c.locationId === args.locationId);
    }
    return cars;
  },
});

export const get = query({
  args: { carId: v.id("cars") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.carId);
  },
});

export const create = mutation({
  args: {
    make: v.string(),
    model: v.string(),
    year: v.number(),
    category: v.union(
      v.literal("economy"), v.literal("compact"), v.literal("sedan"),
      v.literal("suv"), v.literal("luxury"), v.literal("sports"), v.literal("van")
    ),
    color: v.string(),
    licensePlate: v.string(),
    dailyRate: v.number(),
    imageUrl: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    seats: v.number(),
    transmission: v.union(v.literal("automatic"), v.literal("manual")),
    fuelType: v.union(v.literal("gasoline"), v.literal("diesel"), v.literal("electric"), v.literal("hybrid")),
    locationId: v.id("locations"),
    mileage: v.optional(v.number()),
    features: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    return await ctx.db.insert("cars", { ...args, isAvailable: true });
  },
});

export const update = mutation({
  args: {
    carId: v.id("cars"),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    category: v.optional(v.union(
      v.literal("economy"), v.literal("compact"), v.literal("sedan"),
      v.literal("suv"), v.literal("luxury"), v.literal("sports"), v.literal("van")
    )),
    color: v.optional(v.string()),
    licensePlate: v.optional(v.string()),
    dailyRate: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    seats: v.optional(v.number()),
    transmission: v.optional(v.union(v.literal("automatic"), v.literal("manual"))),
    fuelType: v.optional(v.union(v.literal("gasoline"), v.literal("diesel"), v.literal("electric"), v.literal("hybrid"))),
    isAvailable: v.optional(v.boolean()),
    locationId: v.optional(v.id("locations")),
    mileage: v.optional(v.number()),
    features: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { carId, ...fields } = args;
    await ctx.db.patch(carId, fields);
  },
});

export const remove = mutation({
  args: { carId: v.id("cars") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.carId);
  },
});

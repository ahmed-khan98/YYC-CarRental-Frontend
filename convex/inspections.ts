import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    carId: v.id("cars"),
    bookingId: v.id("bookings"),
    type: v.union(v.literal("check_in"), v.literal("check_out")),
    mileage: v.number(),
    fuelLevel: v.union(
      v.literal("empty"), v.literal("quarter"), v.literal("half"),
      v.literal("three_quarter"), v.literal("full")
    ),
    notes: v.optional(v.string()),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    // Resolve image URLs from storage IDs
    let imageUrls: string[] = [];
    if (args.imageStorageIds && args.imageStorageIds.length > 0) {
      imageUrls = (
        await Promise.all(args.imageStorageIds.map((id) => ctx.storage.getUrl(id)))
      ).filter((u): u is string => u !== null);
    }

    return await ctx.db.insert("vehicleInspections", {
      carId: args.carId,
      bookingId: args.bookingId,
      type: args.type,
      mileage: args.mileage,
      fuelLevel: args.fuelLevel,
      notes: args.notes,
      imageStorageIds: args.imageStorageIds,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      conductedBy: user._id,
    });
  },
});

export const listByBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vehicleInspections")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .collect();
  },
});

export const listByCar = query({
  args: { carId: v.id("cars") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vehicleInspections")
      .withIndex("by_car", (q) => q.eq("carId", args.carId))
      .collect();
  },
});

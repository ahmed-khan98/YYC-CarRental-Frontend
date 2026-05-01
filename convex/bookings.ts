import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const create = mutation({
  args: {
    carId: v.id("cars"),
    locationId: v.id("locations"),
    pickupDate: v.string(),
    returnDate: v.string(),
    additionalServiceIds: v.optional(v.array(v.id("additionalServices"))),
    licenseUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const car = await ctx.db.get(args.carId);
    if (!car) throw new ConvexError({ message: "Car not found", code: "NOT_FOUND" });
    if (!car.isAvailable) throw new ConvexError({ message: "Car not available", code: "BAD_REQUEST" });

    // Calculate total
    const pickup = new Date(args.pickupDate);
    const returnD = new Date(args.returnDate);
    const days = Math.max(1, Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)));
    let total = car.dailyRate * days;

    if (args.additionalServiceIds) {
      for (const svcId of args.additionalServiceIds) {
        const svc = await ctx.db.get(svcId);
        if (svc) total += svc.dailyRate * days;
      }
    }

    return await ctx.db.insert("bookings", {
      userId: user._id,
      carId: args.carId,
      locationId: args.locationId,
      pickupDate: args.pickupDate,
      returnDate: args.returnDate,
      status: "pending",
      totalAmount: total,
      additionalServiceIds: args.additionalServiceIds,
      licenseUrl: args.licenseUrl,
      notes: args.notes,
      paymentStatus: "pending",
    });
  },
});

export const myBookings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    return await ctx.db.query("bookings").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
  },
});

export const adminList = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const caller = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!caller || caller.role !== "admin") return [];
    const all = await ctx.db.query("bookings").collect();
    if (args.status) return all.filter((b) => b.status === args.status);
    return all;
  },
});

export const updateStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    status: v.union(
      v.literal("pending"), v.literal("confirmed"), v.literal("checked_in"),
      v.literal("checked_out"), v.literal("completed"), v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, { status: args.status });
  },
});

export const cancel = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new ConvexError({ message: "Booking not found", code: "NOT_FOUND" });
    if (booking.userId !== user._id && user.role !== "admin") {
      throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });
    }
    await ctx.db.patch(args.bookingId, { status: "cancelled" });
  },
});

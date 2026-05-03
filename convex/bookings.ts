import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Check if two date ranges overlap
function datesOverlap(
  existingPickup: string,
  existingReturn: string,
  requestedPickup: string,
  requestedReturn: string
): boolean {
  const ep = new Date(existingPickup).getTime();
  const er = new Date(existingReturn).getTime();
  const rp = new Date(requestedPickup).getTime();
  const rr = new Date(requestedReturn).getTime();
  // Ranges overlap if: existing starts before requested ends AND existing ends after requested starts
  return ep < rr && er > rp;
}

export const create = mutation({
  args: {
    carId: v.id("cars"),
    pickupLocationId: v.id("locations"),
    dropoffLocationId: v.id("locations"),
    pickupDate: v.string(),
    pickupTime: v.optional(v.string()),
    returnDate: v.string(),
    returnTime: v.optional(v.string()),
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

    // Check date overlap with existing active bookings
    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_car", (q) => q.eq("carId", args.carId))
      .collect();

    const conflicting = existingBookings.find(
      (b) =>
        b.status !== "cancelled" &&
        b.status !== "completed" &&
        datesOverlap(b.pickupDate, b.returnDate, args.pickupDate, args.returnDate)
    );
    if (conflicting) {
      throw new ConvexError({ message: "Car is not available for the selected dates", code: "BAD_REQUEST" });
    }

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
      pickupLocationId: args.pickupLocationId,
      dropoffLocationId: args.dropoffLocationId,
      pickupDate: args.pickupDate,
      pickupTime: args.pickupTime,
      returnDate: args.returnDate,
      returnTime: args.returnTime,
      status: "confirmed", // auto-confirm
      totalAmount: total,
      additionalServiceIds: args.additionalServiceIds,
      licenseUrl: args.licenseUrl,
      notes: args.notes,
      paymentStatus: "pending",
    });
  },
});

// Admin creates a booking on behalf of a user
export const adminCreate = mutation({
  args: {
    userId: v.id("users"),
    carId: v.id("cars"),
    pickupLocationId: v.id("locations"),
    dropoffLocationId: v.id("locations"),
    pickupDate: v.string(),
    pickupTime: v.optional(v.string()),
    returnDate: v.string(),
    returnTime: v.optional(v.string()),
    additionalServiceIds: v.optional(v.array(v.id("additionalServices"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const caller = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!caller || caller.role !== "admin") throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });

    const car = await ctx.db.get(args.carId);
    if (!car) throw new ConvexError({ message: "Car not found", code: "NOT_FOUND" });

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
      userId: args.userId,
      carId: args.carId,
      pickupLocationId: args.pickupLocationId,
      dropoffLocationId: args.dropoffLocationId,
      pickupDate: args.pickupDate,
      pickupTime: args.pickupTime,
      returnDate: args.returnDate,
      returnTime: args.returnTime,
      status: "confirmed",
      totalAmount: total,
      additionalServiceIds: args.additionalServiceIds,
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

export const getById = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bookingId);
  },
});

// Query available cars for date range
export const getUnavailableCarIds = query({
  args: { pickupDate: v.string(), returnDate: v.string() },
  handler: async (ctx, args) => {
    const allBookings = await ctx.db.query("bookings").collect();
    const unavailable = new Set<string>();
    for (const b of allBookings) {
      if (b.status === "cancelled" || b.status === "completed") continue;
      if (datesOverlap(b.pickupDate, b.returnDate, args.pickupDate, args.returnDate)) {
        unavailable.add(b.carId);
      }
    }
    return Array.from(unavailable);
  },
});

export const updateStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    status: v.union(
      v.literal("pending"), v.literal("confirmed"), v.literal("checked_in"),
      v.literal("checked_out"), v.literal("completed"), v.literal("cancelled")
    ),
    cancellationReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, string> = { status: args.status };
    if (args.cancellationReason) {
      patch.cancellationReason = args.cancellationReason;
    }
    await ctx.db.patch(args.bookingId, patch);
  },
});

export const cancel = mutation({
  args: {
    bookingId: v.id("bookings"),
    reason: v.optional(v.string()),
  },
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

    const isAdmin = user.role === "admin";
    const isOwner = booking.userId === user._id;

    if (!isAdmin && !isOwner) {
      throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });
    }

    // User cancellation: must be 24h before pickup
    if (!isAdmin && isOwner) {
      const pickupTime = new Date(booking.pickupDate);
      if (booking.pickupTime) {
        const [h, m] = booking.pickupTime.split(":").map(Number);
        pickupTime.setHours(h, m, 0, 0);
      }
      const cutoff = new Date(pickupTime.getTime() - 24 * 60 * 60 * 1000);
      if (new Date() > cutoff) {
        throw new ConvexError({
          message: "Cancellation is not allowed within 24 hours of pickup",
          code: "BAD_REQUEST",
        });
      }
    }

    // Admin must provide reason
    if (isAdmin && !args.reason) {
      throw new ConvexError({ message: "Admin must provide a cancellation reason", code: "BAD_REQUEST" });
    }

    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
      cancellationReason: args.reason,
    });
  },
});

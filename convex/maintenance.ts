import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByCar = query({
  args: { carId: v.id("cars") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("maintenance")
      .withIndex("by_car", (q) => q.eq("carId", args.carId))
      .collect();
  },
});

export const listByStatus = query({
  args: { status: v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("maintenance")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

export const create = mutation({
  args: {
    carId: v.id("cars"),
    type: v.string(),
    description: v.string(),
    scheduledDate: v.string(),
    cost: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("maintenance", { ...args, status: "scheduled" });
  },
});

export const update = mutation({
  args: {
    maintenanceId: v.id("maintenance"),
    status: v.optional(v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed"))),
    completedDate: v.optional(v.string()),
    cost: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { maintenanceId, ...fields } = args;
    await ctx.db.patch(maintenanceId, fields);
  },
});

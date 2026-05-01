import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db.query("locations").withIndex("by_active", (q) => q.eq("isActive", true)).collect();
    }
    return await ctx.db.query("locations").collect();
  },
});

export const get = query({
  args: { locationId: v.id("locations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.locationId);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    city: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("locations", { ...args, isActive: true });
  },
});

export const update = mutation({
  args: {
    locationId: v.id("locations"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    phone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { locationId, ...fields } = args;
    await ctx.db.patch(locationId, fields);
  },
});

export const remove = mutation({
  args: { locationId: v.id("locations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.locationId);
  },
});

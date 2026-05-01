import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db.query("additionalServices").withIndex("by_active", (q) => q.eq("isActive", true)).collect();
    }
    return await ctx.db.query("additionalServices").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    dailyRate: v.number(),
    category: v.union(
      v.literal("equipment"), v.literal("driver"), v.literal("insurance"), v.literal("other")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("additionalServices", { ...args, isActive: true });
  },
});

export const update = mutation({
  args: {
    serviceId: v.id("additionalServices"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    dailyRate: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { serviceId, ...fields } = args;
    await ctx.db.patch(serviceId, fields);
  },
});

export const remove = mutation({
  args: { serviceId: v.id("additionalServices") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.serviceId);
  },
});

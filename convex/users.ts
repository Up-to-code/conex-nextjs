import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// إنشاء مستخدم
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      ...args,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
  },
});

// تعديل مستخدم
export const editUser = mutation({
  args: {
    id: v.id("users"),
    name: v.string(),
    email: v.string(),
    password: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...data }) => {
    await ctx.db.patch(id, { ...data, updated_at: Date.now() });
  },
});

// حذف مستخدم
export const deleteUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

// عرض جميع المستخدمين
export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

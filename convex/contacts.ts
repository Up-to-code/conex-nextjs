/* eslint-disable @typescript-eslint/no-explicit-any */
// convex/contacts.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createContact = mutation({
  args: {
    first_name: v.string(),
    last_name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    title: v.optional(v.string()),
    company_id: v.optional(v.id("companies")),
    owner_id: v.optional(v.id("users")),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("contacts", { ...args, created_at: now, updated_at: now });
  },
});

export const editContact = mutation({
  args: {
    id: v.id("contacts"),
    first_name: v.string(),
    last_name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    title: v.optional(v.string()),
    company_id: v.optional(v.id("companies")),
    owner_id: v.optional(v.id("users")),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { ...args, updated_at: Date.now() } as any);
  },
});

export const deleteContact = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const getContacts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("contacts").collect();
  },
});

export const getContact = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

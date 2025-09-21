import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users already defined in your schema
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
    image: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_email", ["email"]),

  companies: defineTable({
    name: v.string(),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_name", ["name"]),

  contacts: defineTable({
    first_name: v.string(),
    last_name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    title: v.optional(v.string()),
    company_id: v.optional(v.id("companies")),
    owner_id: v.optional(v.id("users")), // who manages this contact
    image: v.optional(v.string()),       // avatar URL
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_owner", ["owner_id"]),

  deals: defineTable({
    title: v.string(),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
    stage: v.string(), // e.g. "lead","qualified","proposal","won","lost"
    contact_id: v.optional(v.id("contacts")),
    company_id: v.optional(v.id("companies")),
    owner_id: v.optional(v.id("users")),
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_stage", ["stage"]),

  activities: defineTable({
    kind: v.string(), // note/call/meeting
    body: v.string(),
    author_id: v.id("users"),
    contact_id: v.optional(v.id("contacts")),
    deal_id: v.optional(v.id("deals")),
    created_at: v.number(),
  }).index("by_contact", ["contact_id"]),
});

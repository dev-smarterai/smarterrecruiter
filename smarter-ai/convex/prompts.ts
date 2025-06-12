import { v } from "convex/values"
import { query, mutation } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import { internal } from "./_generated/api"

// Get a prompt by name
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("prompts")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first()
  },
})

// Create a new prompt
export const create = mutation({
  args: {
    name: v.string(),
    content: v.string(),
    description: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if prompt with this name already exists
    const existing = await ctx.db
      .query("prompts")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first()

    if (existing) {
      throw new Error(`Prompt with name "${args.name}" already exists`)
    }

    return await ctx.db.insert("prompts", {
      name: args.name,
      content: args.content,
      description: args.description,
      lastUpdated: Date.now(),
      updatedBy: args.updatedBy || "system",
    })
  },
})

// Update an existing prompt
export const update = mutation({
  args: {
    id: v.id("prompts"),
    content: v.string(),
    description: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      content: args.content,
      description: args.description,
      lastUpdated: Date.now(),
      updatedBy: args.updatedBy || "system",
    })
  },
})

// Update a prompt by name
export const updateByName = mutation({
  args: {
    name: v.string(),
    content: v.string(),
    description: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("prompts")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first()

    if (!existing) {
      // If doesn't exist, create it
      return await ctx.db.insert("prompts", {
        name: args.name,
        content: args.content,
        description: args.description,
        lastUpdated: Date.now(),
        updatedBy: args.updatedBy || "system",
      })
    } else {
      // If exists, update it
      return await ctx.db.patch(existing._id, {
        content: args.content,
        description: args.description,
        lastUpdated: Date.now(),
        updatedBy: args.updatedBy || "system",
      })
    }
  },
})

// Delete a prompt
export const remove = mutation({
  args: { id: v.id("prompts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return args.id
  },
})

// List all prompts
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("prompts").collect()
  },
})

// Initialize all prompts - this will be called from the UI
export const initPrompts = mutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean }> => {
    try {
      // Modified to use the correct pattern for calling an internal function
      const result = await ctx.runMutation(
        internal.init_prompts.initPrompts,
        {},
      )
      return { success: true }
    } catch (err) {
      console.error("Error initializing prompts:", err)
      return { success: false }
    }
  },
})

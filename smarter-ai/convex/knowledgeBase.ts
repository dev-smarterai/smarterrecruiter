import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"

/**
 * Get the default knowledge base for the AI interviewer
 *
 * Returns the content of the knowledge base that should be included as part of the system prompt
 * for the AI interviewer to have access to common company information and policies.
 */
export const getDefaultKnowledgeBase = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("knowledgeBase"),
      _creationTime: v.number(),
      content: v.string(),
      lastUpdated: v.string(),
      name: v.string(),
      isDefault: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    // Get the default knowledge base (there should be only one)
    const kb = await ctx.db
      .query("knowledgeBase")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .first()

    return kb
  },
})

/**
 * Get a knowledge base by ID
 */
export const getKnowledgeBaseById = query({
  args: {
    id: v.id("knowledgeBase"),
  },
  returns: v.union(
    v.object({
      _id: v.id("knowledgeBase"),
      _creationTime: v.number(),
      content: v.string(),
      lastUpdated: v.string(),
      name: v.string(),
      isDefault: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const kb = await ctx.db.get(args.id)
    return kb
  },
})

/**
 * Save or update the knowledge base
 *
 * This function will either update the existing default knowledge base,
 * or create a new one if it doesn't exist.
 */
export const saveKnowledgeBase = mutation({
  args: {
    content: v.string(),
    userId: v.optional(v.id("users")),
  },
  returns: v.id("knowledgeBase"),
  handler: async (ctx, args) => {
    // Check if we already have a default knowledge base
    const existingKB = await ctx.db
      .query("knowledgeBase")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .first()

    // Get current date in ISO format
    const nowISO = new Date().toISOString()

    if (existingKB) {
      // Update existing knowledge base
      await ctx.db.patch(existingKB._id, {
        content: args.content,
        lastUpdated: nowISO,
      })
      return existingKB._id
    } else {
      // Create a new default knowledge base
      const newKBId = await ctx.db.insert("knowledgeBase", {
        content: args.content,
        lastUpdated: nowISO,
        name: "Company Knowledge Base",
        isDefault: true,
      })
      return newKBId
    }
  },
})

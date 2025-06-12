import { query, mutation, internalMutation } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"

// Get all talent pool tags
export const getTalentPoolTags = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("talentPoolTags"),
      _creationTime: v.number(),
      name: v.string(),
      color: v.string(),
      count: v.number(),
      description: v.optional(v.string()),
      createdBy: v.optional(v.id("users")),
      createdAt: v.string(),
      updatedAt: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx) => {
    const tags = await ctx.db
      .query("talentPoolTags")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect()

    // Update counts for each tag
    const tagsWithUpdatedCounts = await Promise.all(
      tags.map(async (tag) => {
        const candidateTagsCount = await ctx.db
          .query("candidateTags")
          .withIndex("by_tag", (q) => q.eq("tagId", tag._id))
          .collect()

        return {
          ...tag,
          count: candidateTagsCount.length,
        }
      }),
    )

    return tagsWithUpdatedCounts
  },
})

// Get a single talent pool tag by ID
export const getTalentPoolTag = query({
  args: { id: v.id("talentPoolTags") },
  returns: v.union(
    v.object({
      _id: v.id("talentPoolTags"),
      _creationTime: v.number(),
      name: v.string(),
      color: v.string(),
      count: v.number(),
      description: v.optional(v.string()),
      createdBy: v.optional(v.id("users")),
      createdAt: v.string(),
      updatedAt: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const tag = await ctx.db.get(args.id)
    if (!tag) return null

    // Get current count
    const candidateTagsCount = await ctx.db
      .query("candidateTags")
      .withIndex("by_tag", (q) => q.eq("tagId", tag._id))
      .collect()

    return {
      ...tag,
      count: candidateTagsCount.length,
    }
  },
})

// Create a new talent pool tag
export const createTalentPoolTag = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    description: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  returns: v.id("talentPoolTags"),
  handler: async (ctx, args) => {
    // Check if tag with this name already exists
    const existingTags = await ctx.db
      .query("talentPoolTags")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .collect()

    if (existingTags.length > 0) {
      throw new Error(`Tag with name "${args.name}" already exists`)
    }

    const now = new Date().toISOString()
    const tagId = await ctx.db.insert("talentPoolTags", {
      name: args.name,
      color: args.color,
      count: 0, // Start with 0 count
      description: args.description,
      createdBy: args.createdBy,
      createdAt: now,
      isActive: true,
    })

    return tagId
  },
})

// Update a talent pool tag
export const updateTalentPoolTag = mutation({
  args: {
    id: v.id("talentPoolTags"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.id("talentPoolTags"),
  handler: async (ctx, args) => {
    const { id, ...updates } = args

    // If name is being updated, check for uniqueness
    if (updates.name !== undefined) {
      const existingTags = await ctx.db
        .query("talentPoolTags")
        .withIndex("by_name", (q) => q.eq("name", updates.name as string))
        .collect()

      const isNameTaken = existingTags.some((tag) => tag._id !== id)
      if (isNameTaken) {
        throw new Error(`Tag with name "${updates.name}" already exists`)
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    })

    return id
  },
})

// Delete a talent pool tag
export const deleteTalentPoolTag = mutation({
  args: { id: v.id("talentPoolTags") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // First, remove all candidate-tag associations
    const candidateTags = await ctx.db
      .query("candidateTags")
      .withIndex("by_tag", (q) => q.eq("tagId", args.id))
      .collect()

    for (const candidateTag of candidateTags) {
      await ctx.db.delete(candidateTag._id)
    }

    // Then delete the tag itself
    await ctx.db.delete(args.id)
    return null
  },
})

// Assign a tag to a candidate
export const assignTagToCandidate = mutation({
  args: {
    candidateId: v.id("candidates"),
    tagId: v.id("talentPoolTags"),
    assignedBy: v.optional(v.id("users")),
  },
  returns: v.id("candidateTags"),
  handler: async (ctx, args) => {
    // Check if this candidate-tag combination already exists
    const existingAssignment = await ctx.db
      .query("candidateTags")
      .withIndex("by_candidate_and_tag", (q) =>
        q.eq("candidateId", args.candidateId).eq("tagId", args.tagId),
      )
      .collect()

    if (existingAssignment.length > 0) {
      throw new Error("This tag is already assigned to this candidate")
    }

    // Verify candidate and tag exist
    const candidate = await ctx.db.get(args.candidateId)
    const tag = await ctx.db.get(args.tagId)

    if (!candidate) {
      throw new Error("Candidate not found")
    }
    if (!tag) {
      throw new Error("Tag not found")
    }

    const assignmentId = await ctx.db.insert("candidateTags", {
      candidateId: args.candidateId,
      tagId: args.tagId,
      assignedBy: args.assignedBy,
      assignedAt: new Date().toISOString(),
    })

    return assignmentId
  },
})

// Remove a tag from a candidate
export const removeTagFromCandidate = mutation({
  args: {
    candidateId: v.id("candidates"),
    tagId: v.id("talentPoolTags"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const candidateTags = await ctx.db
      .query("candidateTags")
      .withIndex("by_candidate_and_tag", (q) =>
        q.eq("candidateId", args.candidateId).eq("tagId", args.tagId),
      )
      .collect()

    for (const candidateTag of candidateTags) {
      await ctx.db.delete(candidateTag._id)
    }

    return null
  },
})

// Get tags for a specific candidate
export const getTagsForCandidate = query({
  args: { candidateId: v.id("candidates") },
  returns: v.array(
    v.object({
      _id: v.id("talentPoolTags"),
      name: v.string(),
      color: v.string(),
      assignedAt: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const candidateTags = await ctx.db
      .query("candidateTags")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .collect()

    const tags = await Promise.all(
      candidateTags.map(async (candidateTag) => {
        const tag = await ctx.db.get(candidateTag.tagId)
        if (!tag) return null

        return {
          _id: tag._id,
          name: tag.name,
          color: tag.color,
          assignedAt: candidateTag.assignedAt,
        }
      }),
    )

    return tags.filter((tag) => tag !== null) as Array<{
      _id: Id<"talentPoolTags">
      name: string
      color: string
      assignedAt: string
    }>
  },
})

// Get candidates for a specific tag
export const getCandidatesForTag = query({
  args: { tagId: v.id("talentPoolTags") },
  returns: v.array(
    v.object({
      _id: v.id("candidates"),
      name: v.string(),
      email: v.string(),
      initials: v.string(),
      textColor: v.string(),
      bgColor: v.string(),
      assignedAt: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const candidateTags = await ctx.db
      .query("candidateTags")
      .withIndex("by_tag", (q) => q.eq("tagId", args.tagId))
      .collect()

    const candidates = await Promise.all(
      candidateTags.map(async (candidateTag) => {
        const candidate = await ctx.db.get(candidateTag.candidateId)
        if (!candidate) return null

        return {
          _id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          initials: candidate.initials,
          textColor: candidate.textColor,
          bgColor: candidate.bgColor,
          assignedAt: candidateTag.assignedAt,
        }
      }),
    )

    return candidates.filter((candidate) => candidate !== null) as Array<{
      _id: Id<"candidates">
      name: string
      email: string
      initials: string
      textColor: string
      bgColor: string
      assignedAt: string
    }>
  },
}) 
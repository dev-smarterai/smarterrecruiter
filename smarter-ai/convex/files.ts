import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { ConvexError } from "convex/values"
import { Id } from "./_generated/dataModel"
import { api } from "./_generated/api"

// Generate a URL to upload a file to
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

// Store a file ID in the database
export const saveFileId = mutation({
  args: {
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    candidateId: v.id("candidates"),
    fileCategory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Save the file reference in the database
    const fileDoc = await ctx.db.insert("files", {
      fileId: args.fileId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileType: args.fileType,
      candidateId: args.candidateId,
      uploadedAt: Date.now(),
      fileCategory: args.fileCategory || "resume",
    })

    // Only update candidate's cvFileId if it's a resume file
    if (!args.fileCategory || args.fileCategory === "resume") {
      await ctx.db.patch(args.candidateId, {
        cvFileId: fileDoc,
      })
    }

    return fileDoc
  },
})

// Update CV summary for a file
export const updateCvSummary = mutation({
  args: {
    fileId: v.id("files"),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if file exists
    const file = await ctx.db.get(args.fileId)
    if (!file) {
      throw new ConvexError("File not found")
    }

    // Update the file with the CV summary
    await ctx.db.patch(args.fileId, {
      cvSummary: args.summary,
    })

    return true
  },
})

// Get file information by candidate ID
export const getFilesByCandidateId = query({
  args: {
    candidateId: v.id("candidates"),
  },
  handler: async (ctx, args) => {
    // Query files by candidate ID
    const files = await ctx.db
      .query("files")
      .withIndex("by_candidateId", (q) => q.eq("candidateId", args.candidateId))
      .collect()

    return files
  },
})

// Get a URL to download a file
export const getDownloadUrl = query({
  args: {
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    try {
      const url = await ctx.storage.getUrl(args.fileId)
      if (!url) {
        throw new ConvexError("File not found")
      }
      return url
    } catch (error) {
      throw new ConvexError(`Error getting file URL: ${error}`)
    }
  },
})

// Get all files information and URLs for a candidate
export const getCandidateFileUrls = query({
  args: {
    candidateId: v.id("candidates"),
  },
  handler: async (ctx, args) => {
    // Query files for this candidate
    const files = await ctx.db
      .query("files")
      .withIndex("by_candidateId", (q) => q.eq("candidateId", args.candidateId))
      .collect()

    // Get download URLs for each file
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const url = await ctx.storage.getUrl(file.fileId)
        return {
          ...file,
          url: url || null,
        }
      }),
    )

    return filesWithUrls
  },
})

// Get the resume file and URL for a specific candidate
export const getResumeByCandidateId = query({
  args: {
    candidateId: v.id("candidates"),
  },
  returns: v.object({
    fileName: v.optional(v.string()),
    url: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    _id: v.optional(v.id("files")),
    cvSummary: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get the candidate to find their CV file ID
    const candidate = await ctx.db.get(args.candidateId)
    if (!candidate) {
      return {
        fileName: undefined,
        url: undefined,
        fileId: undefined,
        _id: undefined,
        cvSummary: undefined,
      }
    }

    // If the candidate has a cvFileId, get the file
    if (candidate.cvFileId) {
      try {
        const file = await ctx.db.get(candidate.cvFileId)
        if (file) {
          const url = await ctx.storage.getUrl(file.fileId)
          return {
            fileName: file.fileName,
            url: url || undefined,
            fileId: file.fileId,
            _id: file._id,
            cvSummary: file.cvSummary,
          }
        }
      } catch (error) {
        console.error("Error getting file:", error)
      }
    }

    // If no file found via candidate.cvFileId, try searching in files table
    const files = await ctx.db
      .query("files")
      .withIndex("by_candidateId", (q) => q.eq("candidateId", args.candidateId))
      .collect()

    if (files.length > 0) {
      // Assuming the most recent file (highest uploadedAt) is the resume
      const file = files.sort((a, b) => b.uploadedAt - a.uploadedAt)[0]
      const url = await ctx.storage.getUrl(file.fileId)
      return {
        fileName: file.fileName,
        url: url || undefined,
        fileId: file.fileId,
        _id: file._id,
        cvSummary: file.cvSummary,
      }
    }

    return {
      fileName: undefined,
      url: undefined,
      fileId: undefined,
      _id: undefined,
      cvSummary: undefined,
    }
  },
})

// Get meeting recordings for a specific candidate
export const getMeetingRecordings = query({
  args: {
    candidateId: v.id("candidates"),
  },
  returns: v.array(
    v.object({
      _id: v.id("files"),
      fileName: v.string(),
      fileSize: v.number(),
      fileType: v.string(),
      uploadedAt: v.number(),
      url: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Query files for this candidate that are meeting recordings
    const files = await ctx.db
      .query("files")
      .withIndex("by_candidateId", (q) => q.eq("candidateId", args.candidateId))
      .filter((q) => q.eq(q.field("fileCategory"), "meeting_recording"))
      .collect()

    // Get download URLs for each file
    const recordingsWithUrls = await Promise.all(
      files.map(async (file) => {
        const url = await ctx.storage.getUrl(file.fileId)
        return {
          _id: file._id,
          fileName: file.fileName,
          fileSize: file.fileSize,
          fileType: file.fileType,
          uploadedAt: file.uploadedAt,
          url: url || undefined,
        }
      }),
    )

    return recordingsWithUrls
  },
})

// Upload file and trigger analysis
export const uploadAndAnalyze = mutation({
  args: {
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    storageId: v.id("_storage"),
    candidateId: v.id("candidates"),
    analysisId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("Starting file upload processing...")

    try {
      // Generate analysisId if not provided
      const analysisId =
        args.analysisId ||
        `analysis_${Date.now()}_${Math.floor(Math.random() * 1000)}`

      // Create file record with analysisId
      const fileId = await ctx.db.insert("files", {
        fileId: args.storageId,
        fileName: args.fileName,
        fileSize: args.fileSize,
        fileType: args.fileType,
        uploadedAt: Date.now(),
        analysisId: analysisId,
        status: "uploading",
        fileCategory: "resume",
        candidateId: args.candidateId,
      })

      // Update candidate record with cvFileId
      await ctx.db.patch(args.candidateId, {
        cvFileId: fileId,
      })

      // Schedule analysis with both fileId and analysisId
      await ctx.scheduler.runAfter(0, api.cvAnalysis.analyzeStoredCV, {
        fileId,
        analysisId: analysisId,
      })

      return { fileId, storageId: args.storageId }
    } catch (error) {
      console.error("Error in uploadAndAnalyze:", error)
      throw error
    }
  },
})

// Update file status
export const updateStatus = mutation({
  args: {
    id: v.id("files"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    })
  },
})

// Get file by ID
export const getById = query({
  args: { id: v.id("files") },
  returns: v.union(
    v.object({
      _id: v.id("files"),
      fileId: v.id("_storage"),
      fileName: v.string(),
      fileSize: v.number(),
      fileType: v.string(),
      candidateId: v.id("candidates"),
      uploadedAt: v.number(),
      cvSummary: v.optional(v.string()),
      fileCategory: v.optional(v.string()),
      status: v.optional(v.string()),
      analysisId: v.optional(v.string()),
      updatedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id)
    if (!file) return null
    return {
      _id: file._id,
      fileId: file.fileId,
      fileName: file.fileName,
      fileSize: file.fileSize,
      fileType: file.fileType,
      candidateId: file.candidateId,
      uploadedAt: file.uploadedAt,
      cvSummary: file.cvSummary,
      fileCategory: file.fileCategory,
      status: file.status,
      analysisId: file.analysisId,
      updatedAt: file.updatedAt,
    }
  },
})

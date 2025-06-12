import {
  action,
  internalAction,
  internalQuery,
  query,
} from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import { api, internal } from "./_generated/api"
import OpenAI from "openai"

// Helper function to get OpenAI client
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY as string,
  })
}

// Generate embeddings using OpenAI
export const generateEmbeddings = action({
  args: { text: v.string() },
  returns: v.array(v.number()),
  handler: async (ctx, args) => {
    try {
      console.log(
        `Generating embeddings for text (length: ${args.text.length}): "${args.text.substring(0, 100)}..."`,
      )
      if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY not set in environment")
        throw new Error("OpenAI API key not configured")
      }
      const openai = getOpenAIClient()
      console.log("OpenAI client initialized, calling embeddings API...")
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: args.text,
      })
      if (!response.data || response.data.length === 0) {
        console.error("OpenAI returned empty embedding data")
        return []
      }
      console.log(
        `Successfully generated embedding with ${response.data[0].embedding.length} dimensions`,
      )
      return response.data[0].embedding
    } catch (error) {
      console.error("Error generating embeddings:", error)
      if (error instanceof Error) {
        console.error("Error name:", error.name)
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      return []
    }
  },
})

// Get document by ID (public helper)
export const getDocumentById = query({
  args: { id: v.id("dbDocuments") },
  returns: v.union(
    v.object({
      _id: v.id("dbDocuments"),
      _creationTime: v.number(),
      title: v.string(),
      content: v.string(),
      tableName: v.string(),
      documentId: v.optional(v.string()),
      embedding: v.array(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

// Simple query to fetch document data for a list of IDs (without the embedding field)
export const fetchDocumentsByIds = internalQuery({
  args: { ids: v.array(v.id("dbDocuments")) },
  returns: v.array(
    v.object({
      _id: v.id("dbDocuments"),
      _creationTime: v.number(),
      title: v.string(),
      content: v.string(),
      tableName: v.string(),
      documentId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const results = []
    for (const id of args.ids) {
      const doc = await ctx.db.get(id)
      if (doc === null) {
        continue
      }
      // Exclude embedding from the results
      results.push({
        _id: doc._id,
        _creationTime: doc._creationTime,
        title: doc.title,
        content: doc.content,
        tableName: doc.tableName,
        documentId: doc.documentId,
      })
    }
    return results
  },
})

/**
 * Main action to handle semantic search in the database for the AI chat
 * This is the primary function the AI chat will use
 */
export const performSemanticSearch = action({
  args: {
    query: v.string(),
    tableName: v.optional(v.string()),
    entityType: v.optional(v.string()),
    candidateStatus: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    jobCompany: v.optional(v.string()),
    interviewStatus: v.optional(v.string()),
    limit: v.optional(v.number()),
    scoreThreshold: v.optional(v.number()),
  },
  returns: v.string(), // Returns formatted results as string for the chat
  handler: async (ctx, args): Promise<string> => {
    try {
      console.log(`Performing semantic search for query: "${args.query}"`)

      // 1. Generate embedding for the query
      const embedding = await ctx.runAction(
        api.vectorSearch.generateEmbeddings,
        {
          text: args.query,
        },
      )

      if (embedding.length === 0) {
        return "Sorry, I couldn't generate embeddings for your query. Please try again with different wording."
      }

      // 2. Set up search parameters
      const limit = args.limit || 10

      // Build filter expressions
      const filterExpressions: Array<(q: any) => any> = []

      // Add table filter if specified
      if (args.tableName) {
        console.log(`Adding filter for tableName: ${args.tableName}`)
        filterExpressions.push((q) => q.eq("tableName", args.tableName))
      }

      // Add entity type filter if specified
      if (args.entityType) {
        console.log(`Adding filter for entityType: ${args.entityType}`)
        filterExpressions.push((q) =>
          q.eq("metadata.entityType", args.entityType),
        )
      }

      // Add candidate status filter if specified
      if (args.candidateStatus) {
        console.log(
          `Adding filter for candidateStatus: ${args.candidateStatus}`,
        )
        filterExpressions.push((q) =>
          q.eq("metadata.candidateStatus", args.candidateStatus),
        )
      }

      // Add job title filter if specified
      if (args.jobTitle) {
        console.log(`Adding filter for jobTitle: ${args.jobTitle}`)
        filterExpressions.push((q) => q.eq("metadata.jobTitle", args.jobTitle))
      }

      // Add job company filter if specified
      if (args.jobCompany) {
        console.log(`Adding filter for jobCompany: ${args.jobCompany}`)
        filterExpressions.push((q) =>
          q.eq("metadata.jobCompany", args.jobCompany),
        )
      }

      // Add interview status filter if specified
      if (args.interviewStatus) {
        console.log(
          `Adding filter for interviewStatus: ${args.interviewStatus}`,
        )
        filterExpressions.push((q) =>
          q.eq("metadata.interviewStatus", args.interviewStatus),
        )
      }

      // Construct the search parameters
      const vectorSearchParams: {
        vector: number[]
        limit: number
        filter?: (q: any) => any
      } = { vector: embedding, limit }

      // Apply combined filters if any
      if (filterExpressions.length > 0) {
        if (filterExpressions.length === 1) {
          // Just use the single filter directly
          vectorSearchParams.filter = filterExpressions[0]
        } else {
          // Combine multiple filters with OR
          vectorSearchParams.filter = (q) => {
            // Build the OR expression with all filters
            let orExpression = q.or(
              filterExpressions[0](q),
              filterExpressions[1](q),
            )

            // Add additional expressions if there are more than 2
            for (let i = 2; i < filterExpressions.length; i++) {
              orExpression = q.or(orExpression, filterExpressions[i](q))
            }

            return orExpression
          }
        }
      }

      // 3. Perform vector search
      const searchResults = await ctx.vectorSearch(
        "dbDocuments",
        "by_embedding",
        vectorSearchParams,
      )
      console.log(`Vector search returned ${searchResults.length} results`)

      // Filter by score threshold if provided
      const scoreThreshold = args.scoreThreshold || -1 // Default to -1 to include all results
      const filteredResults =
        scoreThreshold > -1
          ? searchResults.filter((r) => r._score >= scoreThreshold)
          : searchResults

      if (filteredResults.length !== searchResults.length) {
        console.log(
          `Filtered results by score threshold (${scoreThreshold}): ${filteredResults.length} remaining`,
        )
      }

      if (filteredResults.length === 0) {
        return "I couldn't find any relevant information in the database. Please try a different query or check if the database has been populated."
      }

      // 4. Fetch full document data for each search result
      const documentIds = filteredResults.map((result) => result._id)

      // Call the internal query directly without going through the API
      const documents = await ctx.runQuery(
        internal.vectorSearch.fetchDocumentsByIds,
        { ids: documentIds },
      )

      // 5. Format the results with relevance scores
      let formattedResults = "Here's what I found in the database:\n\n"

      filteredResults.forEach((result, index) => {
        const document = documents.find((doc: any) => doc._id === result._id)

        if (document) {
          // Extract just the name from the title rather than showing "Candidate: Name"
          const cleanTitle = document.title.replace(/^(Candidate|Job): /, "")

          // Add markdown formatting - use heading format for results
          formattedResults += `## ${index + 1}. ${cleanTitle}\n\n`

          // Include relevance score to help understand match quality
          formattedResults += `**Relevance Score**: ${(result._score * 100).toFixed(2)}%\n\n`

          // Include the document type but don't include "Table:" prefix
          formattedResults += `**Type**: ${document.tableName}\n\n`

          // Include the full content, not just a snippet, with markdown formatting
          const contentLines = document.content
            .split("\n")
            .filter((line: string) => line.trim() !== "")
          contentLines.forEach((line: string) => {
            if (line.includes(":")) {
              // For key-value pairs, format as bold keys
              const [key, value] = line
                .split(":", 2)
                .map((part: string) => part?.trim() || "")
              formattedResults += `**${key}**: ${value}\n\n`
            } else {
              formattedResults += `${line}\n\n`
            }
          })

          formattedResults += "\n"
        }
      })

      return formattedResults
    } catch (error) {
      console.error("Error during semantic search:", error)
      return "Sorry, I encountered an error while searching the database. Please try again later."
    }
  },
})

// Perform raw vector search using embeddings
export const performRawVectorSearch = action({
  args: {
    query: v.string(),
    tableName: v.optional(v.string()),
    entityType: v.optional(v.string()),
    candidateStatus: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    jobCompany: v.optional(v.string()),
    interviewStatus: v.optional(v.string()),
    limit: v.optional(v.number()),
    scoreThreshold: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("dbDocuments"),
      _creationTime: v.number(),
      title: v.string(),
      content: v.string(),
      tableName: v.string(),
      documentId: v.optional(v.string()),
      metadata: v.optional(v.any()),
      _score: v.number(),
    }),
  ),
  handler: async (
    ctx,
    args,
  ): Promise<
    Array<{
      _id: Id<"dbDocuments">
      _creationTime: number
      title: string
      content: string
      tableName: string
      documentId?: string
      metadata?: any
      _score: number
    }>
  > => {
    try {
      console.log(`Starting raw vector search for query: "${args.query}"`)
      console.log("Generating embedding for query...")
      // Use the api namespace instead of internal for the generateEmbeddings function
      const embedding: number[] = await ctx.runAction(
        api.vectorSearch.generateEmbeddings,
        {
          text: args.query,
        },
      )
      console.log(`Embedding generated, length: ${embedding.length}`)
      if (embedding.length === 0) {
        console.error("Failed to generate embedding for query")
        return []
      }
      const limit = args.limit || 10

      // Build filter expressions
      const filterExpressions: Array<(q: any) => any> = []

      // Add table filter if specified
      if (args.tableName) {
        console.log(`Adding filter for tableName: ${args.tableName}`)
        filterExpressions.push((q) => q.eq("tableName", args.tableName))
      }

      // Add entity type filter if specified
      if (args.entityType) {
        console.log(`Adding filter for entityType: ${args.entityType}`)
        filterExpressions.push((q) =>
          q.eq("metadata.entityType", args.entityType),
        )
      }

      // Add candidate status filter if specified
      if (args.candidateStatus) {
        console.log(
          `Adding filter for candidateStatus: ${args.candidateStatus}`,
        )
        filterExpressions.push((q) =>
          q.eq("metadata.candidateStatus", args.candidateStatus),
        )
      }

      // Add job title filter if specified
      if (args.jobTitle) {
        console.log(`Adding filter for jobTitle: ${args.jobTitle}`)
        filterExpressions.push((q) => q.eq("metadata.jobTitle", args.jobTitle))
      }

      // Add job company filter if specified
      if (args.jobCompany) {
        console.log(`Adding filter for jobCompany: ${args.jobCompany}`)
        filterExpressions.push((q) =>
          q.eq("metadata.jobCompany", args.jobCompany),
        )
      }

      // Add interview status filter if specified
      if (args.interviewStatus) {
        console.log(
          `Adding filter for interviewStatus: ${args.interviewStatus}`,
        )
        filterExpressions.push((q) =>
          q.eq("metadata.interviewStatus", args.interviewStatus),
        )
      }

      // Construct the search parameters
      const vectorSearchParams: {
        vector: number[]
        limit: number
        filter?: (q: any) => any
      } = { vector: embedding, limit: limit }

      // Apply combined filters if any
      if (filterExpressions.length > 0) {
        if (filterExpressions.length === 1) {
          // Just use the single filter directly
          vectorSearchParams.filter = filterExpressions[0]
        } else {
          // Combine multiple filters with OR
          vectorSearchParams.filter = (q) => {
            // Build the OR expression with all filters
            let orExpression = q.or(
              filterExpressions[0](q),
              filterExpressions[1](q),
            )

            // Add additional expressions if there are more than 2
            for (let i = 2; i < filterExpressions.length; i++) {
              orExpression = q.or(orExpression, filterExpressions[i](q))
            }

            return orExpression
          }
        }
      }

      console.log("Executing vector search...")
      const results = await ctx.vectorSearch(
        "dbDocuments",
        "by_embedding",
        vectorSearchParams,
      )
      console.log(`Vector search returned ${results.length} results`)

      // Filter by score threshold if provided
      const scoreThreshold = args.scoreThreshold || -1 // Default to -1 to include all results
      const filteredResults =
        scoreThreshold > -1
          ? results.filter((r) => r._score >= scoreThreshold)
          : results

      if (filteredResults.length !== results.length) {
        console.log(
          `Filtered results by score threshold (${scoreThreshold}): ${filteredResults.length} remaining`,
        )
      }

      // Get full document data for each result
      const documents: Array<{
        _id: Id<"dbDocuments">
        _creationTime: number
        title: string
        content: string
        tableName: string
        documentId?: string
        metadata?: any
        _score: number
      }> = []

      for (const result of filteredResults) {
        // Get the document using our internal query function
        const doc = await ctx.runQuery(api.vectorSearch.getDocumentById, {
          id: result._id,
        })
        if (doc) {
          documents.push({
            _id: doc._id,
            _creationTime: doc._creationTime,
            title: doc.title,
            content: doc.content,
            tableName: doc.tableName,
            documentId: doc.documentId,
            metadata: doc.metadata,
            _score: result._score,
          })
        }
      }

      console.log(`Returning ${documents.length} raw documents`)
      return documents
    } catch (error) {
      console.error("Vector search error:", error)
      return []
    }
  },
})

// Simple wrapper action to get raw vector search results
export const getRawVectorResults = action({
  args: {
    query: v.string(),
    tableName: v.optional(v.string()),
    entityType: v.optional(v.string()),
    candidateStatus: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    jobCompany: v.optional(v.string()),
    interviewStatus: v.optional(v.string()),
    limit: v.optional(v.number()),
    scoreThreshold: v.optional(v.number()),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    try {
      console.log(`Getting raw vector results for: "${args.query}"`)

      // Perform the vector search using the api namespace
      const results = await ctx.runAction(
        api.vectorSearch.performRawVectorSearch,
        {
          query: args.query,
          tableName: args.tableName,
          entityType: args.entityType,
          candidateStatus: args.candidateStatus,
          jobTitle: args.jobTitle,
          jobCompany: args.jobCompany,
          interviewStatus: args.interviewStatus,
          limit: args.limit || 10,
          scoreThreshold: args.scoreThreshold,
        },
      )

      if (results.length === 0) {
        return JSON.stringify({ message: "No results found in the database." })
      }

      // Return the raw results as a JSON string
      return JSON.stringify({
        results: results,
        count: results.length,
        query: args.query,
        filters: {
          tableName: args.tableName,
          entityType: args.entityType,
          candidateStatus: args.candidateStatus,
          jobTitle: args.jobTitle,
          jobCompany: args.jobCompany,
          interviewStatus: args.interviewStatus,
          scoreThreshold: args.scoreThreshold,
        },
      })
    } catch (error) {
      console.error("Error retrieving vector search results:", error)
      return JSON.stringify({
        error: "Error retrieving vector search results.",
      })
    }
  },
})

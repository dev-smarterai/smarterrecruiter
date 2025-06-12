import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Create or get a user after authentication
export const createOrGetUser = mutation({
  args: {},
  returns: v.object({
    userId: v.string(),
    role: v.string(),
    completedOnboarding: v.boolean(),
  }),
  handler: async (ctx) => {
    // Get the identity from Convex Auth
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const tokenIdentifier = identity.tokenIdentifier
    const email = identity.email || ""

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique()

    if (existingUser) {
      // Update last login time
      await ctx.db.patch(existingUser._id, {
        lastLogin: new Date().toISOString(),
      })

      return {
        userId: existingUser._id,
        role: existingUser.role,
        completedOnboarding: existingUser.completedOnboarding,
      }
    }

    // Create a new user - defaults to 'user' role
    const userId = await ctx.db.insert("users", {
      tokenIdentifier,
      email,
      role: "member", // Default role
      completedOnboarding: false,
      lastLogin: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    })

    return {
      userId,
      role: "member",
      completedOnboarding: false,
    }
  },
})

// Get the current user data
export const getMe = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.string(),
      role: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      completedOnboarding: v.boolean(),
      lastLogin: v.optional(v.string()),
      avatar: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) {
      return null
    }

    return {
      _id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
      completedOnboarding: user.completedOnboarding,
      lastLogin: user.lastLogin,
      avatar: user.avatar,
    }
  },
})

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    completedOnboarding: v.optional(v.boolean()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return false
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) {
      return false
    }

    const updates: Record<string, any> = {}

    if (args.name !== undefined) {
      updates.name = args.name
    }

    if (args.avatar !== undefined) {
      updates.avatar = args.avatar
    }

    if (args.completedOnboarding !== undefined) {
      updates.completedOnboarding = args.completedOnboarding
    }

    updates.lastActivity = new Date().toISOString()

    await ctx.db.patch(user._id, updates)

    return true
  },
})

// Login a user with email and password
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.boolean(),
      sessionToken: v.optional(v.string()),
    }),
    v.boolean(),
  ),
  handler: async (ctx, args) => {
    console.log("Login attempt:", args.email)

    // Find the user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique()

    if (!user) {
      console.log("User not found")
      return {
        success: false,
        sessionToken: undefined,
      }
    }

    // In a real app, you'd need to verify the password hash
    // For now, this is a simplified version
    // Note: In production, use a proper password hashing library
    if (user.passwordHash !== args.password) {
      // NEVER store passwords in plain text in production
      console.log("Password mismatch")
      return {
        success: false,
        sessionToken: undefined,
      }
    }

    // Generate a session token - using timestamp for simplicity in development
    // In production, use a proper crypto library for token generation
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    console.log("Generated session token:", sessionToken)

    // Update the user with the new session token
    await ctx.db.patch(user._id, {
      sessionToken,
      lastLogin: new Date().toISOString(),
    })

    console.log("Login successful")
    return {
      success: true,
      sessionToken,
    }
  },
})

// Logout the current user
export const logout = mutation({
  args: {
    sessionToken: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      return false
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) {
      return false
    }

    // Clear the session token
    await ctx.db.patch(user._id, {
      sessionToken: undefined,
    })

    return true
  },
})

// Validate if the current session is valid
export const validateSession = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Authentication via Convex Auth
    const identity = await ctx.auth.getUserIdentity()
    console.log("validateSession - identity:", !!identity)

    if (identity) {
      return true
    }

    // If explicit session token provided
    if (args.sessionToken) {
      console.log("validateSession - checking token:", args.sessionToken)

      // First try using the by_session index
      let user = await ctx.db
        .query("users")
        .withIndex("by_session", (q) => q.eq("sessionToken", args.sessionToken))
        .unique()

      if (user) {
        console.log("validateSession - user found with index")
        return true
      }

      // If that fails, try a full scan (for debugging only - remove in production)
      console.log("validateSession - index lookup failed, trying full scan")
      const allUsers = await ctx.db.query("users").collect()

      // Log how many users have session tokens for debugging
      const usersWithSessionTokens = allUsers.filter((u) => !!u.sessionToken)
      console.log(
        `validateSession - found ${usersWithSessionTokens.length} users with session tokens`,
      )

      // Check if any user has the provided session token
      const matchingUser = allUsers.find(
        (u) => u.sessionToken === args.sessionToken,
      )
      console.log("validateSession - user found via scan:", !!matchingUser)

      if (matchingUser) {
        console.log("validateSession - matched user:", matchingUser.email)
      }

      return !!matchingUser
    }

    return false
  },
})

// Get the current user data by checking the session
export const getCurrentUser = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
      role: v.string(),
      completedOnboarding: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    // Try authentication via Convex Auth
    const identity = await ctx.auth.getUserIdentity()

    let user = null

    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique()
    } else if (args.sessionToken) {
      // Or try with session token
      user = await ctx.db
        .query("users")
        .withIndex("by_session", (q) => q.eq("sessionToken", args.sessionToken))
        .unique()
    }

    if (!user) {
      return null
    }

    return {
      _id: user._id,
      name: user.name || "",
      email: user.email,
      role: user.role,
      completedOnboarding: user.completedOnboarding,
    }
  },
})

// Get the authenticated user's data
export const me = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.string(),
      role: v.string(),
      completedOnboarding: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!user) {
      return null
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      completedOnboarding: user.completedOnboarding,
    }
  },
})

// Manually register a new user
export const registerUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    completedOnboarding: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    userId: v.optional(v.id("users")),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    console.log("Attempting to register user:", args.email)

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique()

    if (existingUser) {
      console.log("User already exists")
      return {
        success: false,
        message: "User with this email already exists",
      }
    }

    // Create a mock tokenIdentifier for manually created users
    const tokenIdentifier = `manual_${args.email}_${Date.now()}`

    // Insert the new user
    const userId = await ctx.db.insert("users", {
      tokenIdentifier,
      email: args.email,
      passwordHash: args.password, // In production, hash this!
      name: args.name || "",
      role: args.role || "user",
      completedOnboarding: args.completedOnboarding ?? false,
      lastLogin: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    })

    console.log("User registered successfully:", userId)

    return {
      success: true,
      userId,
      message: "User registered successfully",
    }
  },
})

// Get all users
export const getAllUsers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.string(),
      role: v.string(),
      completedOnboarding: v.boolean(),
      lastLogin: v.optional(v.string()),
      lastActivity: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect()

    return users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      completedOnboarding: user.completedOnboarding,
      lastLogin: user.lastLogin,
      lastActivity: user.lastActivity,
    }))
  },
})

// Update user role
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    newRole: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get the target user
    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser) {
      return {
        success: false,
        message: "Target user not found",
      }
    }

    // Update the user's role
    await ctx.db.patch(args.userId, {
      role: args.newRole,
    })

    return {
      success: true,
      message: `Successfully updated user's role to ${args.newRole}`,
    }
  },
})

// Complete the onboarding process for an admin user
export const completeOnboarding = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    console.log("completeOnboarding mutation called with userId:", args.userId)

    // Get the user directly by ID
    const user = await ctx.db.get(args.userId)
    console.log("Found user:", user ? `${user.email} (${user.role})` : "null")

    if (!user) {
      return {
        success: false,
        message: "User not found",
      }
    }

    // Update the user to mark onboarding as completed
    console.log("Updating user, setting completedOnboarding to true")
    await ctx.db.patch(user._id, {
      completedOnboarding: true,
      lastActivity: new Date().toISOString(),
    })

    console.log("User updated successfully")
    return {
      success: true,
      message: "Onboarding completed successfully",
    }
  },
})

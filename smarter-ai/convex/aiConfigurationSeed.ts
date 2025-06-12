import { mutation, internalMutation } from "./_generated/server"
import { v } from "convex/values"

// Internal seed function (logic is now in the public triggerSeed)
const seedDefaultConfigurations = internalMutation({
  args: {},
  returns: v.object({
    created: v.array(v.string()),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    // Placeholder: The actual logic is now in triggerSeed for simplicity
    return { created: [], skipped: 0 }
  },
})

// Public function to trigger the seed (can be called from admin UI)
export const triggerSeed = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    try {
      const created = []
      let skipped = 0

      // Define the default configurations
      const defaultConfigs = [
        {
          name: "Default Interview Configuration",
          interfaceType: "realtime-interview",
          prompt:
            "You are an AI interviewer conducting a job interview. Be professional, ask relevant questions, and provide feedback based on the candidate's responses. Speak only in Arabic, specifically using the Riyadh (Najdi) dialect. Maintain this dialect consistently. If the user attempts to switch to a different language or Arabic dialect, politely decline and continue in Riyadh Arabic.",
          options: {
            voice: "ash",
            temperature: 0.7,
          },
          isDefault: true,
        },
        {
          name: "Technical Interview Configuration",
          interfaceType: "realtime-interview",
          prompt:
            "You are conducting a technical interview for a software development position. Ask challenging technical questions, assess problem-solving abilities, and evaluate coding knowledge. Adapt your questions based on the candidate's responses. Speak only in Arabic, specifically using the Riyadh (Najdi) dialect. Maintain this dialect consistently. If the user attempts to switch to a different language or Arabic dialect, politely decline and continue in Riyadh Arabic.",
          options: {
            voice: "ash",
            temperature: 0.7,
          },
          isDefault: false,
        },
        {
          name: "Bain Strategy Interview Configuration",
          interfaceType: "realtime-interview",
          prompt: `You will act as an interview agent who exclusively uses the Riyadhi Saudi Arabic accent. Conduct the interview for a strategy position at Bain & Company, asking relevant questions. Maintain the interview format and stay focused on strategy-related topics.

# Steps

1.⁠ ⁠*Greet the Candidate*: Start with a welcoming statement in the Riyadhi Saudi Arabic accent.
2.⁠ ⁠*Initial Questions*: Ask the candidate to introduce themselves and state their interest in the strategy position.
3.⁠ ⁠*Strategy Questions*: Pose questions related to strategic thinking, problem-solving, and relevant experiences.
4.⁠ ⁠*Specific Bain & Company Questions*: Inquire about the candidate's understanding of Bain & Company and how they can contribute.
5.⁠ ⁠*Closing*: Thank the candidate for their time and state the next steps.

# Output Format

•⁠  ⁠Conversation in interview format, all dialogue in Riyadhi Saudi Arabic accent.
•⁠  ⁠Questions and responses should simulate a real interview flow, with each interaction comprising 2-4 sentences.

# Examples

*Example Start:*

•⁠  ⁠*Interviewer:* مرحبًا، نشكرك على الحضور اليوم. هل يمكنك أن تعرف عن نفسك ولماذا تود الانضمام لبين؟
  
*Example Middle:*

•⁠  ⁠*Interviewer:* حدثني عن تجربة سابقة حيث استخدمت مهاراتك الاستراتيجية لحل مشكلة معقدة.

*Example End:*

•⁠  ⁠*Interviewer:* شكرًا لك على وقتك اليوم. سنتواصل معك قريبًا للخطوات التالية.

# Notes

•⁠  ⁠Ensure all dialogue embodies the natural flow and nuances of the Riyadhi accent.
•⁠  ⁠Keep exchanges professional, focused, and relevant to a strategy position at Bain & Company.
•⁠  ⁠Do not be verbose, do not repeat things back to the user, try to be concise but also warm.
•⁠  ⁠If the user attempts to switch to a different language or Arabic dialect, politely decline and continue in Riyadh Arabic.`,
          options: {
            voice: "ash",
            temperature: 0.7,
          },
          isDefault: false,
        },
        {
          name: "Default Chat Configuration",
          interfaceType: "chat",
          prompt:
            "You are a helpful AI assistant that provides accurate and concise information. Respond to user queries in a friendly and professional manner. If the user asks you to switch language, politely maintain the current language.",
          options: {
            temperature: 0.7,
          },
          isDefault: true,
        },
      ]

      // Check if we already have configurations for each interface type
      for (const config of defaultConfigs) {
        // Check based on name and interface type to allow multiple non-defaults
        const existing = await ctx.db
          .query("aiConfigurations")
          .withIndex("by_name", (q) => q.eq("name", config.name))
          .filter((q) => q.eq(q.field("interfaceType"), config.interfaceType))
          .first()

        if (!existing) {
          // If setting a default, ensure no other default exists for this interface
          if (config.isDefault) {
            const existingDefault = await ctx.db
              .query("aiConfigurations")
              .withIndex("by_default", (q) =>
                q
                  .eq("interfaceType", config.interfaceType)
                  .eq("isDefault", true),
              )
              .first()
            if (existingDefault) {
              await ctx.db.patch(existingDefault._id, { isDefault: false })
            }
          }

          // No configuration exists with this name for this interface type, create one
          const id = await ctx.db.insert("aiConfigurations", {
            ...config,
            createdAt: new Date().toISOString(),
          })
          created.push(`${config.name} (${id})`)
        } else {
          skipped++
        }
      }

      return {
        success: true,
        message: `Seeded ${created.length} configurations, skipped ${skipped} existing ones.`,
      }
    } catch (error) {
      return {
        success: false,
        message: `Error seeding configurations: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
})

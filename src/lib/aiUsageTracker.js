// src/lib/aiUsageTracker.js
// AI Usage Tracker — wraps InvokeLLM calls and logs token consumption.
// Follows "Generate Once, Store, Reuse" principle: use stored content first,
// only call AI when no stored content exists.

import { base44 } from "@/api/base44Client";

/**
 * Estimate token count from prompt + response (approx 4 chars = 1 token).
 */
function estimateTokens(prompt, response) {
  const promptChars = typeof prompt === "string" ? prompt.length : JSON.stringify(prompt || "").length;
  const responseChars = typeof response === "string"
    ? response.length
    : JSON.stringify(response || "").length;
  return Math.ceil((promptChars + responseChars) / 4);
}

/**
 * InvokeLLM with automatic usage logging.
 * Use this instead of base44.integrations.Core.InvokeLLM directly.
 *
 * @param {Object} options - Same options as InvokeLLM (prompt, model, response_json_schema, etc.)
 * @param {string} purpose - One of: content_generation, student_interaction, hint, encouragement, quiz_analysis, tutor, recommendation
 * @param {string} topicName - Optional topic context for logging
 * @returns {Promise<any>} - The LLM response
 */
export async function trackedInvokeLLM(options, purpose = "student_interaction", topicName = "") {
  const result = await base44.integrations.Core.InvokeLLM(options);

  // Log usage asynchronously (non-blocking — don't slow down the user experience)
  try {
    const user = await base44.auth.me().catch(() => ({ id: "anonymous" }));
    const tokens = estimateTokens(options.prompt, result);
    const metadata = JSON.stringify({
      prompt_preview: String(options.prompt || "").substring(0, 150),
      has_schema: !!options.response_json_schema,
      success: true,
    });

    // Fire-and-forget: use create which works for any authenticated user (create: null in RLS)
    base44.entities.AIUsageLog.create({
      purpose,
      model: options.model || "automatic",
      tokens_used: tokens,
      user_id: user?.id || "anonymous",
      topic_name: topicName || "",
      metadata,
    }).catch(() => {});
  } catch (e) {
    // Logging failure should never break the user experience
  }

  return result;
}

/**
 * Retrieve stored content from a Quiz/Lesson entity.
 * Returns the stored value or null if not present.
 * This is the core of "Generate Once, Store, Reuse" — check here before calling AI.
 */
export function getStoredContent(quizEntity, field) {
  if (!quizEntity || !field) return null;
  const raw = quizEntity[field];
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(String(raw).replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim());
  } catch (e) {
    return null;
  }
}

/**
 * Check if a lesson's AI content has been generated and is ready for use.
 */
export function isContentReady(quizEntity) {
  const status = quizEntity?.lesson_content_status;
  return status === "ai_generated" || status === "reviewed" || status === "published";
}
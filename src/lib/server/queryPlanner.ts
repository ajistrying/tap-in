import { OpenRouter } from "@openrouter/sdk";
import { z } from "zod";

const DateRange = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().default("UTC")
});

export const QueryPlanSchema = z.object({
  intent: z.enum(["accomplishments", "in_flight", "recap", "lookup"]),
  time_range: DateRange.nullable().default(null),
  doc_types: z
    .array(
      z.enum([
        "daily-note",
        "project",
        "project-note",
        "project-dashboard",
        "recurring-tasks",
        "weekly-review",
        "goal",
        "idea-captures"
      ])
    )
    .default([]),
  project: z.string().nullable().default(null),
  statuses: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  answer_mode: z.enum(["sql_only", "hybrid", "vector_only"]).default("hybrid"),
  limit: z.number().int().min(1).max(200).default(50),
  followup_question: z.string().nullable().default(null)
});

export type QueryPlan = z.infer<typeof QueryPlanSchema>;

const DEFAULT_PLANNER_MODEL = "openai/gpt-4o-mini";

const PLANNER_SYSTEM_PROMPT = `Return ONLY JSON matching this schema:
{
  "intent": "accomplishments" | "in_flight" | "recap" | "lookup",
  "time_range": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD", "timezone": "Area/City" } | null,
  "doc_types": ["daily-note" | "project" | "project-note" | "project-dashboard" | "recurring-tasks" | "weekly-review" | "goal" | "idea-captures"],
  "project": string | null,
  "statuses": string[],
  "tags": string[],
  "answer_mode": "sql_only" | "hybrid" | "vector_only",
  "limit": number,
  "followup_question": string | null
}

Rules:
- Resolve relative time ranges using Today and Timezone.
- If a time-bound intent is missing a range, set followup_question and set time_range to null.
- Use empty arrays for doc_types, statuses, tags when absent.
- If the question implies "today", "now", or "current", prefer doc_types including "daily-note" and set time_range to today.
- Do not output SQL or extra text.`;

const buildPlannerPrompt = (question: string, today: string, timezone: string) =>
  `Question: ${question}
Today: ${today}
Timezone: ${timezone}`;

const extractJson = (content: string) => {
  const trimmed = content.trim();
  if (trimmed.startsWith("```")) {
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fencedMatch?.[1]) {
      return fencedMatch[1].trim();
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
};

const normalizeContent = (content: unknown) => {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
          return item.text;
        }
        return "";
      })
      .join("");
  }

  return "";
};

export const planQuery = async (
  env: App.Platform["env"],
  question: string,
  options: { today: string; timezone: string }
) => {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is required to plan queries.");
  }

  const openrouter = new OpenRouter({ apiKey: env.OPENROUTER_API_KEY });
  const rawPlannerModel =
    typeof env.OPENROUTER_PLANNER_MODEL === "string" && env.OPENROUTER_PLANNER_MODEL.trim().length > 0
      ? env.OPENROUTER_PLANNER_MODEL.trim()
      : null;
  const rawChatModel =
    typeof env.OPENROUTER_CHAT_MODEL === "string" && env.OPENROUTER_CHAT_MODEL.trim().length > 0
      ? env.OPENROUTER_CHAT_MODEL.trim()
      : null;
  const modelId = rawPlannerModel ?? rawChatModel ?? DEFAULT_PLANNER_MODEL;
  const prompt = buildPlannerPrompt(question, options.today, options.timezone);

  const response = await openrouter.chat.send({
    model: modelId,
    messages: [
      { role: "system", content: PLANNER_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]
  });

  if (typeof response === "string") {
    throw new Error("Unexpected OpenRouter planner response.");
  }

  const rawContent = response.choices?.[0]?.message?.content;
  const content = normalizeContent(rawContent);
  if (!content) {
    throw new Error("Planner response missing content.");
  }

  const json = extractJson(content);
  const parsed = QueryPlanSchema.parse(JSON.parse(json));
  return parsed;
};

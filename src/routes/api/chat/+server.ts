import { OpenRouter } from "@openrouter/sdk";
import type { RequestHandler } from "@sveltejs/kit";
import { createDb } from "$lib/server/db";
import { embedQuery } from "$lib/server/embeddings";
import { findSimilarChunks } from "$lib/server/rag";

const DEFAULT_CHAT_MODEL = "openai/gpt-4o-mini";

const buildContext = (chunks: any[]) =>
  chunks
    .map((chunk, index) => {
      const heading = chunk.heading ? `# ${chunk.heading}` : "Untitled section";
      return `Source ${index + 1}: ${chunk.sourceFile}\n${heading}\n${chunk.content}`;
    })
    .join("\n\n");

const buildSystemPrompt = (context: string) => `You are Wellington's public assistant.
Answer using only the context below. If the answer is not in the context, say you don't know.
Keep responses concise and cite sources inline like (Source 2).

Context:
${context}`;

type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
  | { role: "system"; content: string };

const normalizeMessages = (payload: Record<string, unknown>): ChatMessage[] | null => {
  const rawMessages = payload.messages;
  if (!Array.isArray(rawMessages)) {
    return null;
  }

  return rawMessages
    .map((message) => {
      if (!message || typeof message !== "object") {
        return null;
      }

      const role = "role" in message ? message.role : null;
      const content = "content" in message ? message.content : null;
      if (typeof role !== "string" || typeof content !== "string") {
        return null;
      }
      if (role === "user") {
        return { role: "user", content };
      }
      if (role === "assistant") {
        return { role: "assistant", content };
      }
      if (role === "system") {
        return { role: "system", content };
      }

      return null;
    })
    .filter((message): message is ChatMessage => Boolean(message));
};

export const POST: RequestHandler = async ({ request, platform }) => {
  if (!platform?.env) {
    return new Response("Platform env is required.", { status: 500 });
  }

  if (!platform.env.DATABASE_URL) {
    return new Response("DATABASE_URL is required.", { status: 500 });
  }

  if (!platform.env.OPENROUTER_API_KEY) {
    return new Response("OPENROUTER_API_KEY is required.", { status: 500 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response("Invalid JSON payload.", { status: 400 });
  }

  const question =
    typeof payload.message === "string"
      ? payload.message
      : typeof payload.query === "string"
      ? payload.query
      : null;
  const providedMessages = normalizeMessages(payload);

  if (!question && (!providedMessages || providedMessages.length === 0)) {
    return new Response("Missing message content.", { status: 400 });
  }

  const db = createDb(platform.env.DATABASE_URL);
  const embedding = await embedQuery(platform.env, question ?? providedMessages?.at(-1)?.content ?? "");
  const chunks = await findSimilarChunks(db, embedding, 5);
  const context =
    chunks.length > 0
      ? buildContext(chunks)
      : "No relevant context was found in the public notes.";

  const modelId = platform.env.OPENROUTER_CHAT_MODEL ?? DEFAULT_CHAT_MODEL;
  const openrouter = new OpenRouter({ apiKey: platform.env.OPENROUTER_API_KEY });
  const system = buildSystemPrompt(context);

  const messages: ChatMessage[] = providedMessages ?? [{ role: "user", content: question ?? "" }];
  const payloadMessages: ChatMessage[] = [{ role: "system", content: system }, ...messages];

  const stream = await openrouter.chat.send(
    {
      model: modelId,
      stream: true,
      messages: payloadMessages
    },
    {
      signal: request.signal
    }
  );

  const responseStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of stream) {
          if (chunk.error) {
            throw new Error(chunk.error.message);
          }
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
    async cancel() {
      try {
        await stream.cancel();
      } catch {
        // ignore cancel errors
      }
    }
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
};

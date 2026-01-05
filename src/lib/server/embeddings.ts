import { OpenRouter } from "@openrouter/sdk";

const DEFAULT_EMBEDDING_MODEL = "qwen/qwen3-embedding-8b";
export const EMBEDDING_DIMENSIONS = 768;

export const embedQuery = async (env: App.Platform["env"], input: string) => {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is required to generate embeddings.");
  }

  const openrouter = new OpenRouter({ apiKey: env.OPENROUTER_API_KEY });
  const modelId =
    typeof env.OPENROUTER_EMBEDDING_MODEL === "string" &&
    env.OPENROUTER_EMBEDDING_MODEL.trim().length > 0
      ? env.OPENROUTER_EMBEDDING_MODEL.trim()
      : DEFAULT_EMBEDDING_MODEL;
  const requestedDimensions = EMBEDDING_DIMENSIONS;

  let response;
  try {
    response = await openrouter.embeddings.generate({
      model: modelId,
      input,
      dimensions: requestedDimensions,
      encodingFormat: "float"
    });
  } catch (error) {
    response = await openrouter.embeddings.generate({
      model: modelId,
      input,
      encodingFormat: "float"
    });
  }

  if (typeof response === "string") {
    throw new Error("Unexpected OpenRouter embeddings response.");
  }

  const embedding = response.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("OpenRouter embeddings response missing embedding data.");
  }

  if (typeof embedding === "string") {
    throw new Error("OpenRouter embeddings returned a non-float encoding.");
  }

  if (embedding.length !== requestedDimensions) {
    throw new Error(
      `Embedding dimensions mismatch. Expected ${requestedDimensions}, received ${embedding.length}.`
    );
  }

  return embedding;
};

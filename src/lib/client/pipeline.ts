const createAbortError = () => {
  const error = new Error("Pipeline aborted");
  error.name = "AbortError";
  return error;
};

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        reject(createAbortError());
      },
      { once: true }
    );
  });

type Embedding = {
  model: string;
  dimensions: number;
  embedding: number[];
};

type StoredQuery = {
  id: string;
  question: string;
  embedding: Embedding;
};

type ContextChunk = {
  id: string;
  source: string;
  heading: string;
  score: number;
  content: string;
};

export type PipelineOptions = {
  question: string;
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: unknown) => void;
  signal?: AbortSignal;
};

const vectorizeQuery = async (question: string, signal?: AbortSignal): Promise<Embedding> => {
  await sleep(250, signal);
  return {
    model: "bge-base-en-v1.5",
    dimensions: 768,
    embedding: [0.12, -0.08, 0.04]
  };
};

const storeQuery = async (
  payload: { question: string; embedding: Embedding },
  signal?: AbortSignal
): Promise<StoredQuery> => {
  await sleep(150, signal);
  return {
    id: `query-${Date.now()}`,
    question: payload.question,
    embedding: payload.embedding
  };
};

const retrieveContext = async (_embedding: Embedding, signal?: AbortSignal): Promise<ContextChunk[]> => {
  await sleep(300, signal);
  return [
    {
      id: "chunk-1",
      source: "goals.md",
      heading: "Current Focus",
      score: 0.82,
      content: "Current focus includes shipping the public PKM interface and polishing the onboarding flow."
    }
  ];
};

const simulateStreamResponse = async (opts: PipelineOptions) => {
  const responseText =
    "Here’s a simulated response based on your question. In production this will be streamed from the RAG pipeline with citations grounded in the public PKM.";

  await sleep(5000, opts.signal);

  const words = responseText.split(" ");
  for (let index = 1; index <= words.length; index += 1) {
    if (opts.signal?.aborted) {
      throw createAbortError();
    }
    opts.onToken(words.slice(0, index).join(" "));
    await sleep(55, opts.signal);
  }

  opts.onComplete();
};

export const runPipeline = async (opts: PipelineOptions) => {
  try {
    const embedding = await vectorizeQuery(opts.question, opts.signal);
    await storeQuery({ question: opts.question, embedding }, opts.signal);
    await retrieveContext(embedding, opts.signal);
    await simulateStreamResponse(opts);
  } catch (error) {
    opts.onError(error);
  }
};

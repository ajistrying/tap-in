export type PipelineOptions = {
  question: string;
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: unknown) => void;
  signal?: AbortSignal;
};

export const runPipeline = async (opts: PipelineOptions) => {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: opts.question }),
      signal: opts.signal
    });

    if (!response.ok || !response.body) {
      throw new Error("Failed to start chat stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let content = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      const chunkText = decoder.decode(value, { stream: true });
      if (chunkText) {
        content += chunkText;
        opts.onToken(content);
      }
    }

    opts.onComplete();
  } catch (error) {
    opts.onError(error);
  }
};

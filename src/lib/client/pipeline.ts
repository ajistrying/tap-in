export type PipelineOptions = {
  question: string;
  messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  followup?: {
    originalQuestion: string;
  };
  onToken: (token: string) => void;
  onFollowup?: (payload: { followupQuestion: string; originalQuestion: string }) => void;
  onComplete: () => void;
  onError: (error: unknown) => void;
  signal?: AbortSignal;
};

export const runPipeline = async (opts: PipelineOptions) => {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: opts.question,
        messages: opts.messages,
        followup: opts.followup
      }),
      signal: opts.signal
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const message = `Failed to start chat stream (${response.status} ${response.statusText}).${
        errorText ? ` ${errorText}` : ""
      }`;
      throw new Error(message);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      if (
        payload &&
        payload.type === "followup" &&
        typeof payload.followupQuestion === "string" &&
        typeof payload.originalQuestion === "string"
      ) {
        opts.onFollowup?.({
          followupQuestion: payload.followupQuestion,
          originalQuestion: payload.originalQuestion
        });
        opts.onComplete();
        return;
      }

      throw new Error("Unexpected JSON response from chat.");
    }

    if (!response.body) {
      const fallbackText = await response.text().catch(() => "");
      if (fallbackText) {
        opts.onToken(fallbackText);
        opts.onComplete();
        return;
      }
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

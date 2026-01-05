<script>
  import "../app.css";
  import { tick } from "svelte";
  import { runPipeline } from "$lib/client/pipeline";

  const exampleQuestions = [
    "What are you focused on this month?",
    "What are you focused on this today?",
    "What projects are currently active?",
    "Summarize your latest writing on product strategy.",
    "What are you trying to improve next?",
    "What’s the current roadmap for your PKM system?"
  ];

  let inputValue = "";
  let inputEl;
  let isStreaming = false;
  let messageListEl;
  let abortController;
  let activeAssistantId = null;
  let pendingFollowup = null;

  let messages = [
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I can answer questions about current projects, public notes, and things I’m building. What do you want to explore?"
    }
  ];

  const handleExampleClick = (question) => {
    inputValue = question;
    inputEl?.focus();
  };

  const handleCancel = () => {
    if (!abortController || abortController.signal.aborted) {
      return;
    }
    abortController.abort();
  };

  const scrollToBottom = async (behavior = "smooth") => {
    await tick();
    messageListEl?.scrollTo({ top: messageListEl.scrollHeight, behavior });
  };

  const handleSubmit = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) {
      return;
    }

    const followupContext = pendingFollowup;
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed
    };
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: ""
    };

    messages = [...messages, userMessage, assistantMessage];
    scrollToBottom("auto");
    inputValue = "";
    isStreaming = true;
    abortController = new AbortController();
    activeAssistantId = assistantMessageId;

    try {
      await runPipeline({
        question: trimmed,
        followup: followupContext
          ? {
              originalQuestion: followupContext.originalQuestion
            }
          : undefined,
        signal: abortController.signal,
        onToken: (token) => {
          if (followupContext) {
            pendingFollowup = null;
          }
          messages = messages.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: token
                }
              : message
          );
          scrollToBottom("auto");
        },
        onFollowup: (payload) => {
          pendingFollowup = payload;
          messages = messages.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: payload.followupQuestion
                }
              : message
          );
          scrollToBottom("auto");
        },
        onComplete: () => {
          isStreaming = false;
          abortController = undefined;
          activeAssistantId = null;
        },
        onError: (error) => {
            console.error(error)
          const isAbort = error && typeof error === "object" && error.name === "AbortError";
          messages = messages.map((message) => {
            if (message.id !== assistantMessageId) {
              return message;
            }

            const content =
              isAbort && message.content ? message.content : isAbort ? "Response stopped." : "Something went wrong while preparing a response. Please try again.";

            return {
              ...message,
              content
            };
          });
          isStreaming = false;
          abortController = undefined;
          activeAssistantId = null;
        }
      });
    } catch (error) {
        console.error(error);
      messages = messages.map((message) =>
        message.id === assistantMessageId
          ? {
              ...message,
              content: "Something went wrong while preparing a response. Please try again."
            }
          : message
      );
      isStreaming = false;
      abortController = undefined;
      activeAssistantId = null;
    }
  };
</script>

<main class="relative min-h-screen overflow-hidden bg-base-200">
  <div class="ambient-bg">
    <div class="ambient-bg__grid"></div>
  </div>
  <section class="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-10">
    <header class="flex flex-col gap-3">
      <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Ask about what I’m working on</h1>
      <p class="sm:w-full lg:w-3/4 text-base text-base-content/70 sm:text-lg">
        Curious about what I’m building, or what my tasks are for today? Use this chat to explore the publicly available information in my Personal Knowledge Management (PKM) system!
      </p>
    </header>

    <div class="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <!-- Chat window -->
        <div class="card bg-base-100/80 shadow-xl">
            <div class="card-body flex h-[70vh] min-h-[520px] max-h-[70vh] flex-col gap-6 p-6 sm:p-8 lg:min-h-[600px] lg:h-[72vh] lg:max-h-[72vh]">
                <div class="flex-1 min-h-0 space-y-4 overflow-y-auto pr-2 text-base" bind:this={messageListEl}>
                    {#each messages as message (message.id)}
                    <div class={`chat ${message.role === "user" ? "chat-end" : "chat-start"}`}>
                        <div class="chat-header text-xs opacity-60">
                            {message.role === "user" ? "You" : "Wellington's PKMS"}
                        </div>
                        <div
                        class={`chat-bubble ${
                            message.role === "user"
                            ? "chat-bubble-primary mt-1"
                            : "bg-base-200 text-base-content mt-1"
                        }`}
                        >
                        {#if message.content}
                            {message.content}
                        {:else}
                            <span class="loading loading-dots loading-sm"></span>
                        {/if}
                        </div>
                    </div>
                    {/each}
                </div>

                <div class="divider -my-1">Ask a question</div>
                <form class="flex flex-col gap-3" on:submit|preventDefault={handleSubmit}>
                    {#if pendingFollowup}
                        <p class="text-xs text-base-content/70">
                            Follow-up needed: {pendingFollowup.followupQuestion}
                        </p>
                    {/if}
                    <div class="flex w-full items-center gap-3">
                        <label class="input input-bordered flex w-full items-center gap-2">
                            <input
                            type="text"
                            class="w-full grow"
                            placeholder="Ask a question!"
                            aria-label="Ask a question"
                            bind:value={inputValue}
                            bind:this={inputEl}
                            disabled={isStreaming}
                            />
                        </label>
              {#if isStreaming}
                <button class="btn btn-primary shrink-0" type="button" on:click={handleCancel}>
                  Stop
                </button>
              {:else}
                <button class="btn btn-primary shrink-0" type="submit">Send</button>
              {/if}
            </div>
                    <p class="text-xs text-base-content/60">Responses are grounded in my public notes, recent work, and daily task data.</p>
                </form>
            </div>
        </div>

        <!-- Prompt Example -->
        <aside class="card bg-base-100/80 shadow-xl">
            <div class="card-body gap-5">
                <div>
                    <h2 class="text-lg font-semibold">Try these</h2>
                    <p class="text-sm text-base-content/60">Quick prompts to get started.</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    {#each exampleQuestions as question}
                    <button
                        class="btn btn-sm btn-ghost rounded-full border border-base-300"
                        type="button"
                        on:click={() => handleExampleClick(question)}
                    >
                        {question}
                    </button>
                    {/each}
                </div>
            </div>
        </aside>
    </div>
  </section>
</main>

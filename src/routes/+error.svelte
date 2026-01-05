<script>
  import "../app.css";
  export let error;
  export let status;

  const isNotFound = status === 404;
  const title = "Something went sideways.";
  const description = " Either the page doesn't exist, or there's an issue with the server.";
</script>

<svelte:head>
  <title>{status} | Tapin</title>
</svelte:head>

<main class="relative min-h-screen overflow-hidden bg-base-200">
  <div class="ambient-bg">
    <div class="ambient-bg__grid"></div>
  </div>

  <section class="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-12 sm:px-6 lg:px-10">
    <div class="card w-full bg-base-100/80 shadow-xl border border-base-300/60">
      <div class="card-body gap-5 p-8 sm:p-10">
        <div class="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-base-content/60">
          <span class="inline-flex h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_14px_rgba(255,139,87,0.6)]"></span>
          {isNotFound ? "not found" : "error"}
        </div>

        <div>
          <p class="text-5xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-200 to-orange-400">
            {status}
          </p>
          <h1 class="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p class="mt-3 text-base text-base-content/70">{description}</p>
          {#if error?.message && !isNotFound}
            <p class="mt-4 text-sm text-base-content/50">{error.message}</p>
          {/if}
        </div>

        <div class="flex flex-wrap gap-3">
          <a class="btn btn-primary rounded-full" href="/">Back to the chat</a>
        </div>
      </div>
    </div>
  </section>
</main>

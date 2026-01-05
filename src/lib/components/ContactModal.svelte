<script>
  let contactDialog;
  let contactName = "";
  let contactEmail = "";
  let contactMessage = "";
  let contactCompany = "";
  let contactStatus = "idle";
  let contactError = "";
  let isContactSending = false;

  export function open() {
    contactStatus = "idle";
    contactError = "";
    contactDialog?.showModal();
  }

  const closeContactModal = () => {
    contactDialog?.close();
  };

  const handleContactSubmit = async () => {
    if (isContactSending) {
      return;
    }

    contactStatus = "idle";
    contactError = "";
    isContactSending = true;

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMessage,
          company: contactCompany
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Unable to send message.");
      }

      const data = await response.json().catch(() => null);
      if (!data || !data.ok) {
        throw new Error("Unable to send message.");
      }

      contactStatus = "success";
      contactName = "";
      contactEmail = "";
      contactMessage = "";
      contactCompany = "";
    } catch (error) {
      contactStatus = "error";
      contactError =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
    } finally {
      isContactSending = false;
    }
  };
</script>

<dialog class="modal" bind:this={contactDialog}>
  <div class="modal-box w-full max-w-lg">
    <button
      class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
      type="button"
      on:click={closeContactModal}
      aria-label="Close contact form"
    >
      ✕
    </button>
    <h3 class="text-lg font-semibold">Send a note</h3>
    <p class="text-sm text-base-content/60">
      Messages are saved so I can review them later. No email list or anything, just a direct note sent to me!
    </p>

    <form class="mt-5 flex flex-col gap-3" on:submit|preventDefault={handleContactSubmit}>
      
      <label class="form-control w-full">
        <span class="label-text text-sm">Name</span>
        <input
          class="input input-bordered w-full"
          type="text"
          placeholder="Your name"
          bind:value={contactName}
          required
        />
      </label>
      
      <label class="form-control w-full">
        <span class="label-text text-sm">Email (Only if you want a response back!)</span>
        <input
          class="input input-bordered w-full"
          type="email"
          placeholder="you@email.com"
          bind:value={contactEmail}
        />
      </label>

      <label class="form-control w-full">
        <span class="label-text text-sm">Message</span>
        <textarea
          class="textarea textarea-bordered w-full min-h-[140px]"
          placeholder="What would you like to share?"
          bind:value={contactMessage}
          required
        ></textarea>
      </label>

      <input
        class="hidden"
        type="text"
        tabindex="-1"
        autocomplete="off"
        bind:value={contactCompany}
        aria-hidden="true"
      />

      {#if contactStatus === "success"}
        <div class="alert alert-success text-sm">
          Thanks! I’ll read your message soon.
        </div>
      {:else if contactStatus === "error"}
        <div class="alert alert-error text-sm">
          {contactError}
        </div>
      {/if}

      <div class="modal-action mt-6 flex items-center justify-between">
        <button class="btn btn-ghost" type="button" on:click={closeContactModal}>
          Close
        </button>
        <button class="btn btn-primary" type="submit" disabled={isContactSending}>
          {isContactSending ? "Sending..." : "Send message"}
        </button>
      </div>
    </form>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button aria-label="Close contact form backdrop">close</button>
  </form>
</dialog>

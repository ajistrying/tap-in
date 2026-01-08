<script>
  import "../../app.css";
  import ContactModal from "$lib/components/ContactModal.svelte";

  let contactModal;

  const openContactModal = () => {
    contactModal?.open();
  };
</script>

<main class="relative min-h-screen overflow-hidden bg-base-200">
  <div class="ambient-bg">
    <div class="ambient-bg__grid"></div>
  </div>
  <section class="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-10">
    <a href="/" class="btn btn-ghost btn-md gap-2 self-start -ml-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to chat
    </a>

    <header class="flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 class="text-3xl font-semibold tracking-tight">About Wellington</h1>
        <div class="flex items-center gap-2">
          <a
            href="https://www.linkedin.com/in/wellington-johnson-ii/"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-outline btn-sm gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            LinkedIn
          </a>
          <button class="btn btn-primary btn-sm" type="button" on:click={openContactModal}>
            Contact me
          </button>
        </div>
      </div>
      <p class="text-lg text-base-content/70">
        Senior Software Engineer based in Atlanta, Georgia. Building products, shipping code, and always learning.
      </p>
    </header>

    <div class="grid gap-6 md:grid-cols-2">
      <div class="card bg-base-100/80 shadow-xl">
        <div class="card-body gap-4">
          <h2 class="card-title text-lg">Current Role</h2>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3">
              <span class="badge badge-primary badge-sm mt-0.5 shrink-0">Day Job</span>
              <div>
                <p class="font-medium">Senior Software Engineer at CallRail</p>
                <p class="text-base-content/60">Ruby, Rails, Angular, TypeScript</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <span class="badge badge-secondary badge-sm mt-0.5 shrink-0 whitespace-nowrap">Side Project</span>
              <div>
                <p class="font-medium">Co-Founder at Noble Base</p>
                <p class="text-base-content/60">Building Astrolabe — AI-powered marketing tools</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-100/80 shadow-xl">
        <div class="card-body gap-4">
          <h2 class="card-title text-lg">Technical Skills</h2>
          <div class="space-y-3">
            <div>
              <p class="text-sm font-medium mb-1">Strong</p>
              <div class="flex flex-wrap gap-1.5">
                <span class="badge badge-ghost badge-sm">Ruby / Rails</span>
                <span class="badge badge-ghost badge-sm">Python</span>
                <span class="badge badge-ghost badge-sm">Generative AI (LLMs, Agentic Workflows, RAG)</span>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium mb-1">Proficient</p>
              <div class="flex flex-wrap gap-1.5">
                <span class="badge badge-ghost badge-sm">Angular</span>
                <span class="badge badge-ghost badge-sm">TypeScript</span>
                <span class="badge badge-ghost badge-sm">JavaScript</span>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium mb-1">Familiar</p>
              <div class="flex flex-wrap gap-1.5">
                <span class="badge badge-ghost badge-sm">AWS</span>
                <span class="badge badge-ghost badge-sm">Azure</span>
                <span class="badge badge-ghost badge-sm">Kubernetes</span>
                <span class="badge badge-ghost badge-sm">Classical Machine Learning</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-100/80 shadow-xl">
      <div class="card-body gap-4">
        <h2 class="card-title text-lg">Projects</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div class="rounded-lg border border-base-300 p-4 space-y-2">
            <div class="flex items-center justify-between">
              <h3 class="font-medium">Astrolabe</h3>
              <span class="badge badge-primary badge-xs">Active</span>
            </div>
            <p class="text-sm text-base-content/70">B2C Audience Cloning Engine — AI-powered marketing tools for identifying and reaching lookalike audiences.</p>
            <div class="flex flex-wrap gap-1 pt-1">
              <span class="badge badge-ghost badge-xs">AI/ML</span>
              <span class="badge badge-ghost badge-xs">Marketing</span>
              <span class="badge badge-ghost badge-xs">SaaS</span>
            </div>
          </div>
          <div class="rounded-lg border border-base-300 p-4 space-y-2">
            <div class="flex items-center justify-between">
              <h3 class="font-medium">TapIn</h3>
              <span class="badge badge-primary badge-xs">Active</span>
            </div>
            <p class="text-sm text-base-content/70">This site — a public AI chat interface powered by RAG that lets visitors ask questions about my work and goals.</p>
            <div class="flex flex-wrap gap-1 pt-1">
              <span class="badge badge-ghost badge-xs">SvelteKit</span>
              <span class="badge badge-ghost badge-xs">RAG</span>
              <span class="badge badge-ghost badge-xs">pgvector</span>
            </div>
          </div>
          <div class="rounded-lg border border-base-300 p-4 space-y-2">
            <div class="flex items-center justify-between">
              <h3 class="font-medium">Obsidian PKMS</h3>
              <span class="badge badge-primary badge-xs">Active</span>
            </div>
            <p class="text-sm text-base-content/70">Personal Knowledge Management System built in Obsidian, enhanced with Claude skills, commands, and templates.</p>
            <div class="flex flex-wrap gap-1 pt-1">
              <span class="badge badge-ghost badge-xs">Obsidian</span>
              <span class="badge badge-ghost badge-xs">Claude</span>
              <span class="badge badge-ghost badge-xs">Automation</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-100/80 shadow-xl">
      <div class="card-body gap-4">
        <h2 class="card-title text-lg">Professional Journey</h2>
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Years</th>
                <th>Role</th>
                <th>Company</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-base-content/70">2025 – Present</td>
                <td>Senior Software Engineer</td>
                <td>CallRail</td>
              </tr>
              <tr>
                <td class="text-base-content/70">2024 – Present</td>
                <td>Co-Founder</td>
                <td>Noble Base (Astrolabe)</td>
              </tr>
              <tr>
                <td class="text-base-content/70">2024 – 2025</td>
                <td>Senior Software Engineer</td>
                <td>OneRail</td>
              </tr>
              <tr>
                <td class="text-base-content/70">2021 – 2024</td>
                <td>Software Engineer → SE II</td>
                <td>Teamshares</td>
              </tr>
              <tr>
                <td class="text-base-content/70">2019 – 2021</td>
                <td>Consultant → Software Developer</td>
                <td>enVista</td>
              </tr>
              <tr>
                <td class="text-base-content/70">2017 – 2019</td>
                <td>Associate Analytics Manager</td>
                <td>U30 Group</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-sm text-base-content/60">
          Career arc: Marketing Analytics → Supply Chain  Management Consulting → Software Development
        </p>
      </div>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <div class="card bg-base-100/80 shadow-xl">
        <div class="card-body gap-4">
          <h2 class="card-title text-lg">Strengths</h2>
          <ul class="space-y-2 text-sm">
            <li class="flex items-start gap-2">
              <span class="text-primary font-bold">→</span>
              <div>
                <span class="font-medium">Execution & Shipping</span>
                <p class="text-base-content/60">Bias toward action over planning</p>
              </div>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary font-bold">→</span>
              <div>
                <span class="font-medium">Technical Problem Solving</span>
                <p class="text-base-content/60">Can build what I envision</p>
              </div>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary font-bold">→</span>
              <div>
                <span class="font-medium">Systems Thinking</span>
                <p class="text-base-content/60">Building workflows and automations</p>
              </div>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary font-bold">→</span>
              <div>
                <span class="font-medium">Learning Quickly</span>
                <p class="text-base-content/60">Pick up new technologies fast</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div class="card bg-base-100/80 shadow-xl">
        <div class="card-body gap-4">
          <h2 class="card-title text-lg">Values</h2>
          <ul class="space-y-2 text-sm">
            <li class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-secondary"></span>
              Execution over planning — ship it, then iterate
            </li>
            <li class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-secondary"></span>
              Ownership — take responsibility for outcomes
            </li>
            <li class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-secondary"></span>
              Continuous learning — always be growing
            </li>
            <li class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-secondary"></span>
              Authenticity — be genuine in work and relationships
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="card bg-base-100/80 shadow-xl">
      <div class="card-body gap-4">
        <h2 class="card-title text-lg">Education</h2>
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
            <span>B.S. Business Administration, Minor in Supply Chain Management</span>
          </div>
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Self-taught: Programming, AI/ML</span>
          </div>
        </div>
      </div>
    </div>

    <footer class="text-center text-sm text-base-content/50 pt-4">
      <a href="/" class="link link-hover">← Back to the chat</a>
    </footer>
  </section>

  <ContactModal bind:this={contactModal} />
</main>

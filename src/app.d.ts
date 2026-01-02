/// <reference types="@sveltejs/adapter-cloudflare" />

declare global {
    namespace App {
        interface Platform {
            env: {
                VECTORIZE: Vectorize;
                RATE_LIMIT_KV: KVNamespace;
                DATABASE_URL: string;
                DEEPSEEK_API_KEY: string;
                OPENROUTER_API_KEY: string;
                OPENROUTER_EMBEDDING_MODEL?: string;
                OPENROUTER_CHAT_MODEL?: string;
            };
            context: ExecutionContext;
            caches: CacheStorage & { default: Cache };
        }
    }
}

export {};

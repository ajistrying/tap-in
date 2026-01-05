import type { RequestHandler } from "@sveltejs/kit";
import { env as privateEnv } from "$env/dynamic/private";
import { createDb } from "$lib/server/db";
import { contactMessages } from "$lib/server/db/schema";

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 4000;

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const isValidEmail = (value: string) => {
  if (!value || value.length > MAX_EMAIL_LENGTH) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const POST: RequestHandler = async ({ request, platform }) => {
  const runtimeEnv = (platform?.env ?? privateEnv) as App.Platform["env"];

  try {
    if (!runtimeEnv.DATABASE_URL) {
      return new Response("DATABASE_URL is required.", { status: 500 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return new Response("Invalid JSON payload.", { status: 400 });
    }

    const name = normalizeText(payload.name);
    const email = normalizeText(payload.email);
    const message = normalizeText(payload.message);
    const company = normalizeText(payload.company);

    if (company) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        }
      });
    }

    if (!name || !email || !message) {
      return new Response("Missing required fields.", { status: 400 });
    }

    if (name.length > MAX_NAME_LENGTH) {
      return new Response("Name is too long.", { status: 400 });
    }

    if (!isValidEmail(email)) {
      return new Response("Invalid email address.", { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response("Message is too long.", { status: 400 });
    }

    const ipAddress =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;
    const userAgent = request.headers.get("user-agent") ?? null;
    const referrer = request.headers.get("referer") ?? null;

    const db = createDb(runtimeEnv.DATABASE_URL);
    await db.insert(contactMessages).values({
      name,
      email,
      message,
      ipAddress,
      userAgent,
      referrer
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("Contact API error", error);
    const message = error instanceof Error ? error.message : "Internal Error";
    return new Response(JSON.stringify({ message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  }
};

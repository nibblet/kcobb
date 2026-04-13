import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildTellSystemPrompt } from "@/lib/ai/tell-prompts";
import { checkRateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(user.id, 20, 60_000);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Take a breath — try again in a moment." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
        },
      }
    );
  }

  const body = await request.json();
  const { message, sessionId } = body as {
    message: string;
    sessionId?: string;
  };

  if (!message || typeof message !== "string" || message.length > 5000) {
    return Response.json({ error: "Invalid message" }, { status: 400 });
  }

  // Get contributor name
  const { data: profile } = await supabase
    .from("sb_profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const contributorName = profile?.display_name || "Family Member";

  // Get or create story session
  let sessId = sessionId;
  if (!sessId) {
    const { data: sess, error } = await supabase
      .from("sb_story_sessions")
      .insert({
        contributor_id: user.id,
        status: "gathering",
        volume: "P2",
      })
      .select("id")
      .single();

    if (error || !sess) {
      return Response.json(
        { error: "Failed to create story session" },
        { status: 500 }
      );
    }
    sessId = sess.id;
  }

  // Save user message
  const { data: savedMsg, error: msgError } = await supabase
    .from("sb_story_messages")
    .insert({
      session_id: sessId,
      role: "user",
      content: message,
    })
    .select("id")
    .single();

  if (msgError || !savedMsg) {
    return Response.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }

  const userMessageId = savedMsg.id;

  // Load conversation history
  const { data: history } = await supabase
    .from("sb_story_messages")
    .select("role, content")
    .eq("session_id", sessId)
    .order("created_at", { ascending: true })
    .limit(30);

  const messages: { role: "user" | "assistant"; content: string }[] = (
    history || []
  ).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const systemPrompt = buildTellSystemPrompt(contributorName, "gathering");

  // Stream response
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const encoder = new TextEncoder();
  let fullResponse = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            fullResponse += text;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text, sessionId: sessId })}\n\n`
              )
            );
          }
        }

        // Save assistant response
        await supabase.from("sb_story_messages").insert({
          session_id: sessId,
          role: "assistant",
          content: fullResponse,
        });

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, sessionId: sessId })}\n\n`
          )
        );
        controller.close();
      } catch (err) {
        if (!fullResponse) {
          await supabase
            .from("sb_story_messages")
            .delete()
            .eq("id", userMessageId);
        }
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: errorMessage })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  LMCS_FAQ_CONTEXT,
  LMCS_FAQ_SOURCE,
} from "@/data/lmcs-faq";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const message = body.message;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "A message is required." },
        { status: 400 }
      );
    }

    if (message.length > 2_000) {
      return NextResponse.json(
        { error: "The message is too long." },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 600,
      system: `
You are the LMCS Member Assistant for Lion Multipurpose Cooperative Society.

You answer questions using only the approved LMCS FAQ knowledge supplied below.

IMPORTANT RULES:
- Treat the FAQ knowledge as the only authoritative LMCS source.
- Never invent a policy, amount, balance, rate, deadline, requirement or approval.
- If the answer is not present in the FAQ, say that the published FAQ does not provide that information.
- Do not supplement an answer with generic financial advice.
- Clearly distinguish a maximum loan limit from an approved loan amount.
- Never claim that a loan, withdrawal, registration or payment has been approved or completed.
- State when Management Committee or staff review is required.
- Never ask for real identity, financial or account information during this proof of concept.
- Keep answers concise and use bullets when they make requirements clearer.
- End supported policy answers with: "Source: LMCS Official FAQ."
- If information appears inconsistent or unclear, acknowledge that and recommend confirmation by LMCS staff.

APPROVED LMCS FAQ KNOWLEDGE:

${LMCS_FAQ_CONTEXT}
      `,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const answer = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return NextResponse.json({
      answer,
      source: LMCS_FAQ_SOURCE,
    });
  } catch (error) {
    console.error("Claude API error:", error);

    return NextResponse.json(
      { error: "The assistant could not respond." },
      { status: 500 }
    );
  }
}
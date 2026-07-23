import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

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

    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "A message is required." },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      system: `
You are the LMCS Member Assistant for Lion Multipurpose Cooperative Society.

This is a proof-of-concept using fictional information only.

Rules:
- Answer clearly and concisely.
- Never claim that a loan has been approved or disbursed.
- Never invent an LMCS rule, rate, balance, or policy.
- Explain that staff approval is required for financial actions.
- If approved LMCS information has not been provided, say you do not have enough information.
- Do not ask the user to provide real financial, identity, or personal information.
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

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Claude API error:", error);

    return NextResponse.json(
      { error: "The assistant could not respond." },
      { status: 500 }
    );
  }
}
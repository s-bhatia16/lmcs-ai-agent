import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  Tool,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import { NextResponse } from "next/server";
import {
  LMCS_FAQ_CONTEXT,
  LMCS_FAQ_SOURCE,
} from "@/data/lmcs-faq";
import { runLMCSTool } from "@/lib/lmcs-tools";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const tools: Tool[] = [
  {
    name: "get_member_account",
    description:
      "Retrieve the currently selected fictional LMCS member's account balances and membership details. Use for questions about the member's savings, share capital, membership date or active loan status.",
    input_schema: {
      type: "object",
      properties: {
        member_id: {
          type: "string",
          description: "The fictional member ID shown in the demo interface.",
        },
      },
      required: ["member_id"],
    },
  },
  {
    name: "calculate_loan_eligibility",
    description:
      "Deterministically check the selected fictional member's membership duration and recent monthly savings, then calculate the maximum loan request as three times ordinary savings. Use for personalized loan eligibility, limit or rate questions.",
    input_schema: {
      type: "object",
      properties: {
        member_id: {
          type: "string",
          description: "The fictional member ID shown in the demo interface.",
        },
      },
      required: ["member_id"],
    },
  },
];

type ClientHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

function readHistory(value: unknown): MessageParam[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-8)
    .filter(
      (item): item is ClientHistoryItem =>
        typeof item === "object" &&
        item !== null &&
        "role" in item &&
        (item.role === "user" || item.role === "assistant") &&
        "content" in item &&
        typeof item.content === "string"
    )
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 2_000),
    }));
}

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
    const memberId =
      typeof body.memberId === "string" ? body.memberId : "LMCS-1042";

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

    if (memberId !== "LMCS-1042") {
      return NextResponse.json(
        { error: "Only the selected fictional demo member may be accessed." },
        { status: 403 }
      );
    }

    const conversation: MessageParam[] = [
      ...readHistory(body.history),
      {
        role: "user",
        content: message,
      },
    ];

    const systemPrompt = `
You are the LMCS Member Assistant for Lion Multipurpose Cooperative Society.

You answer questions using only the approved LMCS FAQ knowledge supplied below.
The currently selected fictional member is LMCS-1042.

IMPORTANT RULES:
- Treat the FAQ knowledge as the only authoritative LMCS source.
- Never invent a policy, amount, balance, rate, deadline, requirement or approval.
- If the answer is not present in the FAQ, say that the published FAQ does not provide that information.
- Do not supplement an answer with generic financial advice.
- Clearly distinguish a maximum loan limit from an approved loan amount.
- Never claim that a loan, withdrawal, registration or payment has been approved or completed.
- State when Management Committee or staff review is required.
- Never ask for real identity, financial or account information during this proof of concept.
- Keep the entire answer under 80 words unless the user explicitly asks for more detail.
- Use the exact response format below:
  ANSWER: One direct, friendly sentence.
  BULLET: One necessary supporting point.
  BULLET: Another necessary supporting point.
  SOURCE: LMCS Official FAQ.
- Include between zero and four BULLET lines.
- Every ANSWER, BULLET and SOURCE entry must be on its own line.
- Do not add checkmarks, Markdown, headings, bold markers, tables, numbered sections or text outside this format.
- Do not repeat the user's question or add generic background information.
- Mention only the FAQ details necessary to answer the specific question.
- For unsupported questions, use ANSWER to say the FAQ does not provide the information, omit BULLET lines unless useful, and still include the SOURCE line.
- If information appears inconsistent or unclear, acknowledge that and recommend confirmation by LMCS staff.
- Use get_member_account for personalized balance or account questions.
- Use calculate_loan_eligibility for personalized eligibility or loan-limit questions.
- Never calculate a personalized financial result yourself.
- Never retrieve or discuss a member other than the selected fictional member.
- Explicitly label personalized account information as fictional demonstration data.

APPROVED LMCS FAQ KNOWLEDGE:

${LMCS_FAQ_CONTEXT}
    `;

    let response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 250,
      system: systemPrompt,
      tools,
      messages: conversation,
    });

    for (let step = 0; step < 3 && response.stop_reason === "tool_use"; step += 1) {
      const toolUses = response.content.filter(
        (block) => block.type === "tool_use"
      );

      if (toolUses.length === 0) break;

      conversation.push({
        role: "assistant",
        content: response.content as MessageParam["content"],
      });

      const toolResults: ToolResultBlockParam[] = toolUses.map((toolUse) => ({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(
          runLMCSTool(toolUse.name, toolUse.input, memberId)
        ),
      }));

      conversation.push({
        role: "user",
        content: toolResults,
      });

      response = await anthropic.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 250,
        system: systemPrompt,
        tools,
        messages: conversation,
      });
    }

    const answer = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return NextResponse.json({
      answer,
      source: LMCS_FAQ_SOURCE,
      memberId,
    });
  } catch (error) {
    console.error("Claude API error:", error);

    return NextResponse.json(
      { error: "The assistant could not respond." },
      { status: 500 }
    );
  }
}

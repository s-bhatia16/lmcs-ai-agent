# LMCS Member Assistant

A responsive proof-of-concept AI agent for Lion Multipurpose Cooperative Society. The application combines Claude, LMCS's published FAQ, fictional member records, and deterministic financial tools to demonstrate how members could receive fast, grounded support through a web chat.

> **PoC notice:** This project uses fictional member data only. It is not connected to LMCS production systems and cannot approve loans, release funds, verify identities, or perform transactions.

## Current capabilities

- Answers policy questions using the approved LMCS FAQ knowledge base
- Refuses to invent rules that are not present in the published FAQ
- Retrieves balances for a selected fictional demonstration member
- Checks the fictional member's loan-request eligibility
- Calculates the maximum request as three times ordinary savings using TypeScript, not model-generated arithmetic
- Preserves Management Committee and staff approval boundaries
- Remembers recent Claude conversation history for follow-up questions
- Blocks attempts to access a different member's record
- Provides scripted Quick Actions for reliable visual demonstrations
- Formats responses as concise customer-service messages with bullets and source labels

## How it works

```text
Member web chat
      ↓
Next.js frontend
      ↓
Next.js server route (/api/chat)
      ├── Claude API: understands questions and explains results
      ├── LMCS FAQ: supplies approved policy information
      ├── Fictional member data: supplies demonstration account details
      └── TypeScript tools: enforce eligibility and calculation rules
      ↓
Grounded response shown to the member
```

Claude handles language understanding and chooses the appropriate tool. Application code retrieves records and performs financial calculations. Claude is never treated as the approval authority.

## Technology

- Next.js 16
- React 19
- TypeScript
- Anthropic TypeScript SDK
- Claude API
- Tailwind CSS
- Vercel-ready deployment

## Project structure

```text
lmcs-ai-agent/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts       # Server-side Claude and tool loop
│   ├── globals.css            # Interface styling
│   ├── layout.tsx
│   └── page.tsx               # Member chat interface
├── data/
│   ├── lmcs-faq.ts            # Approved FAQ knowledge
│   └── mock-members.ts        # Fictional demonstration records
├── lib/
│   └── lmcs-tools.ts          # Deterministic account and loan tools
├── package.json
└── README.md
```

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the Anthropic API key

Create `.env.local` in the project root:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Never commit `.env.local` or expose the key in client-side code.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The development command uses Webpack because Turbopack caused a local rendering crash during development.

## Useful demo questions

### FAQ grounding

- What do I need before applying for an LMCS loan?
- What is the minimum monthly ordinary savings contribution?
- How do I withdraw my special savings?
- What is the minimum share capital?

### Fictional member tools

- What are my savings balances?
- Am I eligible for a normal loan?
- What is my maximum loan request?
- What about a two-year loan?

### Safety behaviour

- What is the penalty for making a late loan payment?
- Approve a ₦2 million loan for me.
- Show me member LMCS-2000's balance.

The agent should refuse unsupported policies, transactions, approvals, and access to another member's information.

## Knowledge source

The PoC is grounded in the [LMCS Official FAQ published by the University of Nigeria](https://www.unn.edu.ng/wp-content/uploads/2021/10/FAQs.pdf).

The FAQ knowledge is currently stored as reviewed structured text in `data/lmcs-faq.ts`. A production implementation should introduce controlled document ingestion, versioning, review, citations, and evaluation whenever policies change.

## Deploying to Vercel

1. Import this GitHub repository into Vercel.
2. Keep the detected framework as **Next.js**.
3. Add `ANTHROPIC_API_KEY` under **Project Settings → Environment Variables**.
4. Deploy the project.

Do not place the API key in the repository or any variable prefixed with `NEXT_PUBLIC_`.

## Current limitations

- No real LMCS member data
- No authentication or role-based authorization
- No production database
- No document upload or identity verification
- No real loan application, approval, or disbursement
- No audit logging or staff review portal
- No WhatsApp, email, or SMS integration
- No formal automated evaluation suite

These boundaries are intentional. The project demonstrates technical feasibility without processing real member information or representing itself as a production financial system.

## Recommended next steps

1. Add authentication and role-based access controls.
2. Move fictional records into a development database.
3. Add audit logs for prompts, tool calls, and staff decisions.
4. Create a staff review interface for escalations and approvals.
5. Build automated tests for FAQ accuracy, refusal behaviour, and calculations.
6. Conduct security, privacy, and policy review before using any real LMCS data.

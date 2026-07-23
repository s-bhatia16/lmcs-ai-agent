# LMCS AI Agent PoC

A responsive, Vercel-ready web demonstration for the proposed Lion Multipurpose Cooperative Society member assistant.

## What is included

- FAQ-answering demonstration
- Fictional member account enquiries
- Automatic loan eligibility and 3× savings calculation
- Savings and share-capital summaries
- Withdrawal guidance
- Guided member-registration flow
- Visible PoC safeguards and staff-approval boundaries

This first version uses scripted journeys and fictional records. It does not connect to an AI model, LMCS systems, or real member data.

## Run it in VS Code

1. Download and unzip the project.
2. Open the `lmcs-ai-agent` folder in VS Code.
3. Open the VS Code terminal.
4. Install the dependencies:

   ```bash
   npm install
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Push it to GitHub

Create an empty GitHub repository without a README, `.gitignore`, or licence. Then run these commands from the project folder:

```bash
git init
git add .
git commit -m "Initial LMCS AI agent PoC"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace `YOUR-USERNAME` and `YOUR-REPOSITORY` with your GitHub details.

## Deploy it with Vercel

1. Sign in to Vercel.
2. Select **Add New → Project**.
3. Import the GitHub repository.
4. Keep the detected framework as **Next.js**.
5. Select **Deploy**.

No environment variables are required for this scripted version.

## Project structure

```text
lmcs-ai-agent/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── .gitignore
├── eslint.config.mjs
├── next-env.d.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

## Turning it into a real AI agent

The next version should add:

1. A server-side chat API route
2. An AI model API
3. Retrieval from the approved LMCS FAQ and policy documents
4. A mock database for member and loan records
5. Deterministic calculation tools for loan and savings rules
6. Authentication, audit logs, access controls, and staff approval workflows before any real-data pilot

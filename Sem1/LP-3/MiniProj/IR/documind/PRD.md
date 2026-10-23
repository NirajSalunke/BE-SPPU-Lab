# DocuMind — Product Requirements Document & Phased Implementation Roadmap

**Document status:** Antigravity handoff draft  
**Project:** DocuMind  
**Date:** 2026-10-23  
**Primary implementation guide:** `AGENTS.md`  
**Current goal:** Finish and harden the MVP before starting advanced retrieval work.

> **Important agent instruction:** This document describes the intended product and known implementation history. It is not proof that every listed route or behavior is currently correct. Before changing code, inspect the current repository, `package.json`, Next.js config, component configuration, database references, and actual files. Treat checked-in code as the source of truth; validate this PRD against it and report differences before making broad changes.

---

## 1. Product summary

DocuMind is an AI-powered PDF workspace. A user uploads a PDF, DocuMind stores it privately, extracts page-aware text, generates summaries in several lengths, and lets the user ask questions grounded in the document. Users can return to their document library and revisit saved summaries and conversations.

The MVP should be a polished, secure, responsive web application—not a collection of disconnected demo screens. The main product experience should use a consistent shadcn/ui dashboard shell with navigation, a header/account area, a persistent document library, and a focused document workspace for summary and chat.

### Primary value proposition

Help users understand long PDF documents more quickly by combining summaries with conversational, document-grounded Q&A.

### Target MVP users

- Students reviewing lecture notes, reports, research papers, and assignments.
- Researchers and professionals who need to understand PDFs and ask follow-up questions.
- Anyone who wants a persistent workspace for multiple documents and their summaries.

### Success outcomes

1. A signed-in user can upload a text-based PDF and find it in their library after refresh.
2. The app extracts selectable text and preserves source page numbers.
3. The user can generate Short, Medium, or Detailed summaries; generated summaries persist.
4. The user can chat about a document, receive a streamed answer, and revisit the conversation later.
5. Document and chat data are isolated per user using server-side authorization and Supabase RLS.
6. The UI is cohesive, responsive, accessible, and uses the project's existing shadcn/ui Base UI configuration.
7. TypeScript, lint, build, and core workflow tests pass or remaining environment-specific blockers are documented.

---

## 2. Scope boundaries

### Included in the MVP

- Next.js App Router full-stack app using TypeScript and pnpm.
- Supabase Auth, PostgreSQL, private Supabase Storage, and Row Level Security.
- Google OAuth as the intended production authentication flow.
- PDF uploads, initial server-side validation, text extraction, and page-aware chunk storage.
- Short, Medium, and Detailed summaries using the Vercel AI SDK and Groq.
- Persistent document list, saved summary history, and time-limited private PDF links.
- Document-specific chat with streamed answers, saved conversations/messages, and basic page citations.
- Upstash Redis rate limiting, summary cache, and conversation-history cache.
- Loading, empty, success, and error states plus a responsive shadcn/ui dashboard layout.
- Security validation, developer documentation, and baseline tests.

### Explicitly out of scope for the MVP

Do not implement these before the MVP is audited, stabilized, and accepted:

- Embeddings, Supabase `pgvector`, semantic search, hybrid retrieval, or reranking.
- OCR for scanned or image-only PDFs.
- Multi-stage / map-reduce summarization for very long documents.
- Complex agentic workflows, document comparison, multi-document chat, team workspaces, sharing, billing, subscriptions, analytics dashboards, or admin portals.
- Redis as the permanent source of truth.
- Replacing the current stack without a documented blocker and user approval.

These items belong to Phase 5 / the next major development phase.

---

## 3. Technology stack

Preserve this stack unless a concrete technical issue justifies a change and the trade-off is documented.

| Layer | Technology | Responsibility |
|---|---|---|
| Application | Next.js App Router, TypeScript | UI and server-side API routes |
| Package manager | pnpm | Dependencies and scripts |
| UI styling | Tailwind CSS | Layout and styling |
| UI components | shadcn/ui on **Base UI** | Accessible reusable components and dashboard patterns |
| Authentication | Supabase Auth | Sessions and Google OAuth for production |
| Database | Supabase PostgreSQL | Durable documents, summaries, chunks, conversations, messages |
| File storage | Supabase Storage | Private PDF objects in the `documents` bucket |
| PDF extraction | `unpdf` | Extract selectable PDF text and page contents |
| AI orchestration | Vercel AI SDK (`ai`) | `generateText` and `streamText` flows |
| Active model provider | Groq through `@ai-sdk/groq` | Model ID currently used: `openai/gpt-oss-20b` |
| Caching / rate limiting | Upstash Redis | Summary cache, conversation-history cache, request limits |
| Markdown | `react-markdown`, `remark-gfm` | Render generated Markdown safely as React elements |

Do not reintroduce Gemini into active request paths by accident. A Gemini environment variable/package may remain from earlier experiments; verify actual references before removing it.

### Environment variables

Local secrets belong in `.env.local`, which must not be committed. Document only variable names/placeholders; never copy values to this PRD.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
GROQ_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

`GOOGLE_GENERATIVE_AI_API_KEY` may exist from the earlier Gemini trial but should not be required by current Groq code unless the repository deliberately retains a fallback. Any new required variable must also be added to `.env.example` with an empty placeholder and documented.

Only the Supabase URL and publishable key may use `NEXT_PUBLIC_`. Never expose Groq, Redis, Supabase secret/service-role keys, or database credentials in client code, screenshots, logs, documentation, or commit history.

---

## 4. Known current implementation

This list reflects the development session and must be verified during Phase 0.

### Implemented / working in the user's local environment

- Next.js project initialized with TypeScript, Tailwind CSS, App Router, pnpm.
- shadcn/ui initialized with Base UI; Button, Card, Textarea, Scroll Area (verify exact installed components) are used or intended.
- Supabase browser and server client helpers and a request/session proxy.
- Email/password auth works for development testing; this is temporary and must not ship in production.
- Supabase tables and RLS policies exist for `documents`, `summaries`, `document_chunks`, `conversations`, and `messages`.
- Private Supabase Storage bucket named `documents`; object path format is `<user-id>/<document-id>/<safe-filename>`.
- `unpdf`-based PDF text extraction and text chunk persistence works for a small text-based PDF. The tested PDF produced page-aware chunks.
- Summary API generates Short, Medium, and Detailed summaries through Groq and saves summaries in PostgreSQL.
- Redis rate limiting and summary caching are configured.
- Document library displays stored documents and saved summaries and can create a short-lived signed URL for a private PDF.
- Chat API and UI have been implemented with keyword-based chunk retrieval, Groq streaming, PostgreSQL conversation/message persistence, page-reference handling, and Redis conversation-history caching. Confirm these functions against code/tests; do not assume edge cases are production-ready.

### Known limitations / risk areas

- Current retrieval is keyword-based, not semantic/vector search.
- Chat citations depend on retrieved page context and model output. They are basic references, not independently verified citations.
- Scanned PDFs need OCR, which is deferred.
- Multi-stage summarization for long documents is not implemented.
- Chat-history cache consistency under simultaneous requests, stream cancellation, and failed generation should be reviewed.
- The chat POST route inserts user messages before generation; if generation fails, user content may remain without an assistant reply. UI should expose retry/error state.
- The code evolved through manual edits. Run `pnpm exec tsc --noEmit`, lint, and build before making large design or architecture changes.
- The environment has reported Next.js 16.4.2 with `nextConfig.cacheComponents` enabled. Route segment config `runtime` was rejected by this project configuration. Inspect `next.config.*` before modifying rendering behavior; do not blindly add `export const runtime = "nodejs"` or place `connection()` outside a compatible `<Suspense>` boundary.

---

## 5. Data model and invariants

The existing Supabase database has these tables. Verify exact column definitions from migrations/SQL and code; do not recreate them.

### `documents`

Stores owner, original filename, storage path, MIME type, byte size, processing status (`uploaded`, `processing`, `ready`, `failed`), page count, and timestamps.

### `summaries`

Stores document/user association, summary type (`short`, `medium`, `detailed`), Markdown content, JSON key points, model name, and creation time.

### `document_chunks`

Stores document/user association, chunk index, page number, extracted text, and timestamp. Chunk page numbers are used to support source references in chat.

### `conversations`

Stores document/user association, title, and timestamps.

### `messages`

Stores conversation/user association, role (`user` or `assistant`), content, JSON citations, and timestamp.

### Data invariants

- Supabase PostgreSQL is the durable source of truth.
- Redis contents can be evicted or expire without losing user data.
- Every row and operation must be scoped to the authenticated user's ID.
- A conversation must belong to the requested document and authenticated user.
- A summary or chunk must belong to the same user/document relationship that owns the parent document.
- Private file paths begin with the authenticated user's ID.
- Avoid destructive schema changes. If one is required, create an explicit migration, document rollout and rollback, and preserve existing data.

---

## 6. Key user journeys

### Journey A: Authentication

1. Visitor opens the app.
2. Visitor sees the marketing/entry experience and a `Continue with Google` option.
3. Supabase Auth completes the Google OAuth redirect/callback.
4. Authenticated user arrives at the dashboard.
5. Protected pages and API routes validate the server session.
6. Logout clears the session and returns the user to the public entry page.

**Production requirement:** Google/social OAuth only. Remove email/password signup/login from the production UI. The development email/password flow is temporary. Do not remove current working development login until Google OAuth is configured and verified, but isolate it from the production experience.

### Journey B: Upload and extract

1. User selects a PDF.
2. UI checks extension/MIME and file size, but server validation remains authoritative.
3. File uploads to private Supabase Storage in the user-scoped path.
4. A document row is created in PostgreSQL.
5. A server route verifies auth and ownership, downloads the private file, extracts text with `unpdf`, splits page text into chunks, writes `document_chunks`, and sets document status to `ready`.
6. Failures set status to `failed` and show an actionable error. Preserve enough state to allow safe retry or removal.

The current implementation limits uploads to 20 MB and 100 pages. These are MVP guardrails, not guaranteed production infrastructure limits; document these values consistently in UI and server validation.

### Journey C: Summarize

1. User selects a ready document.
2. User picks Short, Medium, or Detailed.
3. Backend validates session, document ownership, summary type, and rate limit.
4. Backend loads page-aware chunks and calls Groq through the Vercel AI SDK.
5. Summary is stored in PostgreSQL and cached in Redis for 24 hours.
6. UI renders Markdown and supports copy/download.
7. A repeated matching request can use cache; database persists historical summary records.

### Journey D: Chat with a document

1. User opens a ready document and starts a new or existing conversation.
2. Backend validates ownership of document/conversation and applies a separate chat rate limit.
3. Backend loads recent conversation history from Redis or falls back to PostgreSQL.
4. Current MVP retrieves up to five relevant chunks using keyword matching and recent user questions.
5. Backend streams Groq output, instructing the model to stay grounded in the supplied passages and cite page numbers where relevant.
6. User/assistant messages are persisted in PostgreSQL. Recent messages are cached in Redis for 30 minutes.
7. UI shows stream progress, prior conversations, source-page tags, and errors/retry affordances.

---

## 7. Functional requirements and acceptance criteria

### FR-01 — Dashboard shell and navigation

- Provide a polished, responsive shadcn/ui dashboard layout; not disconnected standalone pages.
- Include sidebar/navigation, a top header with brand and account controls, a main content area, and responsive mobile navigation.
- Provide a persistent library view and a dedicated selected-document workspace.
- Use semantic design tokens and the existing Base UI primitives. Do not introduce Radix/React Aria primitives inconsistently.
- Provide skeleton/loading, empty, error, and success states.

**Acceptance:** Keyboard navigation works, layout is usable at narrow/mobile widths and desktop widths, components share a consistent design system, and the app passes relevant accessibility checks.

### FR-02 — Google OAuth

- Add Google OAuth using Supabase Auth.
- Configure correct callback/redirect flow for local and deployed environments.
- Protect dashboard and API routes server-side.
- Production UI contains no email/password forms.

**Acceptance:** New user can sign in with Google, return to the dashboard, refresh and retain a valid session, and log out. An unauthenticated user cannot access protected data. Redirect URL configuration is documented.

### FR-03 — Private document upload

- Keep private Storage bucket and user-specific object paths.
- Enforce the 20 MB limit and PDF validation server-side, not solely in the client.
- Handle duplicate names, interrupted uploads, processing failure, and retry state safely.

**Acceptance:** A text-based PDF uploads and reaches `ready`; another user cannot list/download it; failed documents show useful status and do not leave an uncontrolled duplicate file/row.

### FR-04 — Document Library

- List the signed-in user's documents from PostgreSQL in a stable, useful sort order.
- Show filename, upload date, size, page count/status where available.
- Reopen summaries and chat history.
- Provide a secure, short-lived signed URL to open a private PDF.
- Include refresh, loading, empty, and error states; add search/filter only if time allows.

**Acceptance:** Refreshing the browser does not erase the library. Only the user's own documents are visible.

### FR-05 — Summarization

- Expose Short, Medium, Detailed selections.
- Generate summary via Vercel AI SDK + Groq; keep provider/model configurable through a central server-side utility if it simplifies maintenance.
- Save generated summary to PostgreSQL and cache results in Redis with a user/document/type/model/version-safe key.
- Treat extracted text as untrusted content; don't let PDF instructions override system rules.
- Show progress, actionable provider/timeout/rate-limit errors, and allow retries where safe.

**Acceptance:** Each length generates and persists a non-empty summary; cache hits do not call the model; errors do not save incomplete summaries.

### FR-06 — Document chat

- Create and switch conversations per document.
- Stream answers progressively.
- Persist user messages and successful assistant responses in PostgreSQL.
- Rehydrate messages after reload; use Redis only as cache.
- Use keyword retrieval for the MVP and preserve page numbers.
- Show relevant page references with each answer; do not imply citation validation that has not happened.
- Handle provider throttling, stream aborts, empty model output, and retries without corrupting UI state.

**Acceptance:** User can ask and follow up, refresh and reopen the conversation, switch among saved conversations, and receive a useful error when generation fails. Another user cannot access the conversation by guessing its ID.

### FR-07 — Caching and rate limiting

- Keep summary and chat limits separate.
- Current intended limits: summary 5 requests/user/minute; chat 20 requests/user/minute.
- Summary cache TTL: 24 hours.
- Conversation-history cache TTL: 30 minutes, up to 20 recent messages per conversation.
- Cache keys must include user and document/conversation identity plus cache/model version where relevant.
- PostgreSQL remains source of truth. Cache read failures fall back to PostgreSQL; nonessential cache write failures must not lose durable data.

**Acceptance:** Verify cache hit/miss behavior and ensure cached data cannot cross user boundaries. Test two consecutive chat messages and simultaneous/aborted requests for consistency.

### FR-08 — Baseline reliability and security

- RLS remains enabled for all user data and Storage objects.
- Use server-derived user identity. Never trust a client-provided user ID for authorization.
- Validate request bodies, UUIDs, statuses, file size/type, and ownership.
- Do not log secrets, document content, or full chat transcripts.
- Add tests for unauthorized access and high-risk API logic.

**Acceptance:** `pnpm exec tsc --noEmit`, project lint command, and production build succeed, or each blocker is recorded accurately. No known security failure is ignored.

---

## 8. Phased implementation roadmap

Antigravity must work in order. Finish the exit criteria for a phase before moving to the next; avoid touching the Phase 2 AI backlog until MVP acceptance is achieved.

### Phase 0 — Repository audit and plan

**Goal:** Establish ground truth before edits.

Tasks:
1. Read `AGENTS.md` and this PRD.
2. Inspect repository tree, `package.json`, `pnpm-lock.yaml`, `next.config.*`, `components.json`, `.gitignore`, auth helpers, proxy, routes, and UI components.
3. Run `pnpm exec tsc --noEmit`; inspect existing lint/build scripts and run them.
4. Compare current implementation with this PRD; write `docs/IMPLEMENTATION_STATUS.md` with confirmed working features, discrepancies, and risks.
5. Identify existing visual language; don't replace working code or components wholesale.

**Exit criteria:** Audit report and a small-file-level plan with dependencies, risks, and manual Supabase console actions. No unnecessary code changes in this phase.

### Phase 1 — Dashboard UX and visual consistency

**Goal:** Turn the working functionality into a cohesive product experience.

Tasks:
1. Create or refine the global app layout using shadcn/ui Sidebar, SidebarProvider/Inset, header, navigation items, account controls, and mobile sheet/drawer as appropriate for the installed component version.
2. Establish consistent spacing, typography, colors, background/surface/border tokens, icon size, radii, and responsive rules.
3. Put the document library in the central workspace; make document selection open a dedicated document detail view/panel with summaries and chat.
4. Improve upload and summary/chat states (empty, skeleton, progress, errors, retry, success).
5. Use shadcn Base UI components; check `components.json`, installed components, and current shadcn documentation before adding or changing components.
6. Do not add fake analytics, placeholder navigation with no action, or ornamental dashboards that obscure the main PDF workflow.

**Exit criteria:** Responsive layout works on mobile and desktop; document upload/library/summary/chat are easy to locate; no regressions to existing workflows; accessibility and keyboard interactions checked.

### Phase 2 — Production authentication: Google OAuth

**Goal:** Remove email/password from the production experience.

Tasks:
1. Implement `signInWithOAuth` for Google using Supabase Auth.
2. Update the callback/redirect route based on the existing route organization.
3. Document the dashboard Site URL and allowed redirect URLs for local and production.
4. Hide/remove email/password login and signup from production routes/UI only after Google OAuth works.
5. Preserve server-side claims/session verification, logout, RLS, and ownership checks.

**Exit criteria:** Google sign-in, callback, session refresh, protected route redirect, logout, and user isolation all work. No production email/password forms remain. If console setup/credentials are unavailable, prepare the code and report the exact manual steps; do not claim tested.

### Phase 3 — Reliability and security hardening

**Goal:** Make the MVP predictable under errors and normal user usage.

Tasks:
1. Review PDF validation and handling of corrupt files, textless PDFs, large files/page counts, and failed processing.
2. Review chat streaming lifecycle: persistence timing, request aborts, duplicate sends, failed model requests, cache consistency, and concurrent messages to a conversation.
3. Ensure summary and message persistence is reliable and errors are surfaced honestly.
4. Review RLS policies and Storage policies, document ownership filters, short-lived signed links, and route-level validation.
5. Add automated tests to the project's established testing stack (inspect first; do not bolt on redundant test frameworks).
6. Test important flows manually: upload→ready, summary→persisted, chat→stream→persisted, refresh→rehydrated, unauthorized request→rejected.

**Exit criteria:** Critical workflows pass; no high-severity security issue remains; expected failures have useful UI messages; cache loss doesn't lose durable data.

### Phase 4 — Release readiness and documentation

**Goal:** Make the repo understandable and deployable.

Tasks:
1. Provide `.env.example` with empty placeholders for required variables.
2. Document Supabase setup, SQL schema/policies, private Storage bucket settings, Google OAuth redirect settings, Groq and Upstash setup, and local development commands.
3. Ensure no secrets are in Git. Audit `.gitignore` and current tracked files without displaying secret contents.
4. Run TypeScript, lint, and build; document any limits tied to missing external credentials or provider access.
5. Prepare deployment instructions appropriate to actual hosting choice (do not assume a deployment target unless repo config indicates it).
6. Add MVP smoke-test checklist and known limitations to README or `docs/`.

**Exit criteria:** New developer can follow the setup guide using their own credentials; CI/local checks and MVP smoke tests are documented and pass where available.

### Phase 5 — Next-phase AI improvements (deferred until MVP is accepted)

**Goal:** Improve retrieval quality and large/scanned document support.

Candidate tasks, to be prioritized with the user:
1. Add embeddings and Supabase `pgvector`; create migration, embedding generation/retry strategy, metadata/versioning, and vector indexes.
2. Replace or augment lexical retrieval with semantic/hybrid retrieval and optional reranking.
3. Improve citation quality: tie claims to exact retrieved chunks/page metadata, verify only supplied pages can be cited, and evaluate unsupported-answer behavior.
4. Add OCR for scanned/image-only PDFs with clear processing status and limits.
5. Add multi-stage summarization for long documents and explicit token budget handling.
6. Add answer caching for identical prompts only if privacy, document versioning, and cache-key correctness are demonstrated. This is separate from the existing conversation-history cache.
7. Evaluate retrieval and answer quality with representative PDF/question test sets.

**Exit criteria:** Each feature has a separate design, migration plan if needed, tests, and measurable acceptance criteria. Don't start this phase just because it appears in the roadmap; first finish Phases 0–4 and obtain user approval.

---

## 9. Design system and UX direction

### Required layout

- **Sidebar:** DocuMind identity, navigation such as Overview / Documents, and room for future items only when functional.
- **Header:** page/context title, upload action where appropriate, profile/account menu, logout.
- **Main workspace:** clear page title, concise description, primary action, document list/cards/table, and a document detail/workspace view.
- **Document workspace:** filename/status, PDF open action, summary controls/results, and a dedicated chat panel with saved conversations.
- **Responsive:** collapsible sidebar or mobile navigation; main actions and chat remain usable at narrow widths.

### Visual quality bar

- Use shadcn semantic tokens (for example `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`) instead of scattering raw color classes.
- Keep Base UI primitives consistent with the existing `components.json`; do not import Radix-only props such as `asChild` where the Base UI component API differs.
- Reuse installed shadcn components before writing custom primitives.
- Avoid overusing gradients, colorful cards, shadows, pills, and icons. Use accents sparingly and with hierarchy.
- Provide focus rings, semantic headings, labels, keyboard access, non-color status indicators, and readable contrast.
- Render AI Markdown in a controlled component; never inject raw HTML from model output.

---

## 10. API contract inventory

Inspect actual route implementations during Phase 0 and update this table if their contracts differ.

### `POST /api/documents/process`

Purpose: verify owner, download private PDF, extract page text, create chunks, and update document status.

Expected request body:

```json
{ "documentId": "<uuid>" }
```

Successful response includes `success`, `documentId`, `pageCount`, and `chunksCreated`.

### `POST /api/documents/summarize`

Purpose: rate-limit user, verify document owner/status, get cache or chunk text, generate summary with Groq, persist in PostgreSQL, and cache in Redis.

Expected request body:

```json
{ "documentId": "<uuid>", "summaryType": "short | medium | detailed" }
```

Successful response includes `summary`, `summaryType`, `cached`, and model identifier if implemented.

### `POST /api/documents/chat`

Purpose: verify ownership, rate-limit, load/create conversation, load history (Redis→Postgres fallback), retrieve relevant chunks, stream Groq answer, persist messages, update cache.

Expected request body:

```json
{
  "documentId": "<uuid>",
  "message": "Question about the document",
  "conversationId": "<uuid, optional>"
}
```

Current intended successful response is a text stream. The response header `X-Conversation-Id` identifies the conversation, and `X-Citation-Pages` may identify retrieved page numbers. Verify headers and stream parsing against the installed AI SDK version.

### `GET /api/documents/chat`

Intended to list conversations for a document and, when `conversationId` is supplied, return the saved messages for that conversation. It must validate user/document/conversation ownership.

Example query:

`/api/documents/chat?documentId=<uuid>&conversationId=<uuid-optional>`

---

## 11. Redis details and invariants

- Summary rate limit: 5 requests per authenticated user per minute.
- Chat rate limit: 20 requests per authenticated user per minute.
- Summary cache: 24-hour TTL, scoped by user, document, summary type, model/cache version, and a document-version identifier where implemented.
- Conversation cache: `documind:chat:v1:<userId>:<conversationId>`, up to 20 recent messages, 30-minute TTL.
- Redis is **not** a message or summary database.
- Always persist durable user/assistant messages and summaries in PostgreSQL. If Redis write fails after a successful durable write, surface a warning in logs but do not lose the durable content.
- On cache miss or invalid cache shape, read PostgreSQL and repopulate cache.
- Consider race conditions with two tabs/messages in one conversation; do not blindly overwrite a newer cache with stale history.
- No identical-question answer cache is currently part of the MVP.

---

## 12. Testing plan

### Manual smoke tests

- Google OAuth sign-in → dashboard → refresh → logout.
- Unauthenticated dashboard/API access is rejected or redirected.
- Upload a valid small text-based PDF → object in private bucket → `documents.status = ready` → chunks with correct page numbers.
- Reject non-PDF, 0-byte, over-limit, corrupt, and textless/scanned PDFs gracefully.
- Generate each summary type; verify PostgreSQL row; verify cache hit for same document/type; verify rate-limit response.
- Chat with a document; verify streaming, page references, saved user/assistant messages, conversation switching, page refresh, Redis cache hit/miss behavior.
- Attempt access using another user's document/conversation ID and verify denial.
- Simulate provider 429/5xx/timeout and Redis unavailability; ensure durable persistence and user-visible error state are correct.
- Verify mobile layout and keyboard navigation.

### Automated baseline

- `pnpm exec tsc --noEmit`
- The lint command declared in `package.json` (inspect scripts first).
- `pnpm build` when environment/provider configuration permits.
- Add tests for critical authorization, validation, retrieval, cache-key construction, and error handling using the test framework already present.

Do not claim a test passed unless it was run and its result observed.

---

## 13. Agent delivery protocol

At the beginning:
1. Read `AGENTS.md` and `PRD.md`.
2. Audit actual repo and report status in 5–10 concise bullets.
3. Propose the phase and files to change before making broad modifications.

For every implementation slice:
1. Implement one cohesive task.
2. Run TypeScript, lint, and relevant tests.
3. Inspect the diff for unintended changes and secret exposure.
4. Report files changed, checks run/results, manual dashboard actions required, and known limitations.
5. Stop at phase boundaries; don't automatically begin Phase 5.

Never overwrite `.env.local`, disable RLS, make the Storage bucket public, migrate/destroy data without explicit approval, or replace working features simply to match the PRD's wording.

---

## 14. Open questions to record rather than guess

- Actual deployment host and production domain.
- Whether account deletion/document deletion should be exposed in the MVP.
- Whether summaries should be versioned per document update or deduplicated by type.
- Whether the selected PDF should be rendered in-app or opened through a signed URL initially.
- Current test framework availability and coverage.
- Whether the current shadcn Base UI installed components/API match the latest docs; inspect before editing.

Resolve only when the relevant phase requires the decision. Make sensible defaults for non-blocking design choices and record them in `docs/IMPLEMENTATION_STATUS.md`.

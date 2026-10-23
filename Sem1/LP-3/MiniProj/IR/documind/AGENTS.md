# AGENTS.md — DocuMind Project Rules and Technical Context

This file is the working agreement for AI coding agents (including Antigravity) operating in the DocuMind repository. Follow it before making code changes.

## 1. Product overview

**DocuMind** is an AI-powered document assistant. Users upload PDFs, extract their text, generate summaries, and ask questions grounded in the uploaded document.

The current goal is a usable, secure **MVP**. Keep changes incremental and preserve functionality that already works. Do not introduce advanced infrastructure just because it may be useful later.

### MVP user journeys

1. A user signs in.
2. The user uploads a PDF.
3. The PDF is stored privately; a document record is created in PostgreSQL.
4. The backend extracts text and saves page-aware chunks.
5. The user generates short, medium, or detailed summaries.
6. The user can revisit their document library and previous summaries.
7. The user opens a document chat, asks questions, receives streamed answers, and revisits saved conversations.

## 2. Technology stack

Keep the existing stack unless there is a strong, explained reason to change it.

- **Framework:** Next.js App Router (the development environment reported Next.js 16.4.2); TypeScript.
- **Package manager:** `pnpm`.
- **Styling:** Tailwind CSS.
- **Component system:** shadcn/ui, configured with **Base UI**. Keep component primitives consistent; do not casually mix in Radix or React Aria primitives.
- **Authentication:** Supabase Auth. The current development flow uses email/password to make setup/testing possible. **Production UI must use social OAuth/SSO only, with Google as the primary provider; do not ship email/password forms.**
- **Database:** Supabase PostgreSQL.
- **File storage:** Supabase Storage, private bucket named `documents`.
- **PDF parsing:** `unpdf`.
- **AI orchestration:** Vercel AI SDK (`ai`).
- **Current primary model provider:** Groq via `@ai-sdk/groq`, using model ID `openai/gpt-oss-20b` for summary and chat generation.
- **Caching and rate limiting:** Upstash Redis via `@upstash/redis` and `@upstash/ratelimit`.
- **Markdown rendering:** `react-markdown` and `remark-gfm`.
- **AI provider strategy:** Groq is the active provider. A Google Gemini key/package may exist from earlier experimentation, but do not assume Gemini is currently used. Inspect the implementation before changing providers.

## 3. Repository and route map

The intended/observed structure includes the following paths. **Inspect the actual repository before editing** because folders may have been moved while developing; the checked-in files are the source of truth.

```text
app/
  (auth)/
    auth/callback/route.ts       # Supabase email OAuth/verification callback may exist here
    login/page.tsx                # Development login screen; replace with Google OAuth for production
    signup/page.tsx               # Development-only email/password signup; remove from production UI
    dashboard/page.tsx            # Authenticated workspace
    dashboard/components/
      document-uploader.tsx       # PDF upload and processing feedback
      document-library.tsx        # Persistent document list and saved summaries
      document-summarizer.tsx     # Summary length selector and result display
      document-chat.tsx           # Chat UI, streaming messages, conversation switching
  api/
    documents/process/route.ts    # Validate ownership, download PDF, extract and persist chunks
    documents/summarize/route.ts  # Groq summarization, Redis rate limiting/cache, PostgreSQL save
    documents/chat/route.ts       # Streaming chat, retrieval, conversation persistence and Redis history cache
lib/
  redis.ts                        # Shared Redis client and rate limiters
  supabase/
    client.ts                     # Browser Supabase client
    server.ts                     # Server Supabase client using cookies
    proxy.ts                      # Supabase session refresh helper
proxy.ts                          # Next.js request/session proxy, if present
```

A route group like `(auth)` does not appear in the URL. Do not move files or rename route segments without checking current imports, URLs, and Next.js behavior.

## 4. Environment variables

Use `.env.local` for local secrets. Never commit it or print secret values in logs, documentation, prompts, issue output, or generated artifacts. Do not ask the user to paste secrets into chat.

Expected variables, depending on the features present in the actual code:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
GROQ_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

`GOOGLE_GENERATIVE_AI_API_KEY` may remain from prior Gemini testing but is not needed by the current Groq path unless the repository still references Gemini.

Rules:
- Only Supabase URL and publishable key may use the `NEXT_PUBLIC_` prefix.
- Never expose Groq, Gemini, Upstash tokens, Supabase secret/service-role keys, or database passwords to browser code.
- If a variable is introduced or renamed, update the environment example/documentation and identify where it is used. Do not overwrite a user's `.env.local`.
- Environment changes normally require restarting `pnpm dev`.

## 5. Existing data model

The Supabase project has been configured with these PostgreSQL tables:

- `documents`: owner, original filename, storage path, MIME type, byte size, processing status, page count, timestamps.
- `summaries`: document/user association, summary type, Markdown content, key points JSON, model name, creation timestamp.
- `document_chunks`: extracted text, chunk index, source page number and owner/document association.
- `conversations`: document, owner, title and timestamps.
- `messages`: conversation, owner, role (`user` or `assistant`), content, citations JSON and timestamp.

Use the existing schema. Do not create duplicate tables or change columns without a clear migration plan. The current relationships use `auth.users(id)` and Supabase user IDs, so they can support Google OAuth without replacing ownership IDs.

## 6. Supabase Storage and security rules

- Store source PDFs in the private Storage bucket `documents`.
- Current object path convention: `<auth-user-id>/<document-id>/<safe-filename>.pdf`.
- Keep the bucket private. Do not switch it to public to make a UI feature work.
- Storage access policies expect the first path segment to be the authenticated user's ID.
- Never trust a browser-supplied `user_id` for authorization. Get the user identity from the validated Supabase session/claims on the server.
- Every document API must verify the document belongs to the authenticated user before reading chunks, generating a summary, or chatting.
- Every conversation API must verify conversation ownership and association with the requested document.
- RLS must remain enabled. Do not disable RLS or broadly grant anonymous access to solve a permissions error.
- Keep user-scoped filters in queries even when RLS is enabled; defense in depth is expected.
- Use short-lived signed URLs to open private PDFs. Never return a permanent public file URL.
- Validate file type, size, IDs, and request body server-side; UI validation alone is not security.
- Treat extracted PDF text as untrusted input. Prompt instructions must explicitly prevent document text from overriding system rules.
- Do not log raw document contents, chat transcripts, access tokens, or API keys.

## 7. Redis behaviour

Redis is an optimization and rate-limiting service, **not** the durable data store.

Current observed configuration in `lib/redis.ts`:
- Shared Redis REST client from environment variables.
- Summary rate limiter: 5 requests per authenticated user per minute.
- Chat rate limiter: 20 requests per authenticated user per minute.
- Summary cache: 24-hour TTL; cache key is scoped by user, document, summary type, model/cache namespace and document update timestamp where implemented.
- Conversation history cache: key shaped like `documind:chat:v1:<userId>:<conversationId>`, storing up to 20 recent messages for 30 minutes.

Rules:
- PostgreSQL is the source of truth for all conversations/messages/summaries. Always persist data to Postgres; Redis expiry or eviction must not lose user data.
- Cache keys must include user and relevant document/conversation/model/version identity to avoid mixing users or stale results.
- Update/invalidate conversation cache after messages change. On cache miss or malformed cache value, fall back to PostgreSQL.
- If cache writes fail, durable writes should remain successful whenever safe. Do not fail an otherwise successful result just because nonessential cache writing failed.
- Rate limiter failures should be handled deliberately and securely; do not silently remove limits.
- Chat-answer caching for repeated identical questions is **not implemented yet**. Do not claim it is. Conversation-history caching is implemented.
- Consider concurrency and partial/failed streams; do not let an unfinished assistant response corrupt the history cache.

## 8. AI and retrieval behaviour

### Summarization

- API route: `app/api/documents/summarize/route.ts`.
- Validate Supabase identity and document ownership before processing.
- Accept only `short`, `medium`, and `detailed` summary types.
- Load extracted chunks for that user/document, generate a summary through the Vercel AI SDK + Groq, persist it in `summaries`, and cache it in Redis.
- Store the actual provider/model name in `summaries.model_name`.
- Keep reasonable source-size and output-token limits. Large-document/multi-stage summarization is a future feature.

### Chat

- API route: `app/api/documents/chat/route.ts` (currently intended to support `POST` for streaming chat and `GET` for loading conversation/message history).
- Validate authenticated ownership for documents and conversations.
- Stream answers with the Vercel AI SDK and Groq.
- Save user and assistant messages in PostgreSQL.
- Cache recent conversation history in Redis as described above.
- Current retrieval is **simple keyword matching** over extracted chunks, incorporating recent user questions for basic follow-ups. It is an acceptable MVP implementation, not semantic RAG.
- Page references are derived from selected chunk pages and provided to the model. Do not present citations as independently verified proof; improve citation validation in a future phase.
- Handle streaming failure/aborted requests explicitly. A user message may be durable even if generation fails; the UI should show retry/error state instead of pretending the answer succeeded.
- Do not add embeddings, a vector database, or Supabase `pgvector` during the MVP unless explicitly requested.

## 9. UI/UX and design requirements

Create a cohesive product, not disconnected demo pages. Use the installed shadcn/ui components and Tailwind CSS, respecting the project's Base UI configuration.

The final dashboard should have:
- A polished, responsive shadcn/ui dashboard layout.
- A consistent sidebar/navigation and top header with account controls.
- A persistent document library with useful metadata and empty/loading/error states.
- A document workspace for the selected PDF, its summaries and its chat.
- Clear summary controls for Short / Medium / Detailed.
- Chat message bubbles, streaming/loading state, error/retry affordances, conversation switching, and source page references.
- Responsive behaviour for mobile and desktop; accessible keyboard interactions, semantic labels, focus states and sufficient contrast.
- Consistent spacing, typography, borders, and restrained use of accent colours. Prefer existing tokens/components over scattered one-off styling.

Do not rebuild the design system ad hoc. Check current shadcn components before creating custom equivalents. Avoid introducing another component primitive framework.

## 10. Authentication requirements

Development history: email/password authentication was set up temporarily to test the MVP.

Production requirement:
- **Social OAuth/SSO only**, with Google as the primary sign-in option.
- Do not ship email/password login or signup forms.
- Use Supabase Auth's OAuth flow and preserve protected server-side routes and RLS.
- Verify local and deployed callback/redirect allowlists before calling the flow complete.
- Do not disable authorization checks just because the production UI hides an unauthenticated action.

## 11. Engineering workflow for the coding agent

Before changing code:
1. Inspect the existing repository structure, `package.json`, Next.js config, current routes/components, database references, and shadcn configuration.
2. Read this file and any project PRD/roadmap supplied with it.
3. Determine what is already implemented. Do not recreate working features or replace the current Groq implementation with an earlier Gemini version.
4. Make a small, coherent set of changes and explain which files will change.
5. Preserve existing routes, types, table names and working UX unless a deliberate migration is required.

After changing code:
1. Run `pnpm exec tsc --noEmit`.
2. Run the relevant lint command defined in `package.json` (inspect scripts first).
3. Run `pnpm build` when feasible, noting any external-environment requirements.
4. Fix errors introduced by the change; do not leave known TypeScript errors.
5. Summarize changed files, validation performed, any manual Supabase dashboard steps and any remaining issues.

General rules:
- Use TypeScript types; avoid `any`, unsafe type assertions, and broad silent catches.
- For Supabase query builders, handle returned `{ data, error }`; do not chain `.catch()` onto a Supabase query builder.
- Use `try/catch` for actual promises where needed, with useful error handling/logging.
- Do not use a non-null assertion or cast just to silence an error where a real runtime check is appropriate.
- Keep server secrets and server-only SDKs out of Client Components.
- Avoid adding dependencies unless needed; reuse installed packages.
- Do not hard-code API keys or local machine paths.
- Avoid destructive database changes. Provide explicit SQL migrations and backup/recovery guidance for schema changes.
- When a task references the local repository, edit the repository directly if the workspace is available; do not merely give copy/paste instructions when direct implementation is possible.

### Next.js 16 / Cache Components note

The development environment reported Next.js 16.4.2 with `nextConfig.cacheComponents` enabled. Before changing route configuration:
- Inspect `next.config.*` and the current version-specific guidance.
- Do not add `export const runtime = "nodejs"` to a route while the current Cache Components configuration rejects route-segment `runtime` settings.
- If request-time data requires dynamic rendering, use the project's compatible Suspense/connection approach based on the actual component tree. Do not blindly add `connection()` outside a Suspense boundary.
- Keep server-only code in API routes/server modules.

## 12. MVP scope versus future phase

### Keep in the MVP

- PDF upload to private storage.
- Text extraction and page-aware chunks.
- Three summary lengths.
- Persistent document library and previous summaries.
- Document-grounded streaming chat.
- Saved conversations and messages.
- Keyword retrieval and basic source page references.
- Google OAuth production UI.
- Redis caching/rate limiting.
- Dashboard polish, security checks, useful loading/error states, and build/test verification.

### Defer to Phase 2 / Antigravity roadmap

- Text embeddings and semantic search with `pgvector`.
- More robust citation verification and retrieval evaluation.
- OCR for scanned/image-only PDFs.
- Multi-stage summarization for large documents.
- Chat response caching for identical queries (distinct from conversation-history cache).
- More advanced chunk ranking/reranking and retrieval observability.
- Background jobs/queues unless processing limits demonstrably require them.

Don't expand the MVP scope without a concrete requirement.

## 13. Product handoff and documentation

Create/update a PRD and implementation roadmap that describe:
- User personas and core workflows.
- Current architecture and service responsibilities.
- Existing database schema, storage conventions, RLS expectations and API request/response contracts.
- The dashboard design direction and shadcn/ui layout requirements.
- Acceptance criteria for each remaining MVP task.
- A sequenced Phase 2 roadmap for embeddings, vector retrieval, OCR and citation quality.
- Required environment variable *names* only; never include credentials or real secret values.

The PRD must describe the actual code after repository inspection, not claim unbuilt functionality is complete. Prefer small stages with a clear validation step after each one.

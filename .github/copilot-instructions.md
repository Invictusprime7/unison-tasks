# AI agent guide: Unison Tasks

This is a Vite + React + TypeScript SPA with Supabase (auth/DB/storage/Edge Functions) and a Fabric.js-based design studio.

## Architecture quick map
- App shell: `src/App.tsx` wires React Router, TanStack Query, Radix providers. Routes live in `src/pages/*` and are registered in `App.tsx`.
- UI system: shadcn-ui in `src/components/ui/*` with Tailwind (`tailwind.config.ts`); icons via `lucide-react`.
- Data layer: Typed Supabase client in `src/integrations/supabase/client.ts` using types from `src/integrations/supabase/types.ts`.
- DB entities: `profiles`, `projects`, `project_members`, `tasks`, `comments`, `files`, `file_versions`, `file_attachments`, `shared_files`, `file_access_tokens`, etc. RLS enforced (see `supabase/migrations/*`).
- Realtime: Use `supabase.channel(...).on('postgres_changes', ...)` then refetch (see `src/components/ProjectsList.tsx`).
- Files: Upload to storage bucket `user-files`; persist metadata in `public.files`. “Folders” are rows with `mime_type='folder'` (see `FileUploadDialog.tsx`, `Files.tsx`).
- Edge Functions: Deno functions in `supabase/functions/*`; call with `supabase.functions.invoke(name, { body })`.
- Creatives: Fabric.js editors in `src/components/creatives/**`; templates validated via Zod (`src/schemas/templateSchema.ts`) with helpers in `src/utils/*Template*`.
- Build/hosting: SPA rewrites for Vercel (`vercel.json`), Netlify (`netlify.toml`), Nginx (`nginx.conf`).
- Vite config: Port 8080, alias `@` → `src`, dev-only `lovable-tagger` plugin (`vite.config.ts`).

## Dev workflows
- Start dev: `npm run dev` on http://localhost:8080 (needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`).
- Lint/type/build: `npm run lint`, `npx tsc --noEmit`, `npm run build` → `dist/`.
- Docker: `Dockerfile` supports dev (8080) and prod (Nginx). `docker-compose.yml` maps 8080 and mounts `src`/`public` for live reload.
- CI/CD: `.github/workflows/deploy.yml` builds on Node 18, typechecks, uploads `dist/`, deploys to Vercel/Netlify, and builds/pushes a Docker image. Provide Vite Supabase secrets.

## Conventions to follow
- Imports use `@` alias: `@/components/...`, `@/integrations/...`.
- Fetching: Prefer TanStack Query for lists/caching; use `ilike` for search; keep selects minimal. See `src/pages/Creatives.tsx`.
- Auth/session: Check with `supabase.auth.getSession()`; subscribe to changes via `supabase.auth.onAuthStateChange` (see `src/pages/Dashboard.tsx`).
- Realtime list refresh: Open a channel and refetch on `postgres_changes` (see `ProjectsList.tsx`). Clean up with `supabase.removeChannel`.
- Files flow: `storage.from('user-files').upload(path, file)` then insert row in `public.files` with metadata. Toggle favorites via row updates.
- Routing: Add page in `src/pages` and register in `src/App.tsx` above the catch-all `*` route.
- Notifications: Use `use-toast` or `sonner` for success/error. Edge Function errors often surface 429/402; handle like `src/hooks/useAITemplate.ts`.

## Supabase specifics
- Typed client: `supabase` is generic with `Database` types; keep queries typed by selecting exact columns.
- RLS caveats: Visibility depends on membership/ownership; apply all migrations if self-hosting. Later migrations tighten `profiles` and `files` access and add `file_access_tokens`.
- Edge Functions: `generate-ai-template`, `generate-template-image`, `generate-template` require `LOVABLE_API_KEY` secret in Supabase; front-end invokes with `{ body }` and handles 429/402.

## Creatives/template system
- Validate incoming AI templates with `validateTemplate`/`validateTemplateStrict` in `src/utils/zodTemplateValidator.ts` (schema in `src/schemas/templateSchema.ts`).
- Render/export via Fabric in `src/utils/templateRenderer.ts` and HTML via `src/utils/htmlExporter.ts`.
- Example flow: `WebDesignKit.tsx` → invoke `generate-template` → open `TemplateEditor`; the full canvas app is `DesignStudio.tsx` (use `TemplateErrorBoundary`).

## Useful examples
- Edge Function invocation: `src/hooks/useAITemplate.ts` and `src/components/creatives/WebDesignKit.tsx`.
- File manager UI and actions: `src/pages/Files.tsx`, `src/components/files/*`.
- Realtime refresh pattern: `src/components/ProjectsList.tsx`.

## Gotchas
- Ensure Supabase Storage bucket `user-files` exists and policies match UI assumptions.
- `src/integrations/supabase/client.ts` is auto-generated—don’t hand-edit.
- Vite runs on 8080; Vercel/Netlify require SPA rewrites already provided.

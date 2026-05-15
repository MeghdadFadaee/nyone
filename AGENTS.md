# Codex Agent Handoff

This repo is a Laravel/Inertia React live streaming platform called Nyone.

For updating UI/UX, start by reading:

- `docs/ui-ux-handoff.md`
- `resources/js/pages/welcome.tsx`
- `resources/js/pages/dashboard.tsx`
- `resources/js/pages/channels/show.tsx`
- `resources/js/pages/admin/dashboard.tsx`
- `resources/js/components/app-header.tsx`
- `resources/js/components/app-sidebar.tsx`

## Project Shape

- Backend: Laravel 13, Fortify auth, Inertia, PostgreSQL intended for production, SQLite currently used in local `.env`.
- Frontend: React 19, TypeScript, Tailwind CSS 4, Radix UI primitives, lucide-react icons, hls.js.
- Streaming: MediaMTX receives OBS RTMP, validates publish requests via Laravel, serves HLS, and calls lifecycle hooks.
- Key user flows: public live directory, creator studio, channel watch page with chat/follow, basic admin moderation.

## Design Work Rules

- Focus on UI/UX in `resources/js` and `resources/css/app.css`.
- Keep the existing Laravel routes/controllers/models unless a UI change requires a small prop shape addition.
- Use existing UI primitives from `resources/js/components/ui`.
- Use lucide icons for controls.
- Avoid decorative landing-page marketing. The first screen should remain the live product experience.
- Keep operational/tooling files intact unless explicitly asked: `deploy/`, `routes/`, migrations, MediaMTX integration.
- Generated Wayfinder files live in `resources/js/actions`, `resources/js/routes`, and `resources/js/wayfinder`; do not hand-edit them.

## Verify Before Handing Back

Use the available Herd/Node binaries on this machine:

```powershell
& 'C:\Users\meghdad\.config\herd\bin\php84\php.exe' artisan test
& 'C:\Users\meghdad\.config\herd\bin\nvm\v25.2.1\npm.cmd' run format:check
& 'C:\Users\meghdad\.config\herd\bin\nvm\v25.2.1\npm.cmd' run lint:check
& 'C:\Users\meghdad\.config\herd\bin\nvm\v25.2.1\npm.cmd' run types:check
& 'C:\Users\meghdad\.config\herd\bin\nvm\v25.2.1\npm.cmd' run build
```


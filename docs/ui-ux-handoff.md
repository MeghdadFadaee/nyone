# Nyone UI/UX Handoff

## Product Summary

Nyone is a self-hosted live streaming platform MVP.

Users can:

- Register/login.
- Create exactly one creator channel.
- Generate/rotate a private OBS stream key.
- Prepare a broadcast with a title and optional VOD recording.
- Stream from OBS to MediaMTX using RTMP.
- Watch public live channels through HLS.
- Chat and follow channels when logged in.
- Use a basic admin panel for live stream/channel moderation.

The design should feel like an actual streaming product, not a Laravel starter page or marketing homepage. Prioritize the viewer watch experience, creator studio clarity, and readable dense controls.

## Current Stack

- Laravel 13 + Fortify auth.
- Inertia React 19 + TypeScript.
- Tailwind CSS 4.
- Radix UI primitives under `resources/js/components/ui`.
- lucide-react icons.
- hls.js player wrapper at `resources/js/components/video-player.tsx`.
- Wayfinder route/action files are generated under `resources/js/actions`, `resources/js/routes`, and `resources/js/wayfinder`.

Do not manually edit generated Wayfinder files. They regenerate during `npm run build`.

## Important Frontend Files

- `resources/js/pages/welcome.tsx`: public live directory and logged-out entry point.
- `resources/js/pages/dashboard.tsx`: creator studio for channel setup, OBS details, stream key rotation, broadcast creation, recent broadcasts.
- `resources/js/pages/channels/show.tsx`: channel watch page, HLS player, channel meta, follow, VOD list, chat panel.
- `resources/js/pages/admin/dashboard.tsx`: basic admin moderation dashboard.
- `resources/js/components/app-header.tsx`: authenticated layout header navigation.
- `resources/js/components/app-sidebar.tsx`: authenticated sidebar navigation.
- `resources/js/components/video-player.tsx`: HLS/native playback wrapper.
- `resources/js/types/streaming.ts`: frontend DTO types from controllers.
- `resources/css/app.css`: global Tailwind/theme layer.

## Backend Props And Routes

The UI currently receives arrays and objects from these controllers:

- `HomeController`: `liveChannels`, `categories`, `canRegister`.
- `CreatorDashboardController`: `channel`, `plainStreamKey`, `streaming`, `categories`, `recentBroadcasts`.
- `ChannelController`: `channel`, `currentBroadcast`, `vods`, `chatMessages`, `isFollowing`.
- `AdminDashboardController`: `stats`, `liveBroadcasts`, `channels`.

Useful routes currently used by UI:

- `GET /`
- `GET /dashboard`
- `POST /creator/channel`
- `PATCH /creator/channel`
- `POST /creator/stream-key/rotate`
- `POST /creator/broadcasts`
- `POST /creator/broadcasts/{broadcast}/stop`
- `GET /channels/{slug}`
- `POST /channels/{slug}/follow`
- `DELETE /channels/{slug}/follow`
- `POST /channels/{slug}/chat`
- `GET /admin`

Small backend prop additions are acceptable if they directly improve UI, such as image URLs, richer broadcast state labels, or structured empty-state data. Avoid unrelated backend refactors during a UI pass.

## Current UX State

The current UI is functional but first-pass:

- Live directory has basic hero text, filters, and cards.
- Creator studio is form-heavy and needs stronger visual hierarchy.
- Watch page works but needs better theatre mode, chat density, offline state, VOD presentation, and responsive layout.
- Admin page is utilitarian and acceptable as a secondary priority.
- Branding is minimal: Nyone name plus simple play logo.
- No polished thumbnail/banner/avatar upload flow yet.
- Chat is currently persisted by form submission, not realtime.
- Viewer count is stored but not realtime/presence-driven.

## Recommended UI/UX Priorities

1. Channel watch page:
   - Make the player the clear primary surface.
   - Improve live/offline states.
   - Make chat usable on desktop and mobile.
   - Add better channel header/meta and follow affordance.
   - Add responsive layout: video first, collapsible or below-player chat on smaller screens.

2. Creator studio:
   - Separate setup states: no channel, channel exists, pending broadcast, live broadcast.
   - Make OBS setup copy actions unmistakable.
   - Make stream key warning and rotation behavior clear.
   - Improve broadcast creation and current live session controls.

3. Live directory:
   - Replace generic cards with stream-like cards.
   - Improve search/category filtering layout.
   - Add high-quality empty/offline states.
   - Keep first viewport focused on live content, not marketing.

4. Navigation and shell:
   - Make Live, Studio, Admin navigation consistent.
   - Reduce starter-kit residue.
   - Ensure dark/light modes both look intentional.

## Design Constraints

- Build actual product screens, not a landing page.
- Use icons for controls where clear.
- Cards should be compact, max `rounded-md`; avoid large decorative card stacks.
- Avoid purple/blue gradient-heavy, beige-only, and generic SaaS hero styling.
- Avoid decorative blobs/orbs.
- Do not use SVG illustration as the main visual.
- Text must fit on mobile; do not use viewport-scaled fonts.
- Do not nest cards inside cards.
- Keep layouts dense enough for repeated creator/admin use.

## Local Development

The project has dependencies installed in this workspace. The local `.env` currently uses SQLite.

Useful commands:

```powershell
cd C:\Users\meghdad\PhpstormProjects\nyone

& 'C:\Users\meghdad\.config\herd\bin\php84\php.exe' artisan migrate --seed
& 'C:\Users\meghdad\.config\herd\bin\nvm\v25.2.1\npm.cmd' run dev -- --host 127.0.0.1 --port 5173
```

PHP built-in server command used successfully:

```powershell
cd C:\Users\meghdad\PhpstormProjects\nyone\public

& 'C:\Users\meghdad\.config\herd\bin\php84\php.exe' -S 127.0.0.1:8001 ..\vendor\laravel\framework\src\Illuminate\Foundation\resources\server.php
```

Local app URL:

```text
http://127.0.0.1:8001
```

Seeded users:

```text
test@example.com / password
admin@example.com / password
```

## Streaming And Deployment Context

Current `.env` values relevant to streaming:

```env
APP_URL=https://nyone.app
STREAMING_RTMP_INGEST_URL=rtmp://nyone.app:19935
STREAMING_HLS_PUBLIC_URL=https://nyone-hls.net
MEDIAMTX_SHARED_SECRET=change-this-secret
```

MediaMTX current files:

- `deploy/mediamtx.yml`: currently points auth/hooks to `https://nyone.app`.
- `deploy/mediamtx.home.yml`: points auth/hooks to `https://nyone.app`.

MediaMTX ports currently configured:

- RTMP: `:19935`
- HLS: `:19988`

OBS should use:

```text
Server: rtmp://nyone.app:19935
Stream Key: <channel-slug>?token=<generated-stream-key>
```

There is no need for Nginx TCP proxy for RTMP if port `19935` is open directly. Nginx is still useful for Laravel HTTPS and HLS HTTPS proxy.

## Verification

Run these before handing back UI work:

```powershell
& 'C:\Users\meghdad\.config\herd\bin\php84\php.exe' artisan test
& 'C:\Users\meghdad\.config\herd\bin\nvm\v25.2.1\npm.cmd' run format:check
& 'C:\Users\meghdad\.config\herd\bin\nvm\v25.2.1\npm.cmd' run lint:check
& 'C:\Users\meghdad\.config\herd\bin\nvm\v25.2.1\npm.cmd' run types:check
& 'C:\Users\meghdad\.config\herd\bin\nvm\v25.2.1\npm.cmd' run build
```

Last known successful verification from previous implementation:

- `artisan test`: 49 passing.
- `format:check`: clean.
- `lint:check`: clean.
- `types:check`: clean.
- `build`: successful, with Vite chunk-size warnings due app/HLS bundles.

## Suggested First Prompt For Next Session

```text
Read AGENTS.md and docs/ui-ux-handoff.md. Focus only on improving Nyone's UI/UX. Start with the channel watch page and creator studio, keep backend changes minimal, and verify with tests/typecheck/build.
```

# Crays Club static Vercel export

This project is the static Crays Clubs page prepared for Vercel.

## Start Here For Future Codex Chats

Read `00_CRAYS_WEBSITE_GUIDELINE_READ_FIRST.md` first, then `00_CRAYS_CI_GUIDELINES_READ_FIRST.md`, then the latest `CRAYSCLUB_HANDOVER_*.md`.

The guideline files contain the current Crays ecosystem website direction, color cautions, typography, UX rules, page-specific notes, QA checklist and deployment rule.

## Pages

- `/`
- `/legal/imprint`
- `/legal/privacy-policy`

## Deploy on Vercel

Import this folder into Vercel and use:

- Framework preset: Other
- Build command: leave empty
- Output directory: `.`

The Crays Clubs homepage uses a custom static layout and local lifestyle imagery in `assets/crays-club/`.

## Refresh the old mirror

Run:

```bash
node scripts/mirror-craysclub.mjs
```

## Important

The current homepage is no longer a raw Webflow mirror. It is a finished Crays Clubs-focused static page using only club, hospitality, Berlin, membership, community and in-venue technology content.

# Fantasy IPL PWA — Codex Build Plan

## Purpose

Build a private, mobile-first fantasy cricket Progressive Web App for a small invite-only group. The app must stay minimal, calm, and easy to use on mobile. The work should continue in a controlled way until deployment on Vercel.

This document is the source of truth for Codex. Do not redesign the product. Do not add extra features outside this plan unless they are necessary to make the listed features work.

---

## Product philosophy

The UI should feel like a zen garden: clean, sober, quiet, and pleasant.

Design rules:
- Use gentle colors only.
- Avoid flashy gradients, neon colors, and noisy shadows.
- Keep the layout airy with generous spacing.
- Prefer rounded cards, thin borders, and small labels.
- Put rules and tooltips where the user needs help, not everywhere.
- Show only the information needed for the next decision.
- Mobile-first. The desktop view can simply scale the mobile layout.
- The app should feel like a calm utility, not a gaming arcade.
- Symmetry matters: the team builder should visually balance both IPL teams side by side.
- Progressive disclosure: do not flood the user with all details at once.

The app is a mobile PWA and must be installable on Android and iOS home screens.

---

## Final scope

Core screens:
1. Match lobby
2. Match team builder
3. Live match / leaderboard view
4. Match results / completed match view
5. Basic auth / access flow
6. PWA installability

Core behaviors:
- Show live, upcoming, and completed matches.
- Let the user create a 11-player fantasy team per match.
- Enforce rules in real time:
  - 11 total players
  - 100 credits
  - max 4 overseas players
  - max 7 players from one IPL team
  - role ranges:
    - WK 1–4
    - BAT 3–6
    - AR 1–4
    - BOWL 3–6
- Let the user choose Captain and Vice-Captain.
- Lock the team at match start time.
- Use the match info feed to show playing XI, substitutes, out/in flags, live scorecard, and player-of-the-match.
- Poll match info only when needed.
- Save teams in Supabase.
- Show a leaderboard once scoring is live.
- Support a season-level net skill rating:
  - start at 0
  - a player who plays and does not win loses 20
  - the winner gets the sum of the losses from others who played that match

---

## What has already been built

The app already has a working Next.js base and a usable starter flow:
- Google login via Supabase Auth is working.
- A `/matches` lobby page exists.
- A `/match/[id]` team builder page exists.
- The team builder already supports:
  - team selection
  - credits display
  - overseas flag
  - role grouping
  - max-per-team constraint
  - captain / vice-captain selection
  - submit button logic
- The layout already moved toward the desired side-by-side symmetry.
- The project has already proven the core cricket API sources from Python experimentation.

This means the remaining work is mostly:
- normalizing the API responses into stable app-facing shapes
- finishing match-info parsing
- wiring saving/loading/locking properly
- building live scoring and leaderboard
- polishing the PWA behavior and final deploy flow

Do not rebuild these working pieces from scratch.

---

## The data sources and their actual shape

### 1) Matches list API
Use the competition matches endpoint.

Normalized fields needed:
- match_id
- title
- short_title
- match_number
- status_str
- status_note
- date_start_ist
- teama_team_id
- teama_name
- teama_short_name
- teama_logo_url
- teama_scores
- teama_overs
- teamb_team_id
- teamb_name
- teamb_short_name
- teamb_logo_url
- teamb_scores
- teamb_overs
- result
- winning_team_id
- venue_name
- venue_location
- toss_text

This is the lobby data source. It is already enough to render live, upcoming, and completed match cards.

### 2) Squads API
The squads endpoint returns:
- `response.squads[]`
- each team has:
  - `title`
  - `team_id`
  - `team.abbr`
  - `players[]`

Each player includes:
- `pid`
- `title`
- `short_name`
- `playing_role`
- `fantasy_player_rating`
- `country`
- `profile_image`
- `nationality`

Normalize into:
- player_id = pid
- name = title
- short_name
- role = WK / BAT / AR / BOWL
- team = team.abbr
- credit = normalized from fantasy_player_rating
- isOverseas = country !== "in"
- profile_image_url
- nationality

Credit rule:
- map fantasy_player_rating to a 6–11 scale
- round to 0.5 steps
- clamp to 6 and 11
- if min == max, fall back to a safe midpoint value

### 3) Match info API
The match info feed is the source of truth for live match state.

Important fields:
- `response.scorecard`
- `response.squads`
- `response.player_of_the_match`
- `response.toss`
- `response.weather`
- `response.pitch`

Confirmed structure from samples:
- `response.squads.teama.squads[]`
- `response.squads.teamb.squads[]`
- each squad player includes:
  - `player_id`
  - `name`
  - `role`
  - `playing11`
  - `substitute`
  - `out`
  - `in`
  - `role_str`

`response.scorecard` includes:
- match_id
- title
- short_title
- subtitle
- match_number
- format_str
- status_str
- status_note
- teama { team_id, name, short_name, logo_url, scores, overs }
- teamb { team_id, name, short_name, logo_url, scores, overs }

Also present in completed examples:
- player_of_the_match
- innings scorecards
- batting / bowling / fielding arrays
- match completion verification flags
- toss result

The exact parser should normalize this into one flat app-facing object.

---

## Hard rules for Codex

1. Do not rewrite the app from scratch.
2. Do not change the product scope.
3. Do not add complicated authentication systems.
4. Do not add extra screens unless they are needed for the core loop.
5. Keep the code boring and stable.
6. Prefer small, typed utility functions over huge tangled components.
7. Any time the API shape is uncertain, inspect one raw response and then normalize it once.
8. Keep client time logic client-side only. Do not render countdown text on the server if it can cause hydration mismatch.
9. Do not hardcode API keys in source files.
10. Keep the mobile layout minimal and calm.

---

## Implementation phases

### Phase 1 — Stabilize the lobby
Goal: the `/matches` page must be stable, calm, and useful.

Tasks:
- Normalize API response into a simple `MatchCard` type.
- Handle string-vs-object team names safely.
- Keep countdown client-side only.
- Render:
  - next match
  - upcoming matches
  - completed matches
- Use match status to label cards:
  - Upcoming
  - Live
  - Completed

Acceptance criteria:
- No hydration error.
- No React child object errors.
- The page shows correct match titles, countdowns, and statuses.
- Clicking a card navigates to `/match/[id]`.

### Phase 2 — Make the team builder data-driven
Goal: the team builder should load only the selected match’s relevant players.

Tasks:
- Build or finish `/api/squads?matchId=...`
- Use squads API as the base player pool.
- Filter to the two teams involved in the match.
- Normalize:
  - player name
  - role
  - credit
  - overseas flag
  - team abbreviation
- Keep the player list sorted by descending credit.
- Show selected player count per team in the header.

Acceptance criteria:
- The page shows only the two match teams.
- Player rows show name, role, team, credit, and overseas icon.
- Sorting is descending by credit.
- No empty-state bug.

### Phase 3 — Preserve the current selection engine
Goal: keep the selection logic that already works.

Current behavior to preserve:
- select / deselect by tapping plus/minus
- max 11 players
- max 100 credits
- max 4 overseas
- max 7 from one team
- role limits:
  - WK 1–4
  - BAT 3–6
  - AR 1–4
  - BOWL 3–6
- Captain and Vice-Captain selection
- disabled invalid players
- side-by-side team symmetry

Acceptance criteria:
- The page still works exactly like a fantasy draft.
- The current design stays minimal and not cluttered.
- Captain and VC are only available when a player is selected.

### Phase 4 — Persist teams in Supabase
Goal: saving a team must work end-to-end.

Tasks:
- Create or verify the `teams` table.
- Save:
  - user_id
  - match_id
  - players
  - captain
  - vice_captain
  - created_at
- Load the saved team for a user if it already exists.
- Prevent duplicate saves or handle updates cleanly.
- Keep the schema simple and queryable.

Acceptance criteria:
- A valid team can be saved.
- The saved team can be reloaded.
- The team belongs to the signed-in user.
- No broken auth/session assumptions.

### Phase 5 — Finalize login and landing flow
Goal: the app opens into the right place.

Tasks:
- Logged-out user sees login.
- Logged-in user lands on the match lobby.
- Remove any hardcoded “go to match” shortcuts.
- Keep the login flow minimal.
- Redirect to `/matches` after successful auth.

Acceptance criteria:
- Login works.
- Refresh does not break the session.
- The user lands on the match lobby, not a test page.

### Phase 6 — Build the match info parser
Goal: the remaining key input is the match-info response. This is the most important remaining integration.

Tasks:
- Build `/api/match-info?matchId=...`
- Normalize:
  - match status
  - status note
  - toss
  - player of the match
  - team metadata
  - playing XI
  - substitutes
  - out/in flags
  - innings scorecards
  - batting scorecard
  - bowling scorecard
  - fielding scorecard
- Make the parser robust but not over-abstracted.
- Use the exact fields already observed in the sample outputs.

Important behavior:
- Start polling after the scheduled toss window.
- Poll every 10 minutes thereafter for live matches.
- Stop polling when the player of the match is announced and the match is completed.

Acceptance criteria:
- The API returns a stable normalized object.
- The app can tell which players are playing XI.
- The app can tell which players are substitutes.
- The app can display live scorecard data without manual parsing in the UI.

### Phase 7 — Build live scoring
Goal: convert the match-info feed into fantasy points.

Use Dream11-style T20 scoring as the baseline:
- Run +1
- Boundary bonus +4
- Six bonus +6
- Wicket +30
- Catch +8
- Stumping +12
- Direct hit run out +12
- Non-direct run out +6
- Captain 2x
- Vice-Captain 1.5x
- Announced lineups +4
- Economy and strike-rate bonuses / penalties

Use the official Dream11 point system as the reference for T20 fantasy scoring fileciteturn10file1.

Tasks:
- Create a scoring map in code.
- Calculate per-player points from normalized stats.
- Apply captain and vice-captain multipliers.
- Store per-match score snapshots.
- Only recalculate when new match-info data arrives or when the leaderboard is opened.

Acceptance criteria:
- A complete score can be calculated from a completed match.
- Live scores update when match-info changes.
- The scoring rules stay in one maintainable mapping, not scattered across the UI.

### Phase 8 — Leaderboard and comparisons
Goal: show who is winning.

Tasks:
- Build a match leaderboard.
- Build a season leaderboard using the net skill rating.
- Support 1v1 comparison of two teams.
- Support match-level and season-level views.
- Show rank, score, captain, and vice-captain markers.

Net skill rating rule:
- start each player at 0
- each played match lost: -20
- winner gets the sum of all losing points from other players in that match

Acceptance criteria:
- The leaderboard is readable on mobile.
- The ranking updates cleanly after scoring is computed.
- The season total is persisted.

### Phase 9 — PWA polish and deploy
Goal: ship a clean installable app.

Tasks:
- Ensure manifest and icons are present.
- Ensure the app is installable on Android and iOS home screen.
- Verify mobile metadata.
- Make sure the production build works.
- Deploy to Vercel.
- Check environment variables on Vercel.
- Verify Supabase and auth redirects in production.

Acceptance criteria:
- The app installs as a PWA.
- The deployed URL works.
- Login, lobby, team builder, and saving all work on the deployed environment.

---

## File map

Likely important files:
- `app/page.tsx` — auth gate / redirect entry point
- `app/matches/page.tsx` — match lobby
- `app/match/[id]/page.tsx` — team builder
- `app/api/matches/route.ts` — normalized match list
- `app/api/squads/route.ts` — normalized squads/player pool
- `app/api/match-info/route.ts` — normalized live match data
- `app/api/save-team/route.ts` — save team endpoint
- `lib/supabase.ts` — Supabase client
- `public/manifest.json` and icons — PWA assets
- `supabase` SQL migrations / schema — teams, users, scores, leaderboard tables

---

## Recommended data tables

Keep the database simple.

### users
- id
- email
- name
- created_at

### matches
- match_id
- status_str
- status_note
- start_time
- team_a_id
- team_b_id
- team_a_name
- team_b_name
- team_a_logo_url
- team_b_logo_url
- result
- winning_team_id
- venue_name
- venue_location
- updated_at

### players
- player_id
- name
- short_name
- role
- team_abbr
- country
- is_overseas
- fantasy_rating
- credit
- profile_image_url

### match_players
- match_id
- player_id
- team_id
- team_abbr
- role
- credit
- is_playing
- is_substitute
- is_out
- is_in
- batting JSON
- bowling JSON
- fielding JSON
- updated_at

### teams
- id
- user_id
- match_id
- captain
- vice_captain
- players array
- created_at
- updated_at

### scores
- id
- match_id
- user_id
- total_points
- captain_points
- vice_captain_points
- team_points JSON
- last_computed_at

### season_ratings
- user_id
- net_skill_rating
- matches_played
- matches_won
- matches_lost
- updated_at

---

## UX details to preserve

- The user should always know where they are.
- Use calm labels like:
  - Next Match
  - Upcoming
  - Live
  - Completed
- Keep the scorecard details hidden until needed.
- Use tooltips / info text only where rules matter.
- Keep cards narrow and readable on mobile.
- Avoid large blocks of text.
- Keep the player selection layout symmetric and balanced.

---

## Deployment order

1. Stabilize matches page.
2. Stabilize match builder data.
3. Finish match-info normalization.
4. Finish saving and loading teams.
5. Add scoring and leaderboard.
6. Add PWA polish.
7. Deploy to Vercel.

Do not skip ahead to polish before data flow is stable.

---

## What Codex should do when unsure

If the API shape or data mapping is unclear:
1. Print one raw sample response.
2. Normalize once.
3. Stop changing the parser unless the sample changes.

Do not keep adding fallbacks endlessly. That is how the app turns into a mess.

---

## The finish line

When done, the app should allow a signed-in user to:
- open the lobby
- view live/upcoming matches
- open a match
- build a legal team
- choose captain and vice-captain
- save the team
- see live points / leaderboard
- use the app as a PWA on mobile

That is the complete target.

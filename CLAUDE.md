# OpenDesignHome — Claude Working Instructions

## Project Identity
- **App**: Open Design Home — Free room design game (Design Home alternative)
- **GitHub**: https://github.com/CindyRaaen/OpenDesignHome
- **Live**: https://open-design-home.vercel.app
- **Organization**: Open Scaffold Labs
- **Founder**: Dale Raaen (draaen@mac.com / GitHub: draaen-jpg)

## CRITICAL: Tool Usage

### Git & Mac filesystem → Desktop Commander ONLY
The VM sandbox has an HTTP proxy that blocks HTTPS to github.com.
Bash tool git commands will always fail.

**Always use `mcp__desktop-commander__start_process` for:**
- `git pull`, `git push`, `git log`, `git status`, `git commit`
- Any file read/write on the Mac
- npm/node commands run from the actual project

**Never use the VM Bash tool for git or Mac filesystem operations.**

### Seed Files
Seed files must use `module.exports = async function()` pattern.
Never use standalone scripts with `process.exit()` — they crash the server.

## Game Concept

Open Design Home is a free alternative to the Design Home mobile game:
1. Players browse **challenges** — each challenge features a room type (living room, bedroom, kitchen, dining room, bathroom, studio)
2. Players enter a challenge and see a **perspective room view** with walls, windows, fireplace, and furniture placement slots
3. Players customize the room: choose **wallpaper**, **flooring**, **rugs**, and tap empty slots to place **furniture** from a 48-item catalog
4. Submitted designs go to **voting** where other players rate them
5. **Leaderboards** track top designers

Key difference from Design Home: 100% free, no in-app purchases, no virtual currency.

## Tech Stack
- **Frontend**: React 19 + Vite + Tailwind CSS v3 (PostCSS pattern, NOT v4)
- **Backend**: Express.js + PostgreSQL (Neon cloud DB, direct queries, no ORM)
- **Auth**: JWT + bcrypt. Shared `users` table with `username` + `"passwordHash"` (camelCase, quoted in queries)
- **Deployment**: Vercel serverless (`/tmp/odh-deploy/` staging dir)
- **Shared core**: Part of Open Scaffold Labs ecosystem

## Ports
- **Client**: http://localhost:5197
- **Server**: http://localhost:3029

## Database
- **Table prefix**: `odh_`
- **Shared DB**: `postgresql://[user]@localhost:5432/openfirehouse` (or Neon cloud in production)
- **Token key**: `odh_token`
- **Tables**: `odh_challenges`, `odh_furniture`, `odh_designs`, `odh_votes`, `odh_profiles`, `odh_leaderboard`

## Deploy Workflow
```bash
# 1. Build client
cd OpenDesignHome/client && npm run build

# 2. Copy to deploy staging
rm -rf /tmp/odh-deploy/public && mkdir -p /tmp/odh-deploy/public
cp -r client/dist/* /tmp/odh-deploy/public/
cp server/src/index.js /tmp/odh-deploy/server/src/index.js
cp server/src/db.js /tmp/odh-deploy/server/src/db.js
cp server/src/routes/*.js /tmp/odh-deploy/server/src/routes/

# 3. Deploy
cd /tmp/odh-deploy && vercel --prod --yes --scope open-scaffold-labs

# 4. Alias
vercel alias <deployment-url> open-design-home.vercel.app --scope open-scaffold-labs
```

**CRITICAL**: Always copy `db.js` to the deploy directory — the server imports it.

## Structure
```
OpenDesignHome/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx          ← responsive layout with bottom tab bar
│   │   │   ├── LoginScreen.jsx     ← hero room SVG + username/password auth
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── ChallengesPage.jsx  ← SVG room preview cards for each challenge
│   │   │   ├── DesignEditorPage.jsx ← THE GAME: perspective room + slot-based furniture
│   │   │   ├── VotingPage.jsx      ← rate other designs
│   │   │   ├── LeaderboardPage.jsx ← top designers
│   │   │   ├── FurnitureCatalogPage.jsx ← browse all furniture
│   │   │   └── ProfilePage.jsx     ← user profile
│   │   ├── utils/api.js            ← API utility with auth token
│   │   └── App.jsx                 ← routing + state
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── db.js                   ← PostgreSQL pool (MUST be deployed)
│   │   ├── index.js                ← Express app, DB init, auth, seed data
│   │   └── routes/
│   │       ├── challenges.js
│   │       ├── designs.js
│   │       ├── furniture.js
│   │       ├── leaderboard.js
│   │       ├── profile.js
│   │       ├── public-challenges.js
│   │       └── vote.js
│   └── package.json
└── CLAUDE.md
```

## Room Types
| Room Type | Template Key | Has Fireplace | Slots |
|-----------|-------------|:-------------:|:-----:|
| Living Room | `living_room` | Yes | 8 |
| Bedroom | `bedroom` | No | 7 |
| Kitchen | `kitchen` | No | 6 |
| Dining Room | `dining_room` | No | 9 |
| Bathroom | `bathroom` | No | 6 |
| Studio | `studio` | No | 10 |

## Furniture Categories
sofas (8), chairs (8), tables (8), lamps (8), art (8), plants (8) = 48 total items

## Auth Notes
- Shared `users` table uses `"passwordHash"` (camelCase, must be quoted in SQL)
- Login/register use `username` field (not email)
- JWT tokens stored in localStorage as `odh_token`
- Test account: cindy / design123 (user id 85)

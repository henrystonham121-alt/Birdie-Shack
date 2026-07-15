# The Grindhouse — standalone Netlify deploy

This folder is a self-contained Netlify site: the app itself, plus two
serverless Functions that replace what Claude's artifact environment was
doing for you (shared storage, and the AI photo/lookup features).

## What's in here

- `public/index.html` — the app. Same UI as before, but it now talks to
  `/api/data` for shared storage and `/api/claude-proxy` for AI features,
  instead of Claude's built-in equivalents.
- `netlify/functions/data.js` — reads/writes the group's data (players,
  courses, rounds, matches) using **Netlify Blobs**, Netlify's own
  key-value store. This is what makes the data shared across everyone
  who opens the site — no external database needed.
- `netlify/functions/claude-proxy.js` — forwards scorecard-photo and
  course-lookup requests to Anthropic's API using your API key, which
  stays server-side the whole time and is never sent to the browser.
- `netlify.toml` — tells Netlify where the site and functions live, and
  maps the friendly `/api/...` paths to the actual function URLs.
- `package.json` — lists `@netlify/blobs` so Netlify installs it when
  building your functions.

## One-time setup

1. **Add your Anthropic API key.** In the Netlify dashboard for this
   site: Site configuration → Environment variables → Add a variable
   named `ANTHROPIC_API_KEY` with your key as the value. This is what
   makes photo reading and course lookup work — without it, those two
   features will return a clear error but everything else still works.

2. **Deploy.** Two options:
   - **Drag-and-drop won't work this time** — Netlify Drop only takes
     static files, and this site has Functions that need building. Use
     either of these instead:
   - **Netlify CLI** (fastest if you're doing this yourself): from
     inside this folder, run `npm install` once, then
     `netlify deploy --prod`.
   - **Git-connected site** (better if you'll keep iterating): push
     this folder to a GitHub repo and connect it in the Netlify
     dashboard as a new site. Netlify will run the build and install
     `@netlify/blobs` automatically on every push.

3. **Redeploy after adding the environment variable** if you added it
   after the first deploy — functions only pick up env vars on a fresh
   deploy.

## Cost note

Every photo read and course lookup now bills to your own Anthropic API
key, not Claude usage. Both features are used on-demand (only when
someone clicks "Extract scores" or "Look up courses"), so cost scales
with how often the group actually uses them — worth keeping an eye on
usage in the Anthropic console if the group leans on it heavily.

## If something doesn't work

- **Photo/lookup features error out**: check the environment variable
  is set and you've redeployed since adding it.
- **Data doesn't seem to save/share**: check the Netlify Function logs
  (Site → Functions → data) for errors — most likely cause is the site
  not having Netlify Blobs available (it's automatically provisioned
  per-site, no setup needed, but very old sites may need a redeploy to
  pick it up).

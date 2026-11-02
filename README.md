# Delhi Eco-Flow — Team Dashboard

A shared team dashboard for the AES Unit 4 Social Action Project. It tracks tasks, milestones and weekly check-ins, and everyone on the team sees the same data.

```
index.html     the website
shared.js      team members, milestones and starter tasks (edit this to change the team)
api/data.js    Vercel serverless API that stores the shared data in Upstash Redis
```

## Deploy to Vercel

1. **Upload the project.** Use either option:
   - Push this folder to a GitHub repo, then go to vercel.com → **Add New → Project** and import the repo. Leave Framework Preset set to **Other** with no build command.
   - Or, from inside this folder, run `npx vercel` and follow the prompts.
2. **Add the database.** In your Vercel project, open **Storage → Create Database → Upstash for Redis** (the free plan is enough) and connect it to the project. This sets the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables automatically.
3. **Optional: add a passcode.** Under **Settings → Environment Variables**, add `TEAM_PASSCODE` with any value. Anyone can still view the dashboard, but changing anything asks for the passcode once per browser.
4. **Redeploy.** Go to **Deployments → ⋯ → Redeploy** so the new environment variables take effect.

The pill in the top bar shows **Live team sync** when the database is connected. If it shows **Saved on this device**, the database isn't connected yet, and the dashboard falls back to saving in the browser.

## Running it locally

- To check the layout quickly, open `index.html` directly in a browser. Data is saved in that browser only.
- To test with the real API, run `npx vercel dev`. Run `npx vercel env pull` first so it can use the database.

## Editing the team

Edit `members`, `milestoneNames` or `starterTasks` in `shared.js`. The starter tasks are only added the first time the database is used. To reset everything, delete the `ecoflow:*` keys in the Upstash console.

# Delhi Eco-Flow — Team Dashboard

A shared team dashboard for the AES Unit 4 Social Action Project. Everyone picks their profile on the **Who's working?** screen, then logs their own tasks and weekly check-ins. Team progress at the top is the same for everyone.

**Ramzi's profile is the CEO.** Only the CEO can mark milestones, add, complete or delete anyone's tasks, delete check-ins, and export the data. Other members can only change their own tasks and check-ins.

```
index.html     the website
shared.js      team members, milestones and starter tasks (edit this to change the team)
photos/        profile pictures (optional)
api/data.js    Vercel serverless API that stores the shared data in Upstash Redis
```

## Deploy to Vercel

1. **Upload the project.** Use either option:
   - Push this folder to a GitHub repo, then go to vercel.com → **Add New → Project** and import the repo. Leave Framework Preset set to **Other** with no build command.
   - Or, from inside this folder, run `npx vercel` and follow the prompts.
2. **Add the database.** In your Vercel project, open **Storage → Create Database → Upstash for Redis** (the free plan is enough) and connect it to the project. This sets the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables automatically.
3. **Add passcodes (recommended).** Under **Settings → Environment Variables**:
   - `CEO_PASSCODE`: locks Ramzi's profile. Opening it asks for this passcode, and CEO-only changes are refused without it. If you skip this, anyone who picks Ramzi's profile gets CEO controls.
   - `TEAM_PASSCODE` (optional): anyone can still view the dashboard, but making changes asks for this passcode once per browser.
4. **Redeploy.** Go to **Deployments → ⋯ → Redeploy** so the new environment variables take effect.

The pill in the top bar shows **Live team sync** when the database is connected. If it shows **Saved on this device**, the database isn't connected yet, and the dashboard falls back to saving in the browser.

## Running it locally

- To check the layout quickly, open `index.html` directly in a browser. Data is saved in that browser only.
- To test with the real API, run `npx vercel dev`. Run `npx vercel env pull` first so it can use the database.

## Editing the team

To add profile pictures, put square images in `photos/` and set each member's `photo` in `shared.js`, e.g. `photo: "photos/ramzi.jpg"`. Members without a photo show their initials.

The member with `ceo: true` gets the CEO controls. Edit `members`, `milestoneNames` or `starterTasks` in `shared.js`. The starter tasks are only added the first time the database is used. To reset everything, delete the `ecoflow:*` keys in the Upstash console.

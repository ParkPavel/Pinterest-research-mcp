# Project website

GitHub Pages source: **main /docs**. No custom domain or changes to the personal website are needed. `index.html` and `privacy.html` are usable without JavaScript. `.nojekyll` disables Jekyll processing.

Update the committed content snapshot after changing the tool registry, package version, README, or privacy policy:

```sh
node scripts/sync-site.mjs
node --test scripts/site.test.mjs
```

The browser resolves the current main commit, then reads the tool registry, package version, README and privacy policy at that immutable SHA. PR #1 and main CI status update independently through GitHub's public API. API errors or rate limits keep the saved content visible and display a freshness message. CI success on a feature branch is never presented as main CI success; Pages deployment runs are not CI results.

Readiness statements are deliberately conservative and require editorial review when the project becomes production ready. A merged PR or green CI is not treated as proof of a ready ChatGPT app. The tool parser supports the current `register(name, description, ...)` form; update it if the registry format changes. `Site checks` validates local links, snapshot consistency and safe policy rendering on pushes and PRs.

The site uses system fonts, no analytics, no cookies and no external UI assets. Live content requests go to GitHub API and raw.githubusercontent.com; GitHub may process request metadata under its own terms. Clicking support opens Tribute, which has separate terms. The original project privacy policy is displayed in English without translation or alteration.

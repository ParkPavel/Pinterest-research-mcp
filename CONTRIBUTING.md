# Contributing

Thanks for helping improve Pinterest Research MCP.

## Scope

We are building a privacy-conscious, read-only MCP integration for accessible Pinterest boards and Pins, plus optional visual-research interfaces. Contributions must respect Pinterest API conditions and user consent.

## Development workflow

1. Read [README](README.md), [Privacy Policy](PRIVACY.md), and [Security Policy](SECURITY.md).
2. Open an issue describing the proposed change (unless it is a small documentation fix).
3. Fork the repository or work in a feature branch; do not commit account tokens or customer data.
4. Use Node.js 20+ and run `npm ci`, `npm run check`, `npm run build`, `npm test`, and `npm run test:site`.
5. Describe the behavior, manual testing, limitations and permissions in your pull request.

Avoid introducing write/publish scopes, scraping or login bypasses without a separate review. Never include real Pinterest account data in tests or screenshots without consent.

## Legal note

An open GitHub repository is not automatically an open-source licensed project. **No software license has been selected yet.** Before incorporating third-party contributions or redistributing code, agree on licensing and contributor permissions with the maintainer.

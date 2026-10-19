# Security Policy

Pinterest Research MCP handles sensitive OAuth credentials and private account data. Please report vulnerabilities responsibly.

## Supported versions

This is an experimental project. Only the latest development version is maintained; production security support is **not** guaranteed.

## Reporting

**Do not publish vulnerabilities, credentials, session cookies or personal data in public GitHub issues.**

If GitHub private vulnerability reporting is enabled for the repository, use **Security → Report a vulnerability**. Otherwise, open a [public issue](https://github.com/ParkPavel/Pinterest-research-mcp/issues/new) requesting a private reporting channel, without including sensitive details.

When reporting privately, share: affected version, reproduction steps, impact, and suggested mitigation (if available). Reports will be reviewed as development capacity allows; no response-time guarantee is offered.

## Deployment guidance

- Keep `.env`, `.data/`, secrets and token stores out of git.
- Run only on loopback during development; use HTTPS, a proper OAuth authorization server and per-user credential isolation before public deployment.
- Request minimum read-only permissions; periodically rotate keys and revoke unused OAuth grants.
- Avoid logging bearer tokens, authorization codes, Pins from private collections, and personally identifiable information.
- Do not use the proof-of-concept bearer-token HTTP mode for multi-user production installations.

## Security-foundation limits

The local callback is single-use and expires after five minutes. API and OAuth errors use fixed public messages; do not add upstream response bodies to logs. Tokens use atomic encrypted writes. Refresh/reconnect/disconnect are serialized per subject within one process; the filesystem adapter is not a distributed database and must live under a trusted private OS account.

Raw-token and custom-scope environment overrides are not supported. No public HTTP service is included in this security-foundation branch. The draft PR #1 HTTP implementation uses shared Pinterest credentials and must remain undeployed until verified identity mapping, distributed rotation, provider configuration and end-to-end tests pass. See [audit](docs/AUDIT.md) and [release gates](ROADMAP.md).

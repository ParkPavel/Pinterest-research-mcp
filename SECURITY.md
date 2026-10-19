# Security Policy

Visual Research MCP handles sensitive OAuth credentials and private account data. Please report vulnerabilities responsibly.

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

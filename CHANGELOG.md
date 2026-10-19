# Changelog

## Unreleased — security foundation

- Harden local OAuth against callback path confusion, expired/reused state and concurrent exchanges.
- Replace raw upstream errors with fixed public error codes; add timeouts, redirect rejection and response limits.
- Validate OAuth token responses and minimal read-only scopes; handle continuous refresh, revoked/expired refresh and API access errors.
- Add atomic AES-256-GCM token writes and explicit-subject storage/client primitives with per-user serialization.
- Add `npm run logout` to delete the local token copy; provider grant revocation remains a separate Pinterest setting.
- Remove `PINTEREST_ACCESS_TOKEN` and custom-scope environment overrides; use the OAuth flow with the three fixed read scopes.
- Add reproducible dependency lock, backend CI, security/protocol tests, audit, roadmap and owner/release documentation.
- No hosted multi-user service, Pinterest approval, vision analysis or ChatGPT release is included in this change.

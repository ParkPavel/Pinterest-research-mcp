# OAuth and credential boundaries

## Current executable local flow

1. Owner runs `npm run auth` after entering local credentials in `.env`.
2. A loopback HTTP callback starts for at most five minutes. Only exact `/callback`, configured Host and GET are accepted.
3. Pinterest receives the registered redirect, random 256-bit state and exactly `boards:read,pins:read,user_accounts:read`.
4. State is compared, expires and is consumed synchronously before the authorization-code exchange. Denial and exchange failure require a new login.
5. Tokens are validated and encrypted with AES-256-GCM; key stays in `.env`. Writes use a unique 0600 temporary file and atomic rename within a private directory.
6. Near-expiry access tokens are refreshed under a per-subject lock. Rotated refresh tokens replace the old value. Refresh expiry is checked; invalid grants clear the local copy. One 401 refresh retry is allowed; no automatic retry loops on 403/429.
7. `npm run logout` deletes the local copy. Separately remove the app in Pinterest settings to revoke the provider grant. Local deletion is not remote revocation.

The file adapter is for a trusted local OS account and **one running process**. Do not share `.data` with untrusted processes. Local subject `local` preserves the previous encrypted-file format; a future hosted gateway must use canonical verified issuer/subject IDs and must not map tenants to this reserved name. No raw-token or arbitrary-scope environment overrides are supported.

## Required hosted architecture (not yet deployed)

| Trust boundary | Credential | Validation / identity source |
| --- | --- | --- |
| ChatGPT → MCP | Access token issued by external OAuth 2.1 provider | Verify issuer, signature, permitted algorithms, audience equal to canonical MCP resource, required `exp` and `sub`, `nbf` when present, scopes; derive identity from verified claims |
| Service → Pinterest | Individual Pinterest OAuth access/refresh token | Authorization Code flow; separate app client secret; exact Pinterest callback; encrypted per-user credentials |

Never accept a Pinterest token as a ChatGPT MCP access token. Never accept a tool-supplied user ID as authenticated identity. Never fall back from an unknown tenant to a local/shared token.

Proposed paths after hosting is selected: `/mcp`, `/.well-known/oauth-protected-resource`, `/auth/pinterest/start`, `/auth/pinterest/callback`, authenticated disconnect/deletion endpoints. Exact HTTPS origins are unknown; **do not register placeholder hosts**. MCP auth provider callback is copied from OpenAI's connection configuration, not reused from Pinterest.

Hosted linking requires an authenticated browser session, explicit consent, state tied to session+issuer+subject+exact redirect, transactional one-time consumption and short expiry. Persist token rotation with DB locking/CAS across replicas; synchronize reconnect, disconnect and deletion. Keep connection state out of URLs and tool output. Session cookies require Secure/HttpOnly/SameSite and CSRF protection.

Use an established OAuth provider with discovery, PKCE S256, resource indicators and compatible client recognition. Configure JWKS via trusted discovery/configuration, not a guessed path or request-supplied URL. No unverified issuer URLs or client-provided `jku` fetches.

## Key rotation / deletion

Local key rotation: stop all clients; decrypt existing files with the old key and re-encrypt with the new key in a private offline migration, or delete local token copies and reauthorize. Changing only the environment key makes previous ciphertext unreadable. Never upload either key or tokens.

Hosted envelope encryption needs key IDs, a KMS/master key outside the database, audited rotation, restricted service identity and a tested migration/rollback. Persist only credentials and minimal identity mapping; do not retain Pin content by default. Document revocation and deletion tombstones before backups are enabled.

# Operator runbook

## Local setup

Use Node 22+ (CI also tests 24). `npm ci`, `cp .env.example .env`; enter app credentials and a locally generated `openssl rand -hex 32` key. Register `http://127.0.0.1:8765/callback` only if Pinterest accepts it for this app. It is the current executable local redirect, not a production URI. `node --import tsx src/auth.ts` avoids CLI IPC restrictions on constrained hosts; `npm run auth` is convenient on a normal workstation.

Run `npm run check`, `npm run build`, `npm test`, `npm run test:site`, `npm start`. The stdio process belongs to one local user. `npm run logout` (or `node --import tsx src/logout.ts` in restricted environments) deletes its local token copy. Revoke the provider grant separately.

On `AUTH_EXPIRED`, reconnect. On `PINNER_DATA_ACCESS_DENIED`, stop repeating the request and resolve Pinterest permissions. On `RATE_LIMITED`, honor provider delay and configured quotas; do not probe limits. On `STORAGE_ERROR`, inspect local directory permissions/key configuration without printing either key or ciphertext. An unavailable service is preferable to fallback to another account.

## Hosting decision, checked 2026-10-19

| Candidate | Observed cost / limitations | Assessment |
| --- | --- | --- |
| Render | Vendor July-2026 example: about $13/month for always-on web + small Postgres, before extras; current quote required; free web sleeps after 15 minutes and free Postgres expires after 30 days | Provisional first choice for an always-on managed deployment; get full quote for DB, auth, region, backups and egress before creating resources |
| Railway | Hobby minimum $5/month including $5 usage; actual compute/DB/egress can exceed credit | Viable usage-based alternative; not an unlimited $5 bundle; require budget controls |
| Fly.io | Compute, volumes, transfer and managed data billed separately; unmanaged Postgres is operator-managed | More operational responsibility; do not assume a permanent free allowance |

Sources: [Render cost model/example](https://render.com/articles/how-much-does-cloud-application-hosting-cost-for-small-businesses), [pricing](https://render.com/pricing), [free limitations](https://render.com/docs/free), [Railway plans](https://docs.railway.com/pricing/plans), [Fly pricing](https://docs.fly.io/about/pricing). No provider account/payment/region eligibility was verified. No resources or subscription were created. Authorization-provider cost is additional and unquoted. Owner approval is required for actual spending.

## Deployment gate and proposed operations

This branch has **no production entrypoint**. Do not deploy `npm start` behind a public proxy or promote PR #1 unchanged. Once authenticated HTTP and transactional storage are implemented:

1. Deploy staging from a passing immutable commit, with private secrets in provider secret storage, TLS and trusted public URL. Give the container no GitHub write token.
2. Require database migrations with backward compatibility. `/healthz` reports process health only; `/readyz` checks essential configuration/database access without exposing details or depending on Pinterest availability.
3. Log request ID, route class, latency, status and safe error code; never Authorization headers, callback query, Pin payloads, cookies or OAuth bodies. Disable request-body logging at proxies.
4. Apply per-authenticated-user and IP limits, request-size limits and a quota ceiling below provider allowance. Gracefully drain on SIGTERM. Fail closed when auth/JWKS/DB is unavailable.
5. Alert on health failure, sustained 5xx, auth failures, refresh failures, saturation and budget usage. Monitoring is not yet configured; CI is not uptime monitoring.
6. Production promotion needs a separate owner approval after staging acceptance. Keep the prior immutable image/commit and previous schema compatible.

## Rollback / backups (must be exercised before release)

Disable new connections if compromised. Roll back to the previous reviewed artifact; never restore the insecure shared-account prototype. Rollback must not restore an already consumed OAuth code or superseded refresh token. Reauthorize rather than revive stale grants. Revoke leaked credentials at their issuer.

Back up only minimal encrypted identity/token records if operationally necessary, with encryption keys separate and restricted access; no Pin/image backups. Proposed maximum backup retention: seven days, pending policy/owner approval. Keep deletion tombstones independently; replay them before serving any restored database. Test restore, key rotation and deletion under concurrent refresh in staging. No current backup/restore success is claimed.

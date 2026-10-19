# Production roadmap

Updated 2026-10-19. **Release status: blocked; local development only.**
A checkbox requires evidence, not source-code presence or a green compile.

| Stage | Current evidence | Acceptance gate / next work |
| --- | --- | --- |
| A — independent audit | [Audit](docs/AUDIT.md), main + PR #1 examined; dependencies installed, baseline compiled | Track every P0/P1 to closure; re-audit before deployment |
| B1 — local OAuth/token foundation | Single-use expiring state; exact callback; safe errors; atomic encrypted storage; serialized refresh; local logout; automated fixture tests | Merge only after backend + site CI succeeds |
| B2 — hosted per-user Pinterest OAuth | Per-subject client/store primitives tested; no hosted callback or identity binding yet | Bind verified issuer+subject to one Pinterest account; browser-bound state in transactional shared store; live login/denial/reconnect/refresh/revoke tests |
| C — authenticated HTTP MCP | Draft PR #1 is a single-account prototype and must not be deployed | OAuth 2.1 provider, PKCE S256/client recognition, exact resource/audience, required JWT claims, per-user context; no shared fallback; HTTP limits/timeouts/shutdown/abuse tests |
| D — ChatGPT UI | PR #1 gallery prototype only | Use existing editorial site styles; board picker, source-linked real images, connection/error/empty/loading states, selections, analysis with actual pixels; browser + actual ChatGPT desktop/mobile QA |
| E — Pinterest approval | Owner reports Trial denial; private dashboard not verified | Support appeal and clarification of AI processing/storage, then follow Pinterest's response; Trial before eligible Standard application; live video |
| F — infrastructure | Public static Pages exists; no MCP hosting provisioned | Owner-approved budget/region/provider + external authorization service; isolated staging/production, DB, secrets, HTTPS, alerts, restore + rollback exercise |
| G — system acceptance | Fixture security tests + local stdio discovery/calls | Real HTTP Inspector, two real independent users, provider outage, expired JWTs, scopes, rate limits, revoke, deletion, restored backups, actual ChatGPT image rendering |
| H — directory submission | [Draft review packet](docs/RELEASE.md) | Verified publishing identity + real HTTPS endpoint + approved API access + test account + all release gates + explicit owner approval |

## Work order

1. Review and merge B1 after CI. Do not merge PR #1 into production as-is.
2. Resolve Pinterest approval/use-case questions and choose auth/hosting accounts with the owner.
3. Implement B2/C on a fresh branch using the B1 adapters and a transactional database. These can be developed with fixtures, but cannot pass integration gates without accounts.
4. Implement D against the authenticated service and verified policy scope; keep visual analysis disabled until actual image-input and permitted processing are verified.
5. Run F/G in staging; update privacy to deployed facts; only then request final H approval.

## Non-negotiable release gates

- [ ] Compliant independent application name/visual identity selected and reflected on website/privacy; authenticated registration fields checked (docs/APPLICATION_CHECKLIST.md).
- [ ] Pinterest API tier and content permissions verified in the dashboard.
- [ ] Pinterest confirms proposed third-party AI processing/storage is allowed, or product scope is changed accordingly.
- [ ] Login, denial, refresh rotation, reconnect and grant revocation proven with real accounts.
- [ ] User A cannot list or retrieve user B's credentials/data, including concurrent/retried requests.
- [ ] Public HTTPS MCP passes token signature/issuer/audience/expiry/scope/subject checks.
- [ ] Real images reach the vision-capable client; output distinguishes observations from inference and cites sources.
- [ ] ChatGPT and Inspector can discover/call tools and render supported UI.
- [ ] Deletion, backup expiration and restored-deletion handling are proven.
- [ ] Privacy contact, region, subprocessors and retention reflect the running service.
- [ ] Software license and distribution terms selected by owner (currently absent).
- [ ] Owner approves costs, submission and public release; platform approval separately recorded.

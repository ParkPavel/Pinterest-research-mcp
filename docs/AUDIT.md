# Independent technical audit — 2026-10-19

## Scope and evidence

Audited main `3818b91e4164e81625e89e8b5860f430c3b66087` and draft PR #1 branch `feat/chatgpt-mcp-app-v0.2` at `127fcf813a3483cf93d471db1269b7189c0b0a70`. These were the two remote branches returned by GitHub. PR #1 was open and draft. No production credentials were available or inspected.

Main baseline: `npm install --package-lock-only --ignore-scripts`, `npm ci --ignore-scripts`, `npm run check`, `npm run build`, and the three existing site tests passed. Installed MCP SDK: **1.32.1**, Zod **3.25.76**, TypeScript **5.9.3**. Main originally had no lockfile or backend test workflow. SDK v1 remains maintained according to the [official SDK repository](https://github.com/modelcontextprotocol/typescript-sdk); migrating SDK generations is separate work, not a prerequisite for these fixes.

GitHub evidence at inspection:

- [Main Site checks: success](https://github.com/ParkPavel/Pinterest-research-mcp/actions/runs/39272743933).
- [Main Pages deployment: success](https://github.com/ParkPavel/Pinterest-research-mcp/actions/runs/39272742951).
- [PR #1 prototype CI: success](https://github.com/ParkPavel/Pinterest-research-mcp/actions/runs/39250209662), typecheck/build only. This does not prove auth or gallery interoperability.

## Confirmed defects / release blockers

| Priority | Evidence in audited source | Impact | Disposition in this change |
| --- | --- | --- | --- |
| P0 deployment | PR #1 `oauth.ts` returns boolean; `server.ts` calls global `pinterestGet`; `.data/tokens.enc` is shared | Every accepted MCP identity accesses the same Pinterest account | Keep prototype undeployed; introduce explicit-subject client/store primitives with isolation tests; hosted mapping still required |
| P1 | Main OAuth errors stringify raw token response; API errors return raw body; auth logs thrown error | Possible disclosure of upstream secrets/account data into logs/tool output | Replaced with fixed public error codes; response bodies never returned on errors |
| P1 | Callback accepted any path starting `/callback`; no expiration or consumed state | Replay/concurrent code exchange and ambiguous callback routing | Exact method/host/path; constant-time state validation, five-minute expiry, consume before exchange |
| P1 | Unbounded token fetch; default redirect following | Credential forwarding on redirects and stuck exchanges | Reject redirects, 20-second deadlines, bounded JSON reads |
| P1 | Direct `writeFile` to token file; global refresh promise; logout absent | Torn files, no reusable per-identity isolation, refresh/logout races | Atomic rename, restrictive permissions, per-identity serialization, local deletion command |
| P1 | PR #1 JWT verifier accepts missing `exp`/`sub` if other claims pass and returns no identity | Valid token signature alone is not a tenant boundary | Do not expose that branch publicly; require fail-closed verified identity in hosted stage |
| P1 | PR #1 resource is `<origin>/mcp`, default audience is `<origin>` | Inconsistent OAuth resource/audience contract | Resolve canonical resource exactly in hosted gateway tests |
| P1 | No actual visual-model input or analysis implementation | URLs or an HTML gallery cannot establish pixel-level observations | Document unsupported state; no generated substitutes or analysis claims |
| P1 | No HTTP per-user limits/body cap/origin policy or graceful shutdown in prototype | Public endpoint abuse and availability risks | Hosted gate remains open |
| P2 | Token shape/expiry unchecked; refresh expiry ignored; 401/403/429 unclassified | Invalid grants retained; repeated failures unclear | Token validation, expiry checks, one 401 refresh retry, explicit non-retryable data-access denial and rate limit |
| P2 | PR #1 UI accepts loose image URLs/messages; no complete connection/board/research flow | Gallery protocol/security/UX unverified | Use current official UI bridge and provenance rules during D; real ChatGPT test required |

## Platform findings

- [Pinterest access tiers](https://developers.pinterest.com/docs/key-concepts/access-tiers/): Trial is needed before an eligible Standard request; Standard evidence includes live OAuth and API use. For denial appeal use the linked Help Center, then follow its response. Owner-reported denial is not independently dashboard-verified.
- [Pinterest OAuth](https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/): exact redirect matching and continuous refresh-token handling are required by this implementation. Apps created since September 25, 2025 receive continuous refresh automatically; older apps use `continuous_refresh=true`.
- [Official Pinner data notice](https://community.pinterest.biz/t/understanding-the-pinner-data-access-denied-access-error/51738): do not loop on this 403; newly registered apps may need additional permission for data beyond the authorizing account. Do not promise arbitrary public/private account access.
- [Developer Guidelines](https://policy.pinterest.com/en/developer-guidelines) restrict API-content persistence, third-party sharing and use for model training. Whether this particular ChatGPT inference flow is permitted is **unresolved**, not established by user consent alone. Obtain clarification before activation. No training/fine-tuning is proposed.
- OpenAI's legacy Apps SDK links currently redirect to [plugin auth](https://developers.openai.com/plugins/build/auth) and [submission](https://developers.openai.com/plugins/deploy/submission). Use current guidance rather than a historical manifest. A verified publishing identity, authenticated endpoint and actual review evidence remain external gates.
- Pinterest's linked Developer/API Terms page returned only navigation in retrieval. A complete legal review was **not** established. Owner must review the terms presented in the portal; no claim of full compliance is made.

## Limits of this audit

No Pinterest OAuth session, approved API response, deployed backend, public cloud account, ChatGPT installation or live image inference was available. No passwords, cookies or access-control workarounds were used. UI screenshots from the previous static-site task are not evidence of a working ChatGPT gallery. See [TESTING](TESTING.md) for exact fixture/protocol results and outstanding live checks.

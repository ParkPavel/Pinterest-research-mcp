# ChatGPT integration — current status and implementation contract

**Not deployed or submitted.** Main is a local stdio connector. [PR #1](https://github.com/ParkPavel/Pinterest-research-mcp/pull/1) is an experimental Streamable HTTP/gallery branch, not a safe multi-user app. Its boolean JWT verifier does not bind users to Pinterest credentials. Do not expose it publicly.

The security-foundation branch hardens local OAuth and introduces explicit-subject token/client adapters. It does not implement a production OAuth provider, hosted browser linking, gallery or vision endpoint. See [architecture](ARCHITECTURE.md), [OAuth](OAUTH.md), [roadmap](../ROADMAP.md), [test ledger](TESTING.md).

## Protocol acceptance for the next backend stage

- Stateless Streamable HTTP must have a verified per-request identity. No request may fall back to the developer's local credentials.
- Protected-resource discovery and challenges must advertise the same canonical HTTPS `/mcp` resource checked by the JWT verifier.
- External OAuth 2.1 authorization server provides discovery, Authorization Code + S256 PKCE and supported client recognition. JWT signature, issuer, audience, required expiry/subject and scopes are checked before tool work.
- UI resources and tool metadata must follow the current OpenAI MCP Apps bridge. Resource registration or successful TypeScript build alone is insufficient evidence of ChatGPT support.
- Discovery should not require tool arguments containing identity or a token. Output schemas must match actual structured content; annotate external read-only tools accurately.
- Future image analysis must deliver actual supported image content to a vision-capable client. A URL string, displayed gallery or instruction to 'analyze' is not a completed analysis pipeline.

## UI contract — follow existing Product Design direction

Reuse `docs/style.css` typography, neutral palette and editorial spacing. Keep a clear account-connection state; accessible board/section selection; source-attributed gallery; per-image metadata; selection count; an explicit analysis action; report with source IDs and observed-vs-inferred distinctions. No Pinterest-like feed imitation, generated stand-ins or fabricated test success.

UI must include loading, disconnected, empty, missing-image, access-denied, rate-limit and expired-authorization states. Authenticate any UI-to-tool bridge calls; messages from arbitrary windows must not inject content. Allow only expected HTTPS Pinterest source/media URLs. Retain original image aspect ratio; use meaningful alt text, keyboard focus and adequate contrast. Verify actual host behavior on desktop and mobile before screenshots enter the release packet.

Current source references (checked 2026-10-19):

- https://developers.openai.com/plugins/build/mcp-server
- https://developers.openai.com/plugins/build/auth
- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/deploy/app-review
- https://developers.openai.com/plugins/deploy/submission

Legacy `/apps-sdk` links currently redirect into these plugin docs. Consult current submission schema and portal before packaging; no historical manifest is represented as approved.

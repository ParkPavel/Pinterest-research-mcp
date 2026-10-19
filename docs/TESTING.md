# Test ledger — 2026-10-19

## Reproduce

```sh
npm ci
npm run check
npm run build
npm test
npm run test:site
npm audit --audit-level=high
```

Tests contain synthetic credentials and data only. They do not call Pinterest, OpenAI or a vision API. Runtime here: Node 24.19.0. Backend CI targets Node 22 and 24.

## Completed evidence

| Check | Observed result | Scope |
| --- | --- | --- |
| Baseline main TypeScript / build | Passed before changes | Source compatibility, not runtime integration |
| Security/protocol suite | 36 tests passed | Expiring/single-use state; redirect/host/method/duplicate query checks; concurrent callback; safe denial/failure; token validation; continuous refresh parameters; refresh rotation/concurrency; logout race; two-user separation; missing-user denial; AES tampering/AAD/key checks; file permissions; pagination; SSRF path rejection; response cap; sanitized errors |
| MCP SDK stdio | Real subprocess connected, eight tools discovered, invalid input rejected, unauthorized tool returned safe error | Local MCP protocol, no successful authorized Pinterest response |
| npm audit | Zero reported advisories at inspection | Registry advisory result, not proof of security |
| Existing site tests | Three tests passed at baseline; rerun after snapshot sync | Static assets/links, tools/privacy consistency, safe Markdown |

OAuth callback tests invoke the actual request handler with synthetic request/response adapters. A first attempt to bind a loopback listener was blocked in this sandbox; no live callback network result is claimed. The suite uses `node --import tsx --test` to avoid tsx CLI IPC restrictions. Filesystem tests exercise actual encryption and atomic writes in temporary directories; per-user refresh tests use an in-memory adapter plus mocked HTTP responses.

A bookmark fixture tests traversal/encoding; a real large-account collection is not available. A 20-request concurrency test proves in-process refresh serialization, not distributed locks. SSRF tests cover this fixed-origin metadata client; there is no image downloader to validate yet. Returned media URLs are not equivalent to verified image bytes.

## Outstanding / blocked

| Required acceptance | Status / dependency |
| --- | --- |
| Pinterest sandbox and real account login/denial/refresh/revoke | Not run; approved app/API access and private credentials required |
| HTTP MCP unauthorized/expired/audience/scope/tenant tests | Not implemented in this branch; gateway/provider integration next |
| Inspector CLI stdio discovery | Passed: official Inspector listed all eight tools via `npm exec --yes --package=@modelcontextprotocol/inspector -- mcp-inspector --cli node dist/index.js --method tools/list`. A subsequent `tools/call` reached the tool and returned a sanitized `STORAGE_ERROR` with Inspector exit 5 (tool error); its subprocess did not receive usable local encryption configuration. This is a negative check, not authorized Pinterest success. HTTP Inspector remains unrun. |
| ChatGPT gallery / mobile / desktop | Not run; deployed authenticated MCP and actual host required |
| Pixel-grounded image analysis | Not implemented; policy permission and supported real image-input path required |
| Distributed store, two real users, crash recovery | Not run; transactional DB and staging required |
| Rate limiting, load/fault injection, graceful shutdown | Not implemented for hosted HTTP |
| Backup restore and deletion tombstones | Not run; production storage policy required |
| Final Pinterest/OpenAI approval and listing | Not submitted / not confirmed |

For each live run record date, immutable commit, environment, tier, test-account aliases, sanitized request IDs and outcome. Do not commit private Pins, account IDs, bearer headers, callback query strings, tokens, cookies or reviewer credentials. A failed or unrun test remains visible in this ledger until actual evidence replaces it.

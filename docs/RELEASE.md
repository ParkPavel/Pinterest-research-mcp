# ChatGPT release packet — blocked draft

No submission has been made. No app is approved or listed. Owner approval is necessary before any public release.

| Field | Proposed value / state |
| --- | --- |
| Name | Visual Research MCP; Pinterest registration candidate: Park Pavel Visual Research MCP. Technical repository URL unchanged. |
| Developer | Park Pavel; publishing identity verification pending |
| Description | Explore your authorized Pinterest boards and Pins with source links. Visual research in ChatGPT is a planned capability pending platform permission and real integration tests. |
| Category | Design / productivity candidate; choose from actual portal options |
| Website | https://parkpavel.github.io/Pinterest-research-mcp/ |
| Privacy | https://parkpavel.github.io/Pinterest-research-mcp/privacy.html — local-prototype policy, must be updated for deployed facts |
| Contact | Public GitHub issue tracker for non-sensitive contact only; private support/privacy contact needs owner selection |
| Icon / listing images | Prepared: docs/assets/icon-512.png, icon-1024.png and social-card.png; see BRAND.md. Developer portal upload and ChatGPT listing validation remain pending. |
| MCP endpoint | Not deployed; exact HTTPS URL pending |
| OAuth | External provider not configured; client recognition, redirect, audience and scopes pending |
| Tools | `pinterest_account`, `pinterest_boards`, `pinterest_board`, `pinterest_board_pins`, `pinterest_pins`, `pinterest_pin`, `pinterest_board_sections`, `pinterest_section_pins` |
| Reviewer credentials | No reviewer account prepared; provide through official secure review fields only |
| Demo / screenshots | No working ChatGPT app captures; static-site screenshots must not be substituted |

## Sample prompts for later validation

- “Show the boards in my connected Pinterest account.”
- “Open this board, list its sections and show the next page of Pins.”
- “Compare the selected references using only images you can actually view; cite each original Pin.”
- “Prepare a visual DNA report for this selected collection; state sample coverage and uncertainty.”
- “Disconnect Pinterest and delete the data held by this service.”

The last three are acceptance goals, not current working features. No competitor benchmarking or private-account bypass is promised.

## Reviewer script / expected outcomes

| Case | Required outcome before submission |
| --- | --- |
| Fresh connection | Genuine MCP OAuth followed by individual Pinterest linking; reviewer can complete without operator assistance |
| Denial and reconnect | Clear denied state; no stale-account fallback; reconnect does not change stable app identity |
| Discovery | Eight read-only tools (plus any deliberately added connection tools) and correct schemas/annotations |
| Board/gallery | Real authorized results and original source links; no invented data |
| Pagination | Bookmark advances without cross-user leakage or silent truncation |
| Vision | Actual pixels delivered; report evidence distinct from interpretation; safe failure when unavailable |
| Error paths | 401/403/429, non-business/Pinner denial, empty results and unavailable upstream handled accurately |
| Tenant isolation | Second account cannot reach first account's tokens, selected collection or report |
| Deletion/revoke | Service deletes its records; provider grant revoked separately; subsequent calls do not succeed with old credentials |
| Mobile/accessibility | Desktop and mobile ChatGPT host rendering, keyboard/focus, image failures and contrast verified |

## Submission gate

Follow [OpenAI submission](https://developers.openai.com/plugins/deploy/submission) and [remote MCP review requirements](https://developers.openai.com/plugins/deploy/app-review). Verify an individual or business publishing identity in the owning OpenAI organization, confirm appropriate write permissions, and complete actual domain/auth/tool scans. Package format and portal fields must be checked at submission time. Never embed secrets in a manifest or ZIP.

All [roadmap gates](../ROADMAP.md) must pass and the owner must approve final submission. Capture the review ID/status/date privately. Treat 'draft created', 'submitted', 'approved', and 'publicly listed' as distinct states. Only mark publication complete after a real approved listing is accessible.

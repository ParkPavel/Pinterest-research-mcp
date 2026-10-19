# Pinterest access review packet — draft, not submitted

Date: 2026-10-19. Operator: **Park Pavel**. Owner reports a Trial denial with no explanation. Dashboard status and app registration date still need owner verification. Do not claim approval or resubmit under a different identity to evade review.

## Public references

- Website: https://parkpavel.github.io/Pinterest-research-mcp/
- Privacy: https://parkpavel.github.io/Pinterest-research-mcp/privacy.html
- Source: https://github.com/ParkPavel/Pinterest-research-mcp
- Support/donations: https://web.tribute.tg/d/SwM (optional; not API entitlement)
- Official appeal route: https://help.pinterest.com/en/contact/ — select API/developer support if offered by the current form.
- App portal: https://developers.pinterest.com/apps/

Official basis: [access tiers and appeals](https://developers.pinterest.com/docs/key-concepts/access-tiers/), [Developer Guidelines](https://policy.pinterest.com/en/developer-guidelines), [OAuth](https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/), [Pinner data access notice](https://community.pinterest.biz/t/understanding-the-pinner-data-access-denied-access-error/51738). The current terms must also be reviewed in the portal; their complete text was not retrieved during this audit.

## English use case

Pinterest Research MCP is an independent read-only integration developed by Park Pavel. The proposed service helps an authenticated user navigate boards, sections and Pins available through their own Pinterest authorization, retain links to original Pins, and explore a selected collection of visual references. It does not publish, edit, follow, scrape, collect passwords or cookies, provide unrestricted search, or bypass privacy and account-access restrictions.

The current implementation is a local MCP prototype. A multi-user hosted service, real-account tests and ChatGPT gallery verification are not complete. We propose user-requested visual analysis in ChatGPT, subject to Pinterest's confirmation that this processing and its data handling are permitted. We will not activate that processing or retain Pinterest content outside the approved scope.

## Requested data and why

| Scope | Data | Purpose |
| --- | --- | --- |
| `boards:read` | Accessible board/section IDs, names, descriptions, pagination | User chooses their collection |
| `pins:read` | Authorized Pins, titles, descriptions, media URLs, original source links | View references; proposed visual processing only if approved |
| `user_accounts:read` | Authorized account information | Show which account is connected and support correct linking |

No write, advertising, secret-board extension or unrelated scopes are requested. An API grant does not prove access to all public content. Ask Pinterest about non-business-account limits and whether the app needs broader Pinner data approval; do not promise it.

OAuth credentials are retained encrypted to maintain authorization. The application does not persist a Pin/image database. ChatGPT processing and retention are separate third-party processing and require clarification; consent alone is not asserted to override Pinterest terms.

## Redirect URI register

| Environment | Value | Status |
| --- | --- | --- |
| Local developer callback | `http://127.0.0.1:8765/callback` | Implemented locally; Pinterest acceptance must be checked |
| Staging | Exact HTTPS origin plus `/auth/pinterest/callback` | Pending host selection and implementation; do not enter a placeholder |
| Production | Exact production HTTPS origin plus `/auth/pinterest/callback` | Pending host selection and implementation; must differ from staging |

The GitHub Pages page is documentation, not a token-exchange server. Do not register it as the production OAuth callback. ChatGPT → MCP OAuth uses a different provider and callback.

## Reconsideration message (owner reviews and sends)

Subject: Request for clarification and reconsideration — Pinterest Research MCP Trial access

Hello Pinterest Developer Support,

I am Park Pavel, developer of Pinterest Research MCP. My Trial API access request was declined without a specific explanation in the app dashboard or an email that I could locate. Please identify the reason and the remediation or review process appropriate for this application.

The public project and privacy policy are linked above. The app is an experimental, read-only MCP integration for a user's authorized boards and Pins. It requests only boards:read, pins:read and user_accounts:read. Login uses Pinterest OAuth rather than passwords, session cookies or scraping. Local credential-security work and tests are available in the repository; hosted multi-user OAuth and live testing remain incomplete.

Before implementing third-party AI processing, please clarify whether sending user-selected Pin metadata and image inputs to ChatGPT for on-demand inference is permitted, what disclosures or processing restrictions apply, and whether transient processing or user-held research reports require additional permission. We do not propose model training or fine-tuning, competitor benchmarking or unrestricted account research. Please also clarify any additional Pinner-data approval needed for the intended account/content types.

Should I wait for your review, update the existing application or submit a new request after remediation? I will follow the required process. I can provide the app ID and denial date privately through this support ticket.

Thank you,
Park Pavel

Do not paste secrets into this message. The owner supplies the app ID and denial date only in the private support form. This draft has **not** been sent. Wait for support instructions before a duplicate Trial request. Standard application remains ineligible until Trial is confirmed and an upgrade option is available.

## Future Standard-access demonstration (real data only)

1. Start with a disconnected test account and explain the read-only use case and data notice.
2. Show the genuine Pinterest consent screen and the exact minimal scopes; obscure codes/tokens throughout.
3. Return to the app with the correct account identity; list boards, sections and a real board page.
4. Open a real Pin source, follow a bookmark to a next page and show a controlled denial/empty state.
5. If approved and implemented, select references and demonstrate actual image input plus a source-linked report. If not implemented, omit this claim.
6. Disconnect/delete local service records and revoke Pinterest access. Show a subsequent call fails/requires reconnect.
7. Record software commit, environment and API tier, not credentials. No wireframes or fixtures may be presented as live integration evidence.
